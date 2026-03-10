import {
  signInWithCredential,
  signOut,
  OAuthProvider,
  GoogleAuthProvider,
  UserCredential,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { auth, db } from '@/services/firebase';

// On iOS the client ID is read automatically from GoogleService-Info.plist.
// webClientId (serverClientID) is only needed for server-side auth code flows;
// passing an iOS client ID here breaks the OAuth flow on Google's servers.
GoogleSignin.configure({
  ...(process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID
    ? { webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID }
    : {}),
});

function generateNonce(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  for (const byte of bytes) {
    result += chars[byte % chars.length];
  }
  return result;
}

export async function signInWithApple(): Promise<UserCredential> {
  const rawNonce = generateNonce();
  const hashedNonce = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    rawNonce,
  );

  const appleCredential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
    nonce: hashedNonce,
  });

  const provider = new OAuthProvider('apple.com');
  const credential = provider.credential({
    idToken: appleCredential.identityToken!,
    rawNonce,
  });

  const result = await signInWithCredential(auth, credential);
  await ensureUserDoc(result.user.uid, 'parent');
  return result;
}

export async function signInWithGoogle(): Promise<UserCredential> {
  await GoogleSignin.hasPlayServices();
  const response = await GoogleSignin.signIn();
  if (response.type !== 'success') {
    throw new Error('Google sign-in was cancelled');
  }
  const credential = GoogleAuthProvider.credential(response.data.idToken);
  const result = await signInWithCredential(auth, credential);
  await ensureUserDoc(result.user.uid, 'parent');
  return result;
}

export async function signOutUser(): Promise<void> {
  await signOut(auth);
}

async function ensureUserDoc(uid: string, role: 'parent' | 'kid'): Promise<void> {
  // Force the Firestore SDK to pick up the newly-issued auth token before
  // making any read/write. Without this, the first Firestore call can race
  // against token propagation and fail with "Missing or insufficient permissions".
  if (auth.currentUser) {
    await auth.currentUser.getIdToken(/* forceRefresh */ true);
  }
  const ref = doc(db, 'users', uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, { role, familyId: null, linkedChildId: null, createdAt: serverTimestamp() });
  }
}

export async function linkKidDevice(
  uid: string,
  familyId: string,
  childId: string,
): Promise<void> {
  await updateDoc(doc(db, 'users', uid), {
    role: 'kid',
    familyId,
    linkedChildId: childId,
  });
}
