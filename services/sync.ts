import { subscribeToFamily } from './firestore';
import { subscribeToCompletionNotifications } from './notifications';

let unsubs: (() => void)[] = [];

export function startSync(
  familyId: string,
  role?: 'parent' | 'kid',
  linkedChildId?: string | null,
) {
  stopSync();
  unsubs = subscribeToFamily(familyId);
  if (role) {
    unsubs.push(subscribeToCompletionNotifications(familyId, role, linkedChildId ?? null));
  }
}

export function stopSync() {
  unsubs.forEach((u) => u());
  unsubs = [];
}
