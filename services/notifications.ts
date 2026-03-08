import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { collection, onSnapshot, query, where, doc, updateDoc, Unsubscribe } from 'firebase/firestore';
import { db } from '@/services/firebase';

// Show notifications when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerForPushNotifications(uid: string): Promise<string | null> {
  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
      });
    }

    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      return null;
    }

    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: Constants.expoConfig?.extra?.eas?.projectId,
    });

    const token = tokenData.data;
    // Persist token so server-side functions can send remote push notifications
    await updateDoc(doc(db, 'users', uid), { fcmToken: token }).catch(() => {});
    return token;
  } catch (e: unknown) {
    console.warn('registerForPushNotifications failed:', e);
    return null;
  }
}

// Subscribe to completion changes and fire local notifications
export function subscribeToCompletionNotifications(
  familyId: string,
  role: 'parent' | 'kid',
  linkedChildId: string | null,
): Unsubscribe {
  let firstSnapshot = true;

  if (role === 'parent') {
    // Notify parent when a new completion needs their approval
    return onSnapshot(
      query(
        collection(db, 'families', familyId, 'completions'),
        where('status', '==', 'pending'),
      ),
      (snap) => {
        if (firstSnapshot) { firstSnapshot = false; return; }
        snap.docChanges().forEach((change) => {
          if (change.type === 'added') {
            sendLocalNotification(
              'Chore needs review',
              'A child submitted a chore for your approval.',
            ).catch(() => {});
          }
        });
      },
    );
  }

  if (role === 'kid' && linkedChildId) {
    // Notify kid when their pending completion is approved or rejected
    const prevStatuses = new Map<string, string>();
    return onSnapshot(
      query(
        collection(db, 'families', familyId, 'completions'),
        where('childId', '==', linkedChildId),
      ),
      (snap) => {
        if (firstSnapshot) {
          snap.docs.forEach((d) => prevStatuses.set(d.id, d.data().status as string));
          firstSnapshot = false;
          return;
        }
        snap.docChanges().forEach((change) => {
          if (change.type === 'modified') {
            const data = change.doc.data();
            const prev = prevStatuses.get(change.doc.id);
            prevStatuses.set(change.doc.id, data.status as string);
            if (prev === 'pending' && data.status === 'approved') {
              sendLocalNotification('Chore approved! 🎉', 'Great job! You earned your reward.').catch(() => {});
            } else if (prev === 'pending' && data.status === 'rejected') {
              sendLocalNotification('Chore not approved', (data.rejectionReason as string) || 'Keep trying!').catch(() => {});
            }
          }
        });
      },
    );
  }

  return () => {};
}

export async function scheduleChoreReminder(
  childName: string,
  choreName: string,
  triggerDate: Date,
): Promise<string> {
  return Notifications.scheduleNotificationAsync({
    content: {
      title: `Chore reminder for ${childName}`,
      body: `Time to do: ${choreName}`,
      sound: true,
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: triggerDate },
  });
}

export async function cancelReminder(notificationId: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}

export async function sendLocalNotification(title: string, body: string): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: { title, body, sound: true },
    trigger: null,
  });
}
