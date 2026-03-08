import { create } from 'zustand';

export type UserRole = 'parent' | 'kid' | null;

interface AuthState {
  uid: string | null;
  role: UserRole;
  familyId: string | null;
  linkedChildId: string | null;
  isLoading: boolean;
  setAuth: (uid: string, role: UserRole, familyId: string, linkedChildId?: string) => void;
  clearAuth: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  uid: null,
  role: null,
  familyId: null,
  linkedChildId: null,
  isLoading: true,
  setAuth: (uid, role, familyId, linkedChildId = null) =>
    set({ uid, role, familyId, linkedChildId, isLoading: false }),
  clearAuth: () =>
    set({ uid: null, role: null, familyId: null, linkedChildId: null, isLoading: false }),
  setLoading: (isLoading) => set({ isLoading }),
}));
