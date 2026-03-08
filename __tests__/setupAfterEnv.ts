// Mock firebase/auth to avoid auth/invalid-api-key errors in test environment.
// Real Firebase credentials are not available in jest; the test only checks module
// initialization does not crash.
jest.mock('firebase/auth', () => {
  const mockApp: Record<string, unknown> = {};
  const mockAuth = { app: mockApp, currentUser: null };
  return {
    initializeAuth: jest.fn(() => mockAuth),
    getAuth: jest.fn(() => mockAuth),
    getReactNativePersistence: jest.fn(() => ({})),
  };
});
