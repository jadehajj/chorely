// Mock expo winter globals to avoid jest v30 lazy-import-outside-scope errors.
// In jest v30, lazy getters that trigger require() outside test scope throw a ReferenceError.
// Defining these globals eagerly prevents the lazy evaluation from happening.
Object.defineProperty(global, '__ExpoImportMetaRegistry', {
  value: { url: '' },
  configurable: true,
  writable: true,
});

// structuredClone is available natively in Node 17+, but expo's winter runtime
// tries to install a polyfill lazily which fails in jest v30's stricter module scope.
if (typeof global.structuredClone === 'undefined') {
  global.structuredClone = (obj: unknown) => JSON.parse(JSON.stringify(obj));
}

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
