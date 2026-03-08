import { useState } from 'react';
import { View, ScrollView, SafeAreaView, Alert } from 'react-native';
import { Text } from '@/components/ui/Text';
import { ChoreCard } from '@/components/kid/ChoreCard';
import { CelebrationOverlay } from '@/components/kid/CelebrationOverlay';
import { useAuthStore } from '@/stores/authStore';
import { useFamilyStore } from '@/stores/familyStore';
import { useChoresStore } from '@/stores/choresStore';
import { useCompletionsStore } from '@/stores/completionsStore';
import { submitCompletion } from '@/services/firestore';
import { formatBalance } from '@/utils/formatReward';
import { Chore } from '@/stores/choresStore';

export default function KidView() {
  const { linkedChildId } = useAuthStore();
  const { family, children } = useFamilyStore();
  const { chores } = useChoresStore();
  const { completions } = useCompletionsStore();
  const [celebrating, setCelebrating] = useState(false);
  const [celebrationMsg, setCelebrationMsg] = useState('');

  const child = children.find((c) => c.id === linkedChildId);
  if (!child || !family) return null;

  const myChores = chores.filter((c) => c.assignedChildId === linkedChildId);
  const todayCompletions = completions.filter(
    (c) => c.childId === linkedChildId && isToday(c.submittedAt)
  );

  async function handleChorePress(chore: Chore) {
    const existing = todayCompletions.find((c) => c.choreId === chore.id);
    if (existing) return;

    const requiresApproval = family.verificationMode === 'approval' || chore.requiresApproval;

    try {
      await submitCompletion(family.id, chore.id, child.id, null, requiresApproval);
      if (!requiresApproval) {
        setCelebrationMsg(`${chore.iconEmoji}\n+${chore.value}!`);
        setCelebrating(true);
      } else {
        Alert.alert('Submitted!', 'Waiting for Mum or Dad to approve 👍');
      }
    } catch (e: unknown) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Please try again.');
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
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
          const completion = todayCompletions.find((c) => c.choreId === chore.id);
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
          <Text variant="caption" className="text-center mt-8">No chores today! 🎉</Text>
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

function isToday(date: Date): boolean {
  return date.toDateString() === new Date().toDateString();
}
