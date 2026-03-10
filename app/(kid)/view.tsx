import { useState } from 'react';
import { View, ScrollView, SafeAreaView, Alert, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Text } from '@/components/ui/Text';
import { ChoreCard } from '@/components/kid/ChoreCard';
import { CelebrationOverlay } from '@/components/kid/CelebrationOverlay';
import { useAuthStore } from '@/stores/authStore';
import { useFamilyStore } from '@/stores/familyStore';
import { useChoresStore, type Chore } from '@/stores/choresStore';
import { useCompletionsStore, type Completion } from '@/stores/completionsStore';
import { submitCompletion } from '@/services/firestore';
import { uploadCompletionPhoto } from '@/services/photoUpload';
import { formatBalance, formatReward } from '@/utils/formatReward';

export default function KidView() {
  const { linkedChildId } = useAuthStore();
  const { family, children } = useFamilyStore();
  const { chores } = useChoresStore();
  const { completions } = useCompletionsStore();
  const [celebrating, setCelebrating] = useState(false);
  const [celebrationMsg, setCelebrationMsg] = useState('');
  const [uploadingChoreId, setUploadingChoreId] = useState<string | null>(null);

  const child = children.find((c) => c.id === linkedChildId);
  if (!child || !family) return null;

  const myChores = chores.filter((c) => c.assignedChildId === linkedChildId);
  const myCompletions = completions.filter((c) => c.childId === linkedChildId);

  // ── Schedule-aware completion lookup ────────────────────────────────────────
  // daily  → relevant window = today
  // weekly → relevant window = this calendar week (Sun–Sat)
  // once   → any completion ever (approved blocks re-submission)
  function getRelevantCompletion(chore: Chore): Completion | undefined {
    const choreCompletions = myCompletions
      .filter((c) => c.choreId === chore.id)
      .sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime()); // newest first

    if (chore.schedule === 'daily') {
      return choreCompletions.find((c) => isToday(c.submittedAt));
    }
    if (chore.schedule === 'weekly') {
      return choreCompletions.find((c) => isThisWeek(c.submittedAt));
    }
    // 'once': return the most recent completion ever so the card shows its status
    return choreCompletions[0];
  }

  // ── Handlers ────────────────────────────────────────────────────────────────

  async function handleChoreComplete(chore: Chore, source: 'camera' | 'library' | 'none') {
    const requiresApproval = family!.verificationMode === 'approval' || chore.requiresApproval;
    let photoUrl: string | null = null;

    if (source !== 'none') {
      const result =
        source === 'camera'
          ? await ImagePicker.launchCameraAsync({
              mediaTypes: 'images',
              quality: 0.8,
              allowsEditing: true,
              aspect: [4, 3],
            })
          : await ImagePicker.launchImageLibraryAsync({
              mediaTypes: 'images',
              quality: 0.8,
              allowsEditing: true,
              aspect: [4, 3],
            });

      if (result.canceled) return;

      setUploadingChoreId(chore.id);
      try {
        photoUrl = await uploadCompletionPhoto(family!.id, result.assets[0].uri);
      } catch {
        setUploadingChoreId(null);
        Alert.alert('Upload failed', 'Could not upload photo. Try again or skip the photo.');
        return;
      }
      setUploadingChoreId(null);
    }

    try {
      await submitCompletion(family!.id, chore.id, child!.id, photoUrl, requiresApproval);
      if (!requiresApproval) {
        // Bug #19 fix: use formatReward so emoji-mode kids see "5 ⭐" not "5"
        setCelebrationMsg(
          `${chore.iconEmoji}\n+${formatReward(child!, chore.value, family!.currency)}!`,
        );
        setCelebrating(true);
      } else {
        Alert.alert('Submitted!', 'Waiting for Mum or Dad to approve 👍');
      }
    } catch (e: unknown) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Please try again.');
    }
  }

  async function handleChorePress(chore: Chore) {
    const existing = getRelevantCompletion(chore);
    // Bug #3 fix: block pending/approved; allow retry if rejected
    if (existing && existing.status !== 'rejected') return;

    const requiresApproval = family!.verificationMode === 'approval' || chore.requiresApproval;

    if (requiresApproval) {
      Alert.alert(
        'Add proof photo?',
        'A photo helps Mum or Dad confirm you did the chore!',
        [
          { text: '📷 Take Photo', onPress: () => handleChoreComplete(chore, 'camera') },
          { text: '🖼 Choose Photo', onPress: () => handleChoreComplete(chore, 'library') },
          { text: 'Submit without photo', onPress: () => handleChoreComplete(chore, 'none') },
          { text: 'Cancel', style: 'cancel' },
        ],
      );
    } else {
      await handleChoreComplete(chore, 'none');
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {uploadingChoreId !== null && (
        <View className="absolute inset-0 z-50 items-center justify-center bg-black/40">
          <View className="bg-white rounded-2xl p-6 items-center gap-3">
            <ActivityIndicator size="large" color="#FF6B6B" />
            <Text variant="label">Uploading photo…</Text>
          </View>
        </View>
      )}

      <ScrollView className="flex-1 px-5">
        <View className="items-center py-8">
          <Text className="text-6xl mb-3">{child.avatarEmoji}</Text>
          <Text variant="h2">{child.name}</Text>
          <Text className="text-4xl font-bold text-primary mt-2">
            {formatBalance(child, child.balance, family.currency)}
          </Text>
        </View>

        <Text variant="h3" className="mb-4">Today's Chores</Text>

        {myChores.map((chore) => {
          const completion = getRelevantCompletion(chore);
          return (
            <ChoreCard
              key={chore.id}
              chore={chore}
              completion={completion}
              onPress={() => handleChorePress(chore)}
            />
          );
        })}

        {myChores.length === 0 && (
          <Text variant="caption" className="text-center mt-8">No chores assigned yet! 🎉</Text>
        )}

        <View className="h-8" />
      </ScrollView>

      <CelebrationOverlay
        visible={celebrating}
        message={celebrationMsg}
        onDone={() => setCelebrating(false)}
      />
    </SafeAreaView>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function isToday(date: Date): boolean {
  return date.toDateString() === new Date().toDateString();
}

function isThisWeek(date: Date): boolean {
  const now = new Date();
  const startOfWeek = new Date(now);
  // Week starts on Sunday (getDay() = 0)
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  return date >= startOfWeek;
}
