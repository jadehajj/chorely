export const signInWithCredential = jest.fn();
export const signOut = jest.fn();
export const OAuthProvider = jest.fn().mockImplementation(() => ({
  credential: jest.fn(),
}));
export const GoogleAuthProvider = {
  credential: jest.fn(),
};
