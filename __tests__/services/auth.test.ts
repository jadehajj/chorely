jest.mock('expo-apple-authentication', () => ({ signInAsync: jest.fn(), AppleAuthenticationScope: { FULL_NAME: 0, EMAIL: 1 } }));
jest.mock('@react-native-google-signin/google-signin', () => ({ GoogleSignin: { configure: jest.fn(), hasPlayServices: jest.fn(), signIn: jest.fn() } }));
jest.mock('firebase/auth', () => ({
  signInWithCredential: jest.fn(),
  signOut: jest.fn(),
  OAuthProvider: jest.fn().mockImplementation(() => ({ credential: jest.fn() })),
  GoogleAuthProvider: { credential: jest.fn() },
}));
jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  setDoc: jest.fn(),
  getDoc: jest.fn().mockResolvedValue({ exists: () => true }),
  serverTimestamp: jest.fn(),
}));
jest.mock('@/services/firebase', () => ({ auth: {}, db: {} }));

import { signOut } from 'firebase/auth';
import { signOutUser } from '@/services/auth';

describe('auth service', () => {
  it('calls Firebase signOut on signOutUser', async () => {
    (signOut as jest.Mock).mockResolvedValue(undefined);
    await signOutUser();
    expect(signOut).toHaveBeenCalled();
  });
});
