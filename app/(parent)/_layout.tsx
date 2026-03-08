import { Stack, Redirect } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';

export default function ParentLayout() {
  const { uid, role, isLoading } = useAuthStore();
  if (isLoading) return null;
  if (!uid) return <Redirect href="/(auth)/paywall" />;
  if (role === 'kid') return <Redirect href="/(kid)/view" />;
  return <Stack screenOptions={{ headerShown: false }} />;
}
