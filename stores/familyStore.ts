import { create } from 'zustand';

export interface Child {
  id: string;
  name: string;
  avatarEmoji: string;
  colorTheme: string;
  rewardMode: 'money' | 'emoji';
  rewardEmoji: string;
  balance: number;
  linkedDeviceId: string | null;
  birthYear?: number;
  birthMonth?: number;
}

export interface Family {
  id: string;
  name: string;
  joinCode: string;
  verificationMode: 'self' | 'approval';
  currency: string;
  tierProductId: string;
  parentIds: string[];
}

interface FamilyState {
  family: Family | null;
  children: Child[];
  setFamily: (family: Family) => void;
  setChildren: (children: Child[]) => void;
  updateChild: (id: string, updates: Partial<Child>) => void;
  addChild: (child: Child) => void;
}

export const useFamilyStore = create<FamilyState>((set) => ({
  family: null,
  children: [],
  setFamily: (family) => set({ family }),
  setChildren: (children) => set({ children }),
  updateChild: (id, updates) =>
    set((state) => ({
      children: state.children.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    })),
  addChild: (child) => set((state) => ({ children: [...state.children, child] })),
}));
