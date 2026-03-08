import '../global.css';
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/services/firebase';
import { useAuthStore } from '@/stores/authStore';
import 'react-native-get-random-values';

export default function RootLayout() {
  const { setAuth, clearAuth, setLoading } = useAuthStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setAuth(user.uid, data.role, data.familyId, data.linkedChildId);
        } else {
          // New user — no user doc yet, route to paywall
          setLoading(false);
        }
      } else {
        clearAuth();
      }
    });
    return unsubscribe;
  }, []);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(parent)" />
      <Stack.Screen name="(kid)" />
      <Stack.Screen name="(shared)" />
    </Stack>
  );
}
