import { useState } from 'react';
import { View, Alert, SafeAreaView, TouchableOpacity, StatusBar } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import { router } from 'expo-router';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { signInWithApple, signInWithGoogle } from '@/services/auth';
import { statusCodes } from '@react-native-google-signin/google-signin';

export default function SignIn() {
  const [loading, setLoading] = useState<'apple' | 'google' | null>(null);

  async function handleApple() {
    setLoading('apple');
    try {
      await signInWithApple();
      // onAuthStateChanged in _layout.tsx handles post-login routing
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
      if (e.code !== statusCodes.SIGN_IN_CANCELLED) {
        Alert.alert('Sign in failed', e.message);
      }
    } finally {
      setLoading(null);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
      <StatusBar barStyle="dark-content" />

      {/* Back button */}
      <TouchableOpacity
        onPress={() => router.back()}
        style={{ paddingHorizontal: 24, paddingTop: 8, alignSelf: 'flex-start' }}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Text style={{ color: '#FF6B6B', fontSize: 16, fontWeight: '600' }}>← Back</Text>
      </TouchableOpacity>

      <View style={{ flex: 1, paddingHorizontal: 32, justifyContent: 'center' }}>
        {/* ── Branding ── */}
        <View style={{ alignItems: 'center', marginBottom: 48 }}>
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 24,
              backgroundColor: '#FF6B6B',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 20,
              shadowColor: '#FF6B6B',
              shadowOpacity: 0.3,
              shadowRadius: 16,
              shadowOffset: { width: 0, height: 6 },
              elevation: 8,
            }}
          >
            <Text style={{ fontSize: 40 }}>🏠</Text>
          </View>
          <Text
            style={{
              fontSize: 30,
              fontWeight: '800',
              color: '#111827',
              letterSpacing: -0.5,
              marginBottom: 6,
            }}
          >
            Welcome back
          </Text>
          <Text style={{ fontSize: 15, color: '#6B7280', textAlign: 'center', lineHeight: 22 }}>
            Sign in to sync across all your family's devices
          </Text>
        </View>

        {/* ── Auth buttons ── */}
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

        {/* Privacy note */}
        <Text
          style={{
            textAlign: 'center',
            marginTop: 32,
            color: '#9CA3AF',
            fontSize: 13,
            lineHeight: 20,
          }}
        >
          Your family's data is private and encrypted.{'\n'}We never sell your information.
        </Text>
      </View>
    </SafeAreaView>
  );
}
