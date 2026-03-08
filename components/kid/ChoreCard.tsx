import { TouchableOpacity, View } from 'react-native';
import { Text } from '@/components/ui/Text';
import { Chore } from '@/stores/choresStore';
import { Completion } from '@/stores/completionsStore';

interface Props {
  chore: Chore;
  completion?: Completion;
  onPress: () => void;
}

export function ChoreCard({ chore, completion, onPress }: Props) {
  const isPending = completion?.status === 'pending';
  const isDone = completion?.status === 'approved';

  return (
    <TouchableOpacity
      onPress={isDone ? undefined : onPress}
      className={`rounded-3xl p-6 mb-4 ${isDone ? 'bg-green-50 border-2 border-green-300' : isPending ? 'bg-amber-50 border-2 border-amber-300' : 'bg-white border-2 border-gray-200'}`}
      activeOpacity={isDone ? 1 : 0.7}
    >
      <Text className="text-5xl mb-3">{chore.iconEmoji}</Text>
      <Text variant="h3" className="mb-1">{chore.name}</Text>
      {isDone && <Text className="text-green-600 font-semibold">✓ Done!</Text>}
      {isPending && <Text className="text-amber-600 font-semibold">⏳ Waiting for Mum/Dad…</Text>}
      {!isDone && !isPending && (
        <View className="bg-primary rounded-2xl py-3 px-5 items-center mt-3">
          <Text className="text-white font-bold text-lg">Done! 🎉</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}
