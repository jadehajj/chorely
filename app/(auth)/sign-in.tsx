import { useState } from 'react';
import { View, Alert, SafeAreaView } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { signInWithApple, signInWithGoogle } from '@/services/auth';

export default function SignIn() {
  const [loading, setLoading] = useState<'apple' | 'google' | null>(null);

  async function handleApple() {
    setLoading('apple');
    try {
      await signInWithApple();
      // onAuthStateChanged in _layout.tsx handles routing
    } catch (e: any) {
      if (e.code !== 'ERR_REQUEST_CANCELED') {
        Alert.alert('Sign in failed', e.message);
      }
    } finally {
      setLoading(null);
    }
  }

  async function handleGoogle() {
    setLoading('google');
    try {
      await signInWithGoogle();
    } catch (e: any) {
      Alert.alert('Sign in failed', e.message);
    } finally {
      setLoading(null);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 px-8 justify-center">
        <View className="items-center mb-12">
          <Text className="text-6xl mb-4">✅</Text>
          <Text variant="h1" className="text-center">Welcome to Chorely</Text>
          <Text variant="body" className="text-center text-gray-500 mt-2">
            Sign in to sync across all your family's devices
          </Text>
        </View>

        <AppleAuthentication.AppleAuthenticationButton
          buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
          buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
          cornerRadius={16}
          style={{ width: '100%', height: 56, marginBottom: 12 }}
          onPress={handleApple}
        />

        <Button
          title={loading === 'google' ? 'Signing in...' : '  Sign in with Google'}
          variant="secondary"
          loading={loading === 'google'}
          onPress={handleGoogle}
        />

        <Text variant="caption" className="text-center mt-8 text-gray-400">
          Your family's data is private and encrypted.{'\n'}We never see your information.
        </Text>
      </View>
    </SafeAreaView>
  );
}
