jest.mock('react-native-iap', () => ({
  initConnection: jest.fn(),
  getProducts: jest.fn(),
  requestPurchase: jest.fn(),
  finishTransaction: jest.fn(),
  getAvailablePurchases: jest.fn(),
}));
jest.mock('@/services/firebase', () => ({ db: {} }));
jest.mock('firebase/firestore', () => ({ doc: jest.fn(), updateDoc: jest.fn() }));

import { getChildLimit } from '@/services/iap';

describe('getChildLimit', () => {
  it('returns 1 for starter', () => {
    expect(getChildLimit('com.chorely.starter')).toBe(1);
  });
  it('returns 3 for family', () => {
    expect(getChildLimit('com.chorely.family')).toBe(3);
  });
  it('returns Infinity for unlimited', () => {
    expect(getChildLimit('com.chorely.unlimited')).toBe(Infinity);
  });
  it('returns 0 for no tier', () => {
    expect(getChildLimit(null)).toBe(0);
  });
});
