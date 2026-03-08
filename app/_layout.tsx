import '../global.css';
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { LogBox } from 'react-native';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/services/firebase';
import { useAuthStore } from '@/stores/authStore';
import { startSync, stopSync } from '@/services/sync';
import { initDb } from '@/services/offlineCache';
import { registerForPushNotifications } from '@/services/notifications';
import 'react-native-get-random-values';
import { SCREENSHOT_MODE } from '@/utils/screenshotMode';

if (SCREENSHOT_MODE) {
  LogBox.ignoreAllLogs();
}

export default function RootLayout() {
  const { setAuth, clearAuth, setLoading } = useAuthStore();

  useEffect(() => {
    initDb();
  }, []);

  useEffect(() => {
    if (SCREENSHOT_MODE) return; // skip Firebase auth in screenshot mode
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            setAuth(user.uid, data.role, data.familyId, data.linkedChildId);
            if (data.familyId) startSync(data.familyId, data.role, data.linkedChildId);
            registerForPushNotifications(user.uid).catch(() => {});
          } else {
            // New user — no user doc yet, route to paywall
            setLoading(false);
          }
        } catch {
          setLoading(false);
        }
      } else {
        stopSync();
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
