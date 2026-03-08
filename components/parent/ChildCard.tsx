import { TouchableOpacity, View } from 'react-native';
import { Text } from '@/components/ui/Text';
import { Child } from '@/stores/familyStore';
import { formatBalance } from '@/utils/formatReward';
import { useFamilyStore } from '@/stores/familyStore';
import { useCompletionsStore } from '@/stores/completionsStore';
import { useChoresStore } from '@/stores/choresStore';

interface Props {
  child: Child;
  onPress: () => void;
}

export function ChildCard({ child, onPress }: Props) {
  const { family } = useFamilyStore();
  const { completions } = useCompletionsStore();
  const { chores } = useChoresStore();

  const todayChores = chores.filter((c) => c.assignedChildId === child.id);
  const todayCompletions = completions.filter(
    (c) => c.childId === child.id && isToday(c.submittedAt) && c.status !== 'rejected'
  );
  const pendingCount = completions.filter(
    (c) => c.childId === child.id && c.status === 'pending'
  ).length;

  return (
    <TouchableOpacity
      onPress={onPress}
      className="bg-white rounded-3xl p-5 mb-3 shadow-sm border border-gray-100"
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center flex-1">
          <View
            className="w-14 h-14 rounded-full items-center justify-center mr-4"
            style={{ backgroundColor: child.colorTheme + '30' }}
          >
            <Text className="text-3xl">{child.avatarEmoji}</Text>
          </View>
          <View className="flex-1">
            <Text variant="h3">{child.name}</Text>
            <Text variant="caption">
              {todayCompletions.length}/{todayChores.length} chores done today
            </Text>
          </View>
        </View>
        <View className="items-end">
          <Text variant="h3" className="text-primary">
            {formatBalance(child, child.balance, family?.currency ?? 'AUD')}
          </Text>
          {pendingCount > 0 && (
            <View className="bg-warning rounded-full px-2 py-0.5 mt-1">
              <Text className="text-white text-xs font-bold">{pendingCount} pending</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

function isToday(date: Date): boolean {
  const today = new Date();
  return date.toDateString() === today.toDateString();
}
