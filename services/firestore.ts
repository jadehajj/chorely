import {
  collection, doc, addDoc, setDoc, updateDoc, deleteDoc,
  onSnapshot, query, where, orderBy, serverTimestamp,
  getDoc, getDocs, writeBatch, arrayUnion, increment, Unsubscribe,
} from 'firebase/firestore';
import { db } from '@/services/firebase';
import { useFamilyStore } from '@/stores/familyStore';
import { useChoresStore } from '@/stores/choresStore';
import { useCompletionsStore } from '@/stores/completionsStore';
import { TIER_PARENT_LIMITS, ANNUAL_TO_BASE_TIER } from '@/constants/theme';

// Subscribe to all family data (call once after login)
export function subscribeToFamily(familyId: string): Unsubscribe[] {
  const unsubs: Unsubscribe[] = [];

  // Family doc
  unsubs.push(
    onSnapshot(doc(db, 'families', familyId), (snap) => {
      if (snap.exists()) {
        useFamilyStore.getState().setFamily({ id: snap.id, ...snap.data() } as any);
      }
    })
  );

  // Children
  unsubs.push(
    onSnapshot(collection(db, 'families', familyId, 'children'), (snap) => {
      const children = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      useFamilyStore.getState().setChildren(children as any);
    })
  );

  // Active chores
  unsubs.push(
    onSnapshot(
      query(collection(db, 'families', familyId, 'chores'), where('isActive', '==', true)),
      (snap) => {
        const chores = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        useChoresStore.getState().setChores(chores as any);
      }
    )
  );

  // Completions (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  unsubs.push(
    onSnapshot(
      query(
        collection(db, 'families', familyId, 'completions'),
        where('submittedAt', '>=', thirtyDaysAgo),
        orderBy('submittedAt', 'desc')
      ),
      (snap) => {
        const completions = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
          submittedAt: d.data().submittedAt?.toDate(),
          reviewedAt: d.data().reviewedAt?.toDate() ?? null,
        }));
        useCompletionsStore.getState().setCompletions(completions as any);
      }
    )
  );

  return unsubs;
}

// Create a new family document and link the creator as the first parent.
// Uses writeBatch so both writes succeed or both fail — no partial state.
export async function createFamily(
  uid: string,
  name: string,
  tierProductId: string,
): Promise<string> {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const arr = new Uint8Array(4);
  crypto.getRandomValues(arr);
  const code = 'CHORELY-' + Array.from(arr).map((b) => chars[b % 36]).join('');
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  // Pre-generate the family ref so the batch can reference its ID.
  const familyRef = doc(collection(db, 'families'));
  const batch = writeBatch(db);
  batch.set(familyRef, {
    name,
    joinCode: code,
    joinCodeExpiresAt: expiresAt,
    verificationMode: 'self',
    currency: 'AUD',
    tierProductId,
    parentIds: [uid],
    createdAt: serverTimestamp(),
  });
  batch.set(doc(db, 'users', uid), { familyId: familyRef.id }, { merge: true });
  await batch.commit();
  return familyRef.id;
}

// Chores CRUD
export async function createChore(familyId: string, chore: Omit<any, 'id'>): Promise<string> {
  const ref = await addDoc(collection(db, 'families', familyId, 'chores'), {
    ...chore,
    isActive: true,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateChore(familyId: string, choreId: string, updates: any): Promise<void> {
  await updateDoc(doc(db, 'families', familyId, 'chores', choreId), updates);
}

export async function deleteChore(familyId: string, choreId: string): Promise<void> {
  await updateDoc(doc(db, 'families', familyId, 'chores', choreId), { isActive: false });
}

// Completions — atomic: create completion + credit balance in one batch
export async function submitCompletion(
  familyId: string,
  choreId: string,
  childId: string,
  photoUrl: string | null,
  requiresApproval: boolean,
): Promise<string> {
  const status = requiresApproval ? 'pending' : 'approved';
  const completionRef = doc(collection(db, 'families', familyId, 'completions'));

  if (!requiresApproval) {
    const choreSnap = await getDoc(doc(db, 'families', familyId, 'chores', choreId));
    if (!choreSnap.exists()) throw new Error('Chore not found');
    const chore = choreSnap.data();

    const batch = writeBatch(db);
    batch.set(completionRef, {
      choreId, childId, status, photoUrl,
      submittedAt: serverTimestamp(),
      reviewedAt: null,
      rejectionReason: null,
    });
    batch.update(doc(db, 'families', familyId, 'children', childId), {
      balance: increment(chore.value),
    });
    const txRef = doc(collection(db, 'families', familyId, 'transactions'));
    batch.set(txRef, {
      childId, choreId, completionId: completionRef.id,
      type: 'earned',
      amount: chore.value,
      description: chore.name,
      createdAt: serverTimestamp(),
    });
    await batch.commit();
  } else {
    await setDoc(completionRef, {
      choreId, childId, status, photoUrl,
      submittedAt: serverTimestamp(),
      reviewedAt: null,
      rejectionReason: null,
    });
  }

  return completionRef.id;
}

// Approve completion — atomic: update completion + credit balance in one batch
export async function approveCompletion(
  familyId: string,
  completionId: string,
  choreId: string,
  childId: string,
): Promise<void> {
  const choreSnap = await getDoc(doc(db, 'families', familyId, 'chores', choreId));
  if (!choreSnap.exists()) throw new Error('Chore not found');
  const chore = choreSnap.data();

  const batch = writeBatch(db);
  batch.update(doc(db, 'families', familyId, 'completions', completionId), {
    status: 'approved',
    reviewedAt: serverTimestamp(),
  });
  batch.update(doc(db, 'families', familyId, 'children', childId), {
    balance: increment(chore.value),
  });
  const txRef = doc(collection(db, 'families', familyId, 'transactions'));
  batch.set(txRef, {
    childId, choreId, completionId,
    type: 'earned',
    amount: chore.value,
    description: chore.name,
    createdAt: serverTimestamp(),
  });
  await batch.commit();
}

export async function rejectCompletion(
  familyId: string,
  completionId: string,
  reason: string,
): Promise<void> {
  await updateDoc(doc(db, 'families', familyId, 'completions', completionId), {
    status: 'rejected',
    reviewedAt: serverTimestamp(),
    rejectionReason: reason,
  });
}

// Manual balance adjustment — atomic, uses increment to avoid read-modify-write race
export async function adjustBalance(
  familyId: string,
  childId: string,
  amount: number,
  description: string,
): Promise<void> {
  const batch = writeBatch(db);
  batch.update(doc(db, 'families', familyId, 'children', childId), {
    balance: increment(amount),
  });
  const txRef = doc(collection(db, 'families', familyId, 'transactions'));
  batch.set(txRef, {
    childId, type: amount >= 0 ? 'manual' : 'deducted',
    amount, description,
    completionId: null,
    createdAt: serverTimestamp(),
  });
  await batch.commit();
}

// Join codes — crypto-random to avoid predictability
export async function generateJoinCode(familyId: string): Promise<string> {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const arr = new Uint8Array(4);
  crypto.getRandomValues(arr);
  const suffix = Array.from(arr).map((b) => chars[b % 36]).join('');
  const code = 'CHORELY-' + suffix;
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await updateDoc(doc(db, 'families', familyId), { joinCode: code, joinCodeExpiresAt: expiresAt });
  return code;
}

// Join an existing family as a second parent. Returns the familyId on success.
export async function joinFamily(uid: string, code: string): Promise<string> {
  // Prevent joining a second family
  const existingUser = await getDoc(doc(db, 'users', uid));
  if (existingUser.exists() && existingUser.data().familyId) {
    throw new Error('You are already a member of a family');
  }

  const snap = await getDocs(
    query(collection(db, 'families'), where('joinCode', '==', code))
  );
  if (snap.empty) throw new Error('Invalid or expired code');
  const family = snap.docs[0];
  const data = family.data();
  if (new Date() > data.joinCodeExpiresAt.toDate()) throw new Error('Code has expired');

  // Check parent limit for the family's current tier (handles annual product IDs too)
  const baseTierKey = (ANNUAL_TO_BASE_TIER[data.tierProductId] ?? data.tierProductId) as keyof typeof TIER_PARENT_LIMITS;
  const parentLimit = TIER_PARENT_LIMITS[baseTierKey] ?? 1;
  if ((data.parentIds ?? []).length >= parentLimit) {
    throw new Error('This family has reached the maximum number of parents for its plan. Ask the owner to upgrade.');
  }

  const batch = writeBatch(db);
  batch.update(doc(db, 'families', family.id), {
    parentIds: arrayUnion(uid),
  });
  batch.set(doc(db, 'users', uid), { familyId: family.id, role: 'parent', linkedChildId: null }, { merge: true });
  await batch.commit();

  return family.id;
}

export async function generateKidDeviceCode(familyId: string, childId: string): Promise<string> {
  const arr = new Uint32Array(1);
  crypto.getRandomValues(arr);
  const code = String(100000 + (arr[0] % 900000));
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  await setDoc(doc(db, 'kidCodes', code), { familyId, childId, expiresAt });
  return code;
}

// Redeem a 6-digit kid device code. Returns the familyId + childId on success.
export async function redeemKidCode(
  uid: string,
  code: string,
): Promise<{ familyId: string; childId: string }> {
  const codeSnap = await getDoc(doc(db, 'kidCodes', code));
  if (!codeSnap.exists()) throw new Error('Invalid code');
  const data = codeSnap.data();
  if (new Date() > data.expiresAt.toDate()) throw new Error('Code expired');

  // Prevent re-linking an already-linked child
  const childSnap = await getDoc(doc(db, 'families', data.familyId, 'children', data.childId));
  if (childSnap.exists() && childSnap.data().linkedDeviceId) {
    throw new Error('This child already has a linked device');
  }

  const batch = writeBatch(db);
  batch.set(doc(db, 'users', uid), {
    role: 'kid', familyId: data.familyId, linkedChildId: data.childId,
  }, { merge: true });
  batch.update(doc(db, 'families', data.familyId, 'children', data.childId), { linkedDeviceId: uid });
  batch.delete(doc(db, 'kidCodes', code));
  await batch.commit();

  return { familyId: data.familyId, childId: data.childId };
}

// ─── Child CRUD ───────────────────────────────────────────────────────────────

export async function addChild(
  familyId: string,
  data: {
    name: string;
    avatarEmoji: string;
    colorTheme: string;
    rewardMode: 'money' | 'emoji';
    rewardEmoji: string;
    birthYear?: number | null;
  },
): Promise<string> {
  const { birthYear, ...rest } = data;
  const ref = await addDoc(collection(db, 'families', familyId, 'children'), {
    ...rest,
    ...(birthYear ? { birthYear } : {}),
    balance: 0,
    linkedDeviceId: null,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateChild(
  familyId: string,
  childId: string,
  updates: Partial<{
    name: string;
    avatarEmoji: string;
    colorTheme: string;
    rewardMode: 'money' | 'emoji';
    rewardEmoji: string;
    birthYear: number | null;
  }>,
): Promise<void> {
  await updateDoc(doc(db, 'families', familyId, 'children', childId), updates);
}

// Delete a child with full cascade:
// 1. Deactivates all their assigned chores (soft delete — keeps completion history intact)
// 2. Unlinks their device's user document so the kid device reverts to the onboarding flow
// 3. Deletes the child document
// All three writes are batched for atomicity.
export async function deleteChild(familyId: string, childId: string): Promise<void> {
  const [childSnap, choreSnap] = await Promise.all([
    getDoc(doc(db, 'families', familyId, 'children', childId)),
    getDocs(query(
      collection(db, 'families', familyId, 'chores'),
      where('assignedChildId', '==', childId),
      where('isActive', '==', true),
    )),
  ]);

  const linkedDeviceId = childSnap.exists() ? childSnap.data().linkedDeviceId : null;

  const batch = writeBatch(db);
  batch.delete(doc(db, 'families', familyId, 'children', childId));

  // Soft-delete chores so completion history is preserved
  choreSnap.docs.forEach((choreDoc) => {
    batch.update(choreDoc.ref, { isActive: false });
  });

  // Unlink the device so the kid is returned to onboarding
  if (linkedDeviceId) {
    batch.set(doc(db, 'users', linkedDeviceId), {
      role: 'parent',
      linkedChildId: null,
    }, { merge: true });
  }

  await batch.commit();
}
