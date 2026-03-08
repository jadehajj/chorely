import { View, ScrollView, SafeAreaView, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useFamilyStore } from '@/stores/familyStore';
import { useChoresStore } from '@/stores/choresStore';
import { useCompletionsStore } from '@/stores/completionsStore';
import { formatBalance, formatReward } from '@/utils/formatReward';
import { approveCompletion, rejectCompletion, adjustBalance } from '@/services/firestore';

export default function ChildDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { family, children } = useFamilyStore();
  const { chores } = useChoresStore();
  const { completions } = useCompletionsStore();

  const child = children.find((c) => c.id === id);
  if (!child || !family) return null;

  const childChores = chores.filter((c) => c.assignedChildId === id);
  const pendingCompletions = completions.filter(
    (c) => c.childId === id && c.status === 'pending'
  );

  async function handleApprove(completionId: string, choreId: string) {
    try {
      await approveCompletion(family!.id, completionId, choreId, id);
    } catch (e: unknown) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Approval failed.');
    }
  }

  async function handleReject(completionId: string) {
    Alert.prompt('Rejection reason', 'Optional message for your child', async (reason) => {
      try {
        await rejectCompletion(family!.id, completionId, reason ?? '');
      } catch (e: unknown) {
        Alert.alert('Error', e instanceof Error ? e.message : 'Rejection failed.');
      }
    });
  }

  function handleManualAdjust() {
    Alert.alert('Manual Adjustment', 'Use + or − buttons', [
      {
        text: '+ Add', onPress: () => {
          Alert.prompt('Add amount', '', async (v) => {
            const amount = parseFloat(v ?? '0');
            if (isNaN(amount) || amount <= 0) return;
            try {
              await adjustBalance(family!.id, id, amount, 'Manual bonus');
            } catch (e: unknown) {
              Alert.alert('Error', e instanceof Error ? e.message : 'Adjustment failed.');
            }
          });
        },
      },
      {
        text: '− Deduct', onPress: () => {
          Alert.prompt('Deduct amount', '', async (v) => {
            const amount = parseFloat(v ?? '0');
            if (isNaN(amount) || amount <= 0) return;
            try {
              await adjustBalance(family!.id, id, -amount, 'Manual deduction');
            } catch (e: unknown) {
              Alert.alert('Error', e instanceof Error ? e.message : 'Adjustment failed.');
            }
          });
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1 px-5">
        {/* Header */}
        <View className="flex-row items-center py-5">
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <Text className="text-primary">← Back</Text>
          </TouchableOpacity>
          <View
            className="w-10 h-10 rounded-full items-center justify-center mr-3"
            style={{ backgroundColor: child.colorTheme + '30' }}
          >
            <Text className="text-2xl">{child.avatarEmoji}</Text>
          </View>
          <Text variant="h2">{child.name}</Text>
        </View>

        {/* Balance card */}
        <Card className="items-center py-8 mb-4">
          <Text variant="caption" className="mb-1">Current Balance</Text>
          <Text className="text-5xl font-bold text-primary">
            {formatBalance(child, child.balance, family.currency)}
          </Text>
          <TouchableOpacity
            className="mt-4 bg-gray-100 px-4 py-2 rounded-full"
            onPress={handleManualAdjust}
          >
            <Text variant="caption">Manual Adjustment</Text>
          </TouchableOpacity>
        </Card>

        {/* Pending approvals */}
        {pendingCompletions.length > 0 && (
          <View className="mb-4">
            <Text variant="h3" className="mb-3">Needs Approval</Text>
            {pendingCompletions.map((completion) => {
              const chore = chores.find((c) => c.id === completion.choreId);
              return (
                <Card key={completion.id} className="mb-2">
                  <View className="flex-row items-center justify-between mb-3">
                    <Text className="text-xl mr-2">{chore?.iconEmoji}</Text>
                    <Text variant="label" className="flex-1">{chore?.name}</Text>
                  </View>
                  <View className="flex-row">
                    <Button
                      title="Approve ✓"
                      onPress={() => handleApprove(completion.id, completion.choreId)}
                      className="flex-1 mr-2 h-11"
                    />
                    <Button
                      title="Reject ✗"
                      variant="danger"
                      onPress={() => handleReject(completion.id)}
                      className="flex-1 h-11"
                    />
                  </View>
                </Card>
              );
            })}
          </View>
        )}

        {/* Chores list */}
        <Text variant="h3" className="mb-3">Chores</Text>
        {childChores.map((chore) => (
          <Card key={chore.id} className="mb-2 flex-row items-center justify-between">
            <View className="flex-row items-center flex-1">
              <Text className="text-2xl mr-3">{chore.iconEmoji}</Text>
              <View>
                <Text variant="label">{chore.name}</Text>
                <Text variant="caption">{chore.schedule} · {formatReward(child, chore.value, family.currency)}</Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={() => router.push({ pathname: '/(shared)/chore-builder', params: { choreId: chore.id } })}
            >
              <Text variant="caption" className="text-primary">Edit</Text>
            </TouchableOpacity>
          </Card>
        ))}

        <Button
          title="View History"
          variant="secondary"
          onPress={() => router.push(`/(shared)/history/${id}`)}
          className="mt-4 mb-8"
        />
      </ScrollView>
    </SafeAreaView>
  );
}
