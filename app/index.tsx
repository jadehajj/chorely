import { Redirect } from 'expo-router';
import { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useFamilyStore } from '@/stores/familyStore';
import { useChoresStore } from '@/stores/choresStore';
import { useCompletionsStore } from '@/stores/completionsStore';
import { SCREENSHOT_MODE } from '@/utils/screenshotMode';

// SCREENSHOT_SCREEN controls which screen to show. Options:
// 'dashboard' | 'chore-builder' | 'approval' | 'kid-view' | 'paywall' | 'sign-in'
const SCREENSHOT_SCREEN = 'kid-view';

function useSeedDemoData() {
  const { setAuth } = useAuthStore();
  const { setFamily, setChildren } = useFamilyStore();
  const { setChores } = useChoresStore();
  const { setCompletions } = useCompletionsStore();

  useEffect(() => {
    if (!SCREENSHOT_MODE) return;
    setFamily({ id: 'demo', name: 'The Smith Family', joinCode: '123456', verificationMode: 'approval', currency: 'AUD', tierProductId: 'com.chorely.family', parentIds: ['parent1'] });
    setChildren([
      { id: 'child1', name: 'Emma', avatarEmoji: '🦄', colorTheme: '#7C6CF8', rewardMode: 'money', rewardEmoji: '⭐', balance: 12.50, linkedDeviceId: null },
      { id: 'child2', name: 'Jake', avatarEmoji: '🦊', colorTheme: '#F87C6C', rewardMode: 'emoji', rewardEmoji: '🌟', balance: 8.00, linkedDeviceId: null },
    ]);
    setChores([
      { id: 'c1', name: 'Make Bed', iconEmoji: '🛏️', schedule: 'daily', value: 1.00, assignedChildId: 'child1', requiresApproval: false, isActive: true },
      { id: 'c2', name: 'Vacuum Living Room', iconEmoji: '🧹', schedule: 'weekly', value: 3.00, assignedChildId: 'child1', requiresApproval: true, isActive: true },
      { id: 'c3', name: 'Wash Dishes', iconEmoji: '🍽️', schedule: 'daily', value: 1.50, assignedChildId: 'child2', requiresApproval: false, isActive: true },
      { id: 'c4', name: 'Walk the Dog', iconEmoji: '🐕', schedule: 'daily', value: 2.00, assignedChildId: 'child2', requiresApproval: true, isActive: true },
    ]);
    setCompletions([
      { id: 'comp1', choreId: 'c2', childId: 'child1', status: 'pending', photoUrl: null, submittedAt: new Date(), reviewedAt: null, rejectionReason: null },
    ]);
    if (SCREENSHOT_SCREEN === 'kid-view') {
      setAuth('child1', 'kid', 'demo', 'child1');
    } else {
      setAuth('parent1', 'parent', 'demo', null);
    }
  }, []);
}

const SCREEN_MAP: Record<string, string> = {
  'dashboard': '/(parent)/dashboard',
  'chore-builder': '/(shared)/chore-builder',
  'approval': '/(shared)/approval-queue',
  'kid-view': '/(kid)/view',
  'sign-in': '/(auth)/sign-in',
  'paywall': '/(auth)/paywall',
};

export default function Index() {
  useSeedDemoData();
  const { uid, role, familyId, linkedChildId, isLoading } = useAuthStore();

  if (SCREENSHOT_MODE && uid) return <Redirect href={SCREEN_MAP[SCREENSHOT_SCREEN] as any} />;

  if (isLoading) return null;
  if (!uid) return <Redirect href="/(auth)/explainer" />;

  // Parent with no family yet → guide them through setup
  if (role === 'parent' && !familyId) return <Redirect href="/(auth)/welcome" />;
  if (role === 'parent') return <Redirect href="/(parent)/dashboard" />;

  if (role === 'kid' && linkedChildId) return <Redirect href="/(kid)/view" />;
  if (role === 'kid') return <Redirect href="/(kid)/entry" />;

  return <Redirect href="/(auth)/onboarding" />;
}
