import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAuth, getAuth, Auth, Persistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { firebaseConfig } from '@/constants/firebaseConfig';

// Firebase v12 removed getReactNativePersistence from the public API.
// Replicate the same behaviour by implementing the internal persistence interface.
const reactNativePersistence: Persistence = {
  type: 'LOCAL' as const,
  _isAvailable: () => Promise.resolve(true),
  _get: (key: string) => AsyncStorage.getItem(key),
  _set: (key: string, value: string) => AsyncStorage.setItem(key, value),
  _remove: (key: string) => AsyncStorage.removeItem(key),
  _addListener: () => {},
  _removeListener: () => {},
} as unknown as Persistence;

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

let auth: Auth;
try {
  auth = initializeAuth(app, {
    persistence: reactNativePersistence,
  });
} catch (e: any) {
  if (e.code === 'auth/already-initialized') {
    auth = getAuth(app);
  } else {
    throw e;
  }
}

export { auth };
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
