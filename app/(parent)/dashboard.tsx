import { View, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Text } from '@/components/ui/Text';
import { ChildCard } from '@/components/parent/ChildCard';
import { useFamilyStore } from '@/stores/familyStore';
import { useCompletionsStore } from '@/stores/completionsStore';

export default function Dashboard() {
  const { family, children } = useFamilyStore();
  const { completions } = useCompletionsStore();

  const totalPending = completions.filter((c) => c.status === 'pending').length;

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="flex-row justify-between items-center py-5">
          <View>
            <Text variant="h2">{family?.name || 'Our Family'}</Text>
            <Text variant="caption">
              {new Date().toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' })}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/(parent)/settings')}
            className="w-10 h-10 bg-white rounded-full items-center justify-center shadow-sm"
          >
            <Text>⚙️</Text>
          </TouchableOpacity>
        </View>

        {/* Pending approval banner */}
        {totalPending > 0 && (
          <TouchableOpacity
            onPress={() => router.push('/(shared)/approval-queue')}
            className="bg-warning rounded-2xl p-4 mb-4 flex-row items-center justify-between"
          >
            <Text className="text-white font-semibold">
              {totalPending} chore{totalPending > 1 ? 's' : ''} waiting for approval
            </Text>
            <Text className="text-white">→</Text>
          </TouchableOpacity>
        )}

        {/* Children */}
        {children.map((child) => (
          <ChildCard
            key={child.id}
            child={child}
            onPress={() => router.push(`/(parent)/child/${child.id}`)}
          />
        ))}

        {/* Add chore shortcut */}
        <TouchableOpacity
          onPress={() => router.push('/(shared)/chore-builder')}
          className="bg-primary rounded-3xl p-5 mt-2 flex-row items-center justify-center"
        >
          <Text className="text-white font-bold text-base">+ Add New Chore</Text>
        </TouchableOpacity>

        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}
