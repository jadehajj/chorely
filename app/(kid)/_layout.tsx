import { Stack, Redirect } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';

export default function KidLayout() {
  const { uid, role, isLoading } = useAuthStore();
  if (isLoading) return null;
  if (!uid) return <Redirect href="/(auth)/paywall" />;
  if (role === 'parent') return <Redirect href="/(parent)/dashboard" />;
  return <Stack screenOptions={{ headerShown: false }} />;
}
