import {
  collection, doc, addDoc, setDoc, updateDoc,
  onSnapshot, query, where, orderBy, serverTimestamp,
  getDoc, getDocs, writeBatch, arrayUnion, Unsubscribe,
} from 'firebase/firestore';
import { db } from '@/services/firebase';
import { useFamilyStore } from '@/stores/familyStore';
import { useChoresStore } from '@/stores/choresStore';
import { useCompletionsStore } from '@/stores/completionsStore';

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

// Completions
export async function submitCompletion(
  familyId: string,
  choreId: string,
  childId: string,
  photoUrl: string | null,
  requiresApproval: boolean,
): Promise<string> {
  const status = requiresApproval ? 'pending' : 'approved';
  const ref = await addDoc(collection(db, 'families', familyId, 'completions'), {
    choreId, childId, status, photoUrl,
    submittedAt: serverTimestamp(),
    reviewedAt: null,
    rejectionReason: null,
  });

  if (!requiresApproval) {
    await creditBalance(familyId, choreId, childId, ref.id);
  }

  return ref.id;
}

export async function approveCompletion(
  familyId: string,
  completionId: string,
  choreId: string,
  childId: string,
): Promise<void> {
  await updateDoc(doc(db, 'families', familyId, 'completions', completionId), {
    status: 'approved',
    reviewedAt: serverTimestamp(),
  });
  await creditBalance(familyId, choreId, childId, completionId);
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

async function creditBalance(
  familyId: string,
  choreId: string,
  childId: string,
  completionId: string,
): Promise<void> {
  const choreSnap = await getDoc(doc(db, 'families', familyId, 'chores', choreId));
  if (!choreSnap.exists()) return;
  const chore = choreSnap.data();

  const childSnap = await getDoc(doc(db, 'families', familyId, 'children', childId));
  if (!childSnap.exists()) return;
  const current = childSnap.data().balance ?? 0;

  const batch = writeBatch(db);
  batch.update(doc(db, 'families', familyId, 'children', childId), { balance: current + chore.value });
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

// Manual balance adjustment
export async function adjustBalance(
  familyId: string,
  childId: string,
  amount: number,
  description: string,
): Promise<void> {
  const childSnap = await getDoc(doc(db, 'families', familyId, 'children', childId));
  if (!childSnap.exists()) return;
  const current = childSnap.data().balance ?? 0;

  const batch = writeBatch(db);
  batch.update(doc(db, 'families', familyId, 'children', childId), { balance: current + amount });
  const txRef = doc(collection(db, 'families', familyId, 'transactions'));
  batch.set(txRef, {
    childId, type: amount >= 0 ? 'manual' : 'deducted',
    amount, description,
    completionId: null,
    createdAt: serverTimestamp(),
  });
  await batch.commit();
}

// Join codes
export async function generateJoinCode(familyId: string): Promise<string> {
  const code = 'CHORELY-' + Math.random().toString(36).slice(2, 6).toUpperCase();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await updateDoc(doc(db, 'families', familyId), { joinCode: code, joinCodeExpiresAt: expiresAt });
  return code;
}

export async function joinFamily(uid: string, code: string): Promise<void> {
  const snap = await getDocs(
    query(collection(db, 'families'), where('joinCode', '==', code))
  );
  if (snap.empty) throw new Error('Invalid or expired code');
  const family = snap.docs[0];
  const data = family.data();
  if (new Date() > data.joinCodeExpiresAt.toDate()) throw new Error('Code has expired');

  const batch = writeBatch(db);
  batch.update(doc(db, 'families', family.id), {
    parentIds: arrayUnion(uid),
  });
  batch.set(doc(db, 'users', uid), { familyId: family.id, role: 'parent', linkedChildId: null }, { merge: true });
  await batch.commit();
}

export async function generateKidDeviceCode(familyId: string, childId: string): Promise<string> {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  await setDoc(doc(db, 'kidCodes', code), { familyId, childId, expiresAt });
  return code;
}

export async function redeemKidCode(uid: string, code: string): Promise<void> {
  const codeSnap = await getDoc(doc(db, 'kidCodes', code));
  if (!codeSnap.exists()) throw new Error('Invalid code');
  const data = codeSnap.data();
  if (new Date() > data.expiresAt.toDate()) throw new Error('Code expired');

  const batch = writeBatch(db);
  batch.set(doc(db, 'users', uid), {
    role: 'kid', familyId: data.familyId, linkedChildId: data.childId,
  }, { merge: true });
  batch.update(doc(db, 'families', data.familyId, 'children', data.childId), { linkedDeviceId: uid });
  batch.delete(doc(db, 'kidCodes', code));
  await batch.commit();
}
