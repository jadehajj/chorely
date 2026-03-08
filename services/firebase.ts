import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAuth, getAuth, Auth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { firebaseConfig } from '@/constants/firebaseConfig';

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Firebase v12 ships getReactNativePersistence only in the RN bundle.
// Metro resolves firebase/auth to the RN build via package exports, but we
// guard with a runtime check so auth always initialises even if it's absent.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const authModule = require('firebase/auth');
const rnPersistence =
  typeof authModule.getReactNativePersistence === 'function'
    ? authModule.getReactNativePersistence(AsyncStorage)
    : authModule.inMemoryPersistence;

let auth: Auth;
try {
  auth = initializeAuth(app, { persistence: rnPersistence });
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
