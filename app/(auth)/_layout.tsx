import { Stack, Redirect } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';

export default function AuthLayout() {
  const { uid, role } = useAuthStore();
  if (uid && role === 'parent') return <Redirect href="/(parent)/dashboard" />;
  if (uid && role === 'kid') return <Redirect href="/(kid)/view" />;
  return <Stack screenOptions={{ headerShown: false }} />;
}
