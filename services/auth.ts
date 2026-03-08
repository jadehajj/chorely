import {
  signInWithCredential,
  signOut,
  OAuthProvider,
  GoogleAuthProvider,
  UserCredential,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import * as AppleAuthentication from 'expo-apple-authentication';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { auth, db } from '@/services/firebase';

GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
});

export async function signInWithApple(): Promise<UserCredential> {
  const appleCredential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
  });

  const provider = new OAuthProvider('apple.com');
  const credential = provider.credential({
    idToken: appleCredential.identityToken!,
    rawNonce: appleCredential.authorizationCode!,
  });

  const result = await signInWithCredential(auth, credential);
  await ensureUserDoc(result.user.uid, 'parent');
  return result;
}

export async function signInWithGoogle(): Promise<UserCredential> {
  await GoogleSignin.hasPlayServices();
  const { idToken } = await GoogleSignin.signIn();
  const credential = GoogleAuthProvider.credential(idToken);
  const result = await signInWithCredential(auth, credential);
  await ensureUserDoc(result.user.uid, 'parent');
  return result;
}

export async function signOutUser(): Promise<void> {
  await signOut(auth);
}

async function ensureUserDoc(uid: string, role: 'parent' | 'kid'): Promise<void> {
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
  await setDoc(doc(db, 'users', uid), {
    role: 'kid',
    familyId,
    linkedChildId: childId,
  });
}
