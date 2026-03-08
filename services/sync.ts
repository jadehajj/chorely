import { subscribeToFamily } from './firestore';

let unsubs: (() => void)[] = [];

export function startSync(familyId: string) {
  stopSync();
  unsubs = subscribeToFamily(familyId);
}

export function stopSync() {
  unsubs.forEach((u) => u());
  unsubs = [];
}
