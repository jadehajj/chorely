import { TouchableOpacity, View } from 'react-native';
import { Text } from '@/components/ui/Text';
import { Chore } from '@/stores/choresStore';
import { Completion } from '@/stores/completionsStore';

interface Props {
  chore: Chore;
  completion?: Completion;
  onPress: () => void;
  /** Pre-formatted reward label (e.g. "$2.00" or "5 ⭐"). Shown on uncompleted chores. */
  rewardLabel?: string;
}

export function ChoreCard({ chore, completion, onPress, rewardLabel }: Props) {
  const isPending = completion?.status === 'pending';
  const isDone = completion?.status === 'approved';
  const isRejected = completion?.status === 'rejected';

  // Done and pending are non-interactive; rejected lets the kid retry
  const isDisabled = isDone || isPending;

  return (
    <TouchableOpacity
      onPress={isDisabled ? undefined : onPress}
      className={[
        'rounded-3xl p-6 mb-4',
        isDone
          ? 'bg-green-50 border-2 border-green-300'
          : isPending
          ? 'bg-amber-50 border-2 border-amber-300'
          : isRejected
          ? 'bg-red-50 border-2 border-red-300'
          : 'bg-white border-2 border-gray-200',
      ].join(' ')}
      activeOpacity={isDisabled ? 1 : 0.7}
    >
      <Text style={{ fontSize: 48, lineHeight: 64 }} className="mb-3">{chore.iconEmoji}</Text>
      <Text variant="h3" className="mb-1">{chore.name}</Text>

      {isDone && <Text className="text-green-600 font-semibold">✓ Done!</Text>}

      {isPending && (
        <Text className="text-amber-600 font-semibold">⏳ Waiting for Mum/Dad…</Text>
      )}

      {isRejected && (
        <View className="mt-1">
          <Text className="text-red-600 font-semibold">❌ Rejected — tap to try again</Text>
          {!!completion?.rejectionReason && (
            <Text style={{ color: '#EF4444', fontSize: 13, marginTop: 4 }}>
              "{completion.rejectionReason}"
            </Text>
          )}
        </View>
      )}

      {!isDone && !isPending && !isRejected && (
        <View className="flex-row items-center justify-between mt-3">
          <View className="bg-primary rounded-2xl py-3 px-5 items-center flex-1 mr-3">
            <Text className="text-white font-bold text-lg">Done! 🎉</Text>
          </View>
          {!!rewardLabel && (
            <View className="items-center">
              <Text className="text-xs text-gray-400 mb-0.5">Earn</Text>
              <Text className="text-primary font-bold text-base">{rewardLabel}</Text>
            </View>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}
