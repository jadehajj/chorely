import { useState } from 'react';
import {
  View, ScrollView, SafeAreaView, TouchableOpacity, Alert,
  Modal, TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useFamilyStore } from '@/stores/familyStore';
import { useChoresStore } from '@/stores/choresStore';
import { useCompletionsStore } from '@/stores/completionsStore';
import { formatBalance, formatReward } from '@/utils/formatReward';
import { approveCompletion, rejectCompletion, adjustBalance, deleteChore } from '@/services/firestore';

export default function ChildDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { family, children } = useFamilyStore();
  const { chores } = useChoresStore();
  const { completions } = useCompletionsStore();

  // Bug #13 fix: Modal state replaces the 3-chained Alert.prompt
  const [adjustModalVisible, setAdjustModalVisible] = useState(false);
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustLoading, setAdjustLoading] = useState(false);

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

  // Bug #13 fix: execute adjustment from Modal input
  async function executeAdjust(isAdd: boolean) {
    const amount = parseFloat(adjustAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Invalid amount', 'Please enter a positive number.');
      return;
    }
    setAdjustLoading(true);
    try {
      await adjustBalance(
        family!.id,
        id,
        isAdd ? amount : -amount,
        isAdd ? 'Manual bonus' : 'Manual deduction',
      );
      setAdjustModalVisible(false);
      setAdjustAmount('');
    } catch (e: unknown) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Adjustment failed.');
    } finally {
      setAdjustLoading(false);
    }
  }

  function closeAdjustModal() {
    setAdjustModalVisible(false);
    setAdjustAmount('');
  }

  // Bug #10 fix: delete chore with confirmation Alert
  function handleDeleteChore(choreId: string, choreName: string) {
    Alert.alert(
      'Delete chore',
      `Remove "${choreName}" from ${child!.name}'s chores? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteChore(family!.id, choreId);
            } catch (e: unknown) {
              Alert.alert('Error', e instanceof Error ? e.message : 'Could not delete chore.');
            }
          },
        },
      ],
    );
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
          {/* Bug #13 fix: opens Modal instead of chained Alert.prompt */}
          <TouchableOpacity
            className="mt-4 bg-gray-100 px-4 py-2 rounded-full"
            onPress={() => setAdjustModalVisible(true)}
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
        {/* Bug #10 fix: each row now has an Edit + Delete button */}
        <Text variant="h3" className="mb-3">Chores</Text>
        {childChores.map((chore) => (
          <Card key={chore.id} className="mb-2">
            <View className="flex-row items-center">
              <Text className="text-2xl mr-3">{chore.iconEmoji}</Text>
              <View className="flex-1">
                <Text variant="label">{chore.name}</Text>
                <Text variant="caption">
                  {chore.schedule} · {formatReward(child, chore.value, family.currency)}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() =>
                  router.push({ pathname: '/(shared)/chore-builder', params: { choreId: chore.id } })
                }
                className="px-2 py-1 mr-1"
              >
                <Text variant="caption" className="text-primary">Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleDeleteChore(chore.id, chore.name)}
                className="px-2 py-1"
              >
                <Text style={{ color: '#EF4444', fontSize: 12, fontWeight: '600' }}>Delete</Text>
              </TouchableOpacity>
            </View>
          </Card>
        ))}

        {childChores.length === 0 && (
          <Text variant="caption" className="text-center text-gray-400 mb-4">
            No chores assigned yet.
          </Text>
        )}

        <Button
          title="View History"
          variant="secondary"
          onPress={() => router.push(`/(shared)/history/${id}`)}
          className="mt-4 mb-8"
        />
      </ScrollView>

      {/* Bug #13 fix: Manual adjustment bottom-sheet Modal */}
      <Modal
        visible={adjustModalVisible}
        transparent
        animationType="slide"
        onRequestClose={closeAdjustModal}
      >
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <TouchableOpacity
            className="flex-1 bg-black/40"
            activeOpacity={1}
            onPress={closeAdjustModal}
          />
          <View className="bg-white rounded-t-3xl px-6 pt-6 pb-10">
            <View className="flex-row items-center mb-1">
              <Text className="text-3xl mr-2">{child.avatarEmoji}</Text>
              <Text variant="h3">{child.name} — Adjust Balance</Text>
            </View>
            <Text variant="caption" className="mb-5">
              Current: {formatBalance(child, child.balance, family.currency)}
            </Text>

            <Text variant="label" className="mb-2">Amount</Text>
            <TextInput
              className="border border-gray-200 rounded-2xl px-4 h-14 text-xl text-gray-900 mb-6"
              placeholder={child.rewardMode === 'emoji' ? '5' : '2.00'}
              value={adjustAmount}
              onChangeText={setAdjustAmount}
              keyboardType="decimal-pad"
              autoFocus
            />

            <View className="flex-row gap-x-3 mb-3">
              <Button
                title="− Deduct"
                variant="danger"
                className="flex-1"
                loading={adjustLoading}
                onPress={() => executeAdjust(false)}
              />
              <Button
                title="+ Add"
                variant="primary"
                className="flex-1"
                loading={adjustLoading}
                onPress={() => executeAdjust(true)}
              />
            </View>

            <TouchableOpacity onPress={closeAdjustModal} className="items-center py-2">
              <Text variant="caption" className="text-gray-400">Cancel</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}
