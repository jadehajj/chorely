import { Redirect } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';

export default function Index() {
  const { uid, role, linkedChildId, isLoading } = useAuthStore();

  if (isLoading) return null;
  if (!uid) return <Redirect href="/(auth)/paywall" />;
  if (role === 'parent') return <Redirect href="/(parent)/dashboard" />;
  if (role === 'kid' && linkedChildId) return <Redirect href="/(kid)/view" />;
  if (role === 'kid') return <Redirect href="/(kid)/entry" />;

  // New authenticated user — no role doc yet
  return <Redirect href="/(auth)/onboarding" />;
}
