import { create } from 'zustand';

export interface Chore {
  id: string;
  name: string;
  iconEmoji: string;
  schedule: 'daily' | 'weekly' | 'once' | string[];
  value: number;
  assignedChildId: string;
  requiresApproval: boolean;
  isActive: boolean;
}

interface ChoresState {
  chores: Chore[];
  setChores: (chores: Chore[]) => void;
  addChore: (chore: Chore) => void;
  updateChore: (id: string, updates: Partial<Chore>) => void;
  removeChore: (id: string) => void;
}

export const useChoresStore = create<ChoresState>((set) => ({
  chores: [],
  setChores: (chores) => set({ chores }),
  addChore: (chore) => set((state) => ({ chores: [...state.chores, chore] })),
  updateChore: (id, updates) =>
    set((state) => ({
      chores: state.chores.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    })),
  removeChore: (id) =>
    set((state) => ({ chores: state.chores.filter((c) => c.id !== id) })),
}));
