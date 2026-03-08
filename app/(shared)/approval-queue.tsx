import { useMemo, useState } from 'react';
import { View, ScrollView, SafeAreaView, Alert, Image, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useCompletionsStore, type Completion } from '@/stores/completionsStore';
import { useChoresStore, type Chore } from '@/stores/choresStore';
import { useFamilyStore, type Child, type Family } from '@/stores/familyStore';
import { useAuthStore } from '@/stores/authStore';
import { approveCompletion, rejectCompletion } from '@/services/firestore';
import { formatReward } from '@/utils/formatReward';

// ---------------------------------------------------------------------------
// Local helpers
// ---------------------------------------------------------------------------

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PendingItem {
  completion: Completion;
  chore: Chore;
  child: Child;
}

// ---------------------------------------------------------------------------
// Completion card
// ---------------------------------------------------------------------------

interface CompletionCardProps {
  item: PendingItem;
  family: Family;
  onApprove: (completionId: string, choreId: string, childId: string) => Promise<void>;
  onReject: (completionId: string) => void;
  approving: boolean;
}

function CompletionCard({ item, family, onApprove, onReject, approving }: CompletionCardProps) {
  const { completion, chore, child } = item;

  return (
    <Card className="mb-4">
      {/* Child + chore header */}
      <View className="flex-row items-center mb-3">
        <View className="w-11 h-11 rounded-full bg-gray-100 items-center justify-center mr-3">
          <Text className="text-2xl">{child.avatarEmoji}</Text>
        </View>
        <View className="flex-1">
          <Text variant="h3">{child.name}</Text>
          <Text variant="caption">
            {chore.iconEmoji} {chore.name}
          </Text>
        </View>
        <View className="items-end">
          <Text variant="label" className="text-primary">
            {formatReward(child, chore.value, family.currency)}
          </Text>
          <Text variant="caption">{timeAgo(completion.submittedAt)}</Text>
        </View>
      </View>

      {/* Photo proof */}
      {completion.photoUrl !== null && (
        <Image
          source={{ uri: completion.photoUrl }}
          className="w-full h-48 rounded-2xl mb-3"
          resizeMode="cover"
        />
      )}

      {/* Action buttons */}
      <View className="flex-row gap-3">
        <Button
          title="Reject"
          variant="danger"
          className="flex-1"
          disabled={approving}
          onPress={() => onReject(completion.id)}
        />
        <Button
          title="Approve"
          variant="primary"
          className="flex-1"
          loading={approving}
          onPress={() => onApprove(completion.id, chore.id, child.id)}
        />
      </View>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function ApprovalQueue() {
  const { completions } = useCompletionsStore();
  const { chores } = useChoresStore();
  const { family, children } = useFamilyStore();
  const { familyId } = useAuthStore();

  // Track which completion IDs are currently being approved (loading state).
  const [approvingIds, setApprovingIds] = useState<Set<string>>(new Set());

  const pendingItems = useMemo<PendingItem[]>(() => {
    return completions
      .filter((c) => c.status === 'pending')
      .flatMap((completion) => {
        const chore = chores.find((ch) => ch.id === completion.choreId);
        const child = children.find((ch) => ch.id === completion.childId);
        if (!chore || !child) return [];
        return [{ completion, chore, child }];
      });
  }, [completions, chores, children]);

  async function handleApprove(completionId: string, choreId: string, childId: string) {
    if (!familyId) return;
    setApprovingIds((prev) => new Set(prev).add(completionId));
    try {
      await approveCompletion(familyId, completionId, choreId, childId);
    } catch (e: unknown) {
      Alert.alert('Could not approve', e instanceof Error ? e.message : 'Please try again.');
    } finally {
      setApprovingIds((prev) => {
        const next = new Set(prev);
        next.delete(completionId);
        return next;
      });
    }
  }

  function handleReject(completionId: string) {
    if (!familyId) return;
    Alert.prompt(
      'Reject chore',
      'Optionally tell your child why (leave blank to skip):',
      async (reason) => {
        try {
          await rejectCompletion(familyId, completionId, reason ?? '');
        } catch (e: unknown) {
          Alert.alert('Could not reject', e instanceof Error ? e.message : 'Please try again.');
        }
      },
      'plain-text',
      '',
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="flex-row items-center py-5">
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <Text className="text-primary text-base">← Back</Text>
          </TouchableOpacity>
          <View className="flex-1">
            <Text variant="h2">Approval Queue</Text>
            {pendingItems.length > 0 && (
              <Text variant="caption">
                {pendingItems.length} chore{pendingItems.length > 1 ? 's' : ''} waiting
              </Text>
            )}
          </View>
        </View>

        {/* Empty state */}
        {pendingItems.length === 0 && (
          <View className="flex-1 items-center justify-center py-24">
            <Text className="text-5xl mb-4">🎉</Text>
            <Text variant="h3" className="text-center">
              Nothing to review
            </Text>
            <Text variant="caption" className="text-center mt-1">
              All chores are up to date!
            </Text>
          </View>
        )}

        {/* Pending completion cards */}
        {family !== null &&
          pendingItems.map((item) => (
            <CompletionCard
              key={item.completion.id}
              item={item}
              family={family}
              onApprove={handleApprove}
              onReject={handleReject}
              approving={approvingIds.has(item.completion.id)}
            />
          ))}

        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}
