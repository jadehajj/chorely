import { View, SafeAreaView, StatusBar } from 'react-native';
import { router } from 'expo-router';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';

export default function Welcome() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
      <StatusBar barStyle="dark-content" />

      {/* ── Hero ── */}
      <View
        style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}
      >
        {/* Branded logo badge */}
        <View
          style={{
            width: 88,
            height: 88,
            borderRadius: 28,
            backgroundColor: '#FF6B6B',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 24,
            shadowColor: '#FF6B6B',
            shadowOpacity: 0.35,
            shadowRadius: 20,
            shadowOffset: { width: 0, height: 8 },
            elevation: 8,
          }}
        >
          <Text style={{ fontSize: 44 }}>🏠</Text>
        </View>

        <Text
          style={{
            fontSize: 34,
            fontWeight: '800',
            color: '#111827',
            textAlign: 'center',
            marginBottom: 8,
            letterSpacing: -0.5,
          }}
        >
          Welcome to Chorely
        </Text>
        <Text
          style={{
            fontSize: 17,
            color: '#6B7280',
            textAlign: 'center',
            lineHeight: 26,
            marginBottom: 40,
          }}
        >
          How would you like to get started?
        </Text>

        {/* Family illustration card */}
        <View
          style={{
            backgroundColor: '#FFF5F5',
            borderRadius: 24,
            paddingVertical: 20,
            paddingHorizontal: 24,
            flexDirection: 'row',
            gap: 12,
            alignItems: 'flex-end',
          }}
        >
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: 36 }}>👩</Text>
            <Text style={{ fontSize: 10, color: '#9CA3AF', marginTop: 2 }}>Mum</Text>
          </View>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: 36 }}>👨</Text>
            <Text style={{ fontSize: 10, color: '#9CA3AF', marginTop: 2 }}>Dad</Text>
          </View>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: 30 }}>👧</Text>
            <Text style={{ fontSize: 10, color: '#9CA3AF', marginTop: 2 }}>Emma</Text>
          </View>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: 26 }}>👦</Text>
            <Text style={{ fontSize: 10, color: '#9CA3AF', marginTop: 2 }}>Jake</Text>
          </View>
          <View style={{ alignItems: 'center', marginLeft: 4, marginBottom: 2 }}>
            <Text style={{ fontSize: 22 }}>✨</Text>
          </View>
        </View>
      </View>

      {/* ── Actions ── */}
      <View style={{ paddingHorizontal: 24, paddingBottom: 40, gap: 12 }}>
        <Button
          title="🏠   Create My Family"
          onPress={() => router.push('/(auth)/onboarding')}
        />
        <Button
          title="Join an Existing Family"
          variant="secondary"
          onPress={() => router.push('/(auth)/join-family')}
        />
      </View>
    </SafeAreaView>
  );
}
