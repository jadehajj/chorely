import { View, SafeAreaView } from 'react-native';
import { router } from 'expo-router';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';

export default function Welcome() {
  return (
    <SafeAreaView className="flex-1 bg-white">

      {/* Hero illustration */}
      <View className="flex-1 items-center justify-center px-8">
        <View className="items-center mb-10">
          <Text className="text-8xl mb-2">🏠</Text>
          <View className="flex-row items-end gap-x-1">
            <Text className="text-5xl">👩</Text>
            <Text className="text-5xl">👨</Text>
            <Text className="text-4xl mb-1">👧</Text>
            <Text className="text-3xl mb-2">👦</Text>
          </View>
        </View>

        <Text
          variant="h1"
          className="text-center text-gray-900 mb-3"
          style={{ fontSize: 36, fontWeight: '800' }}
        >
          Chorely
        </Text>

        <Text variant="body" className="text-center text-gray-500 leading-6" style={{ maxWidth: 280 }}>
          Make chores fun, celebrate effort, and build great habits together.
        </Text>
      </View>

      {/* CTAs */}
      <View className="px-6 pb-12 gap-y-3">
        <Button
          title="Create New Family"
          onPress={() => router.push('/(auth)/onboarding')}
        />
        <Button
          title="Join Existing Family"
          variant="secondary"
          onPress={() => router.push('/(auth)/join-family')}
        />
      </View>

    </SafeAreaView>
  );
}
