import { create } from 'zustand';

export interface Completion {
  id: string;
  choreId: string;
  childId: string;
  status: 'pending' | 'approved' | 'rejected';
  photoUrl: string | null;
  submittedAt: Date;
  reviewedAt: Date | null;
  rejectionReason: string | null;
}

interface CompletionsState {
  completions: Completion[];
  setCompletions: (completions: Completion[]) => void;
  addCompletion: (completion: Completion) => void;
  updateCompletion: (id: string, updates: Partial<Completion>) => void;
}

export const useCompletionsStore = create<CompletionsState>((set) => ({
  completions: [],
  setCompletions: (completions) => set({ completions }),
  addCompletion: (completion) =>
    set((state) => ({ completions: [...state.completions, completion] })),
  updateCompletion: (id, updates) =>
    set((state) => ({
      completions: state.completions.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    })),
}));
