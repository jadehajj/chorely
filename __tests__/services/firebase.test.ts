import { getApp } from 'firebase/app';

describe('Firebase initialization', () => {
  it('initializes without throwing', () => {
    require('@/services/firebase');
    expect(() => getApp()).not.toThrow();
  });
});
