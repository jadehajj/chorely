import { useState, useRef } from 'react';
import {
  View, SafeAreaView, TouchableOpacity, TextInput, Alert,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/stores/authStore';
import { joinFamily, redeemKidCode } from '@/services/firestore';
import { startSync } from '@/services/sync';

type Mode = 'parent' | 'kid';

export default function JoinFamily() {
  const { uid, setAuth } = useAuthStore();
  const [mode, setMode] = useState<Mode>('parent');
  const [parentCode, setParentCode] = useState('');
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const kidCode = digits.join('');
  // CHORELY-XXXX = 12 chars exactly
  const canSubmitParent = parentCode.trim().length >= 12;
  const canSubmitKid = kidCode.length === 6;

  function handleDigitChange(idx: number, val: string) {
    const char = val.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[idx] = char;
    setDigits(next);
    if (char && idx < 5) {
      inputRefs.current[idx + 1]?.focus();
    }
  }

  function handleDigitKeyPress(idx: number, key: string) {
    if (key === 'Backspace' && !digits[idx] && idx > 0) {
      const next = [...digits];
      next[idx - 1] = '';
      setDigits(next);
      inputRefs.current[idx - 1]?.focus();
    }
  }

  async function handleSubmit() {
    if (!uid) return;
    setLoading(true);
    try {
      if (mode === 'parent') {
        const code = parentCode.trim().toUpperCase();
        const familyId = await joinFamily(uid, code);
        setAuth(uid, 'parent', familyId, null);
        startSync(familyId, 'parent', null);
        router.replace('/(parent)/dashboard');
      } else {
        const { familyId, childId } = await redeemKidCode(uid, kidCode);
        setAuth(uid, 'kid', familyId, childId);
        startSync(familyId, 'kid', childId);
        router.replace('/(kid)/view');
      }
    } catch (e: unknown) {
      Alert.alert(
        'Invalid Code',
        e instanceof Error ? e.message : 'Please check the code and try again.',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView className="flex-1" keyboardShouldPersistTaps="handled">

          {/* Header */}
          <View className="flex-row items-center px-5 pt-5 mb-6">
            <TouchableOpacity onPress={() => router.back()} className="mr-4 p-1">
              <Text className="text-primary text-base">← Back</Text>
            </TouchableOpacity>
          </View>

          <View className="px-6">
            <Text variant="h2" className="text-gray-900 mb-2">Join Your Family</Text>
            <Text variant="caption" className="mb-8">
              Enter the invite code shared with you.
            </Text>

            {/* Mode tabs */}
            <View className="flex-row bg-gray-100 rounded-2xl p-1 mb-8">
              <TouchableOpacity
                className={[
                  'flex-1 py-3 rounded-xl items-center',
                  mode === 'parent' ? 'bg-white shadow-sm' : '',
                ].join(' ')}
                onPress={() => setMode('parent')}
              >
                <Text
                  className={mode === 'parent' ? 'font-semibold text-gray-900' : 'text-gray-500'}
                  style={{ fontSize: 14 }}
                >
                  I'm a parent
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className={[
                  'flex-1 py-3 rounded-xl items-center',
                  mode === 'kid' ? 'bg-white shadow-sm' : '',
                ].join(' ')}
                onPress={() => setMode('kid')}
              >
                <Text
                  className={mode === 'kid' ? 'font-semibold text-gray-900' : 'text-gray-500'}
                  style={{ fontSize: 14 }}
                >
                  Child's device
                </Text>
              </TouchableOpacity>
            </View>

            {mode === 'parent' ? (
              /* Parent join code — text input */
              <View>
                <Text variant="label" className="mb-3 text-gray-700">
                  Parent invite code (e.g. CHORELY-AB12)
                </Text>
                <TextInput
                  className="border-2 border-gray-200 rounded-2xl px-5 h-16 text-xl font-bold text-center tracking-widest text-gray-900"
                  placeholder="CHORELY-XXXX"
                  placeholderTextColor="#9CA3AF"
                  value={parentCode}
                  onChangeText={(t) => setParentCode(t.toUpperCase())}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  returnKeyType="done"
                  onSubmitEditing={canSubmitParent ? handleSubmit : undefined}
                  style={{ borderColor: parentCode.length > 0 ? '#FF6B6B' : '#E5E7EB' }}
                />
              </View>
            ) : (
              /* Kid device code — OTP boxes */
              <View>
                <Text variant="label" className="mb-3 text-gray-700">
                  6-digit device code (from a parent's Chorely app)
                </Text>
                <View className="flex-row justify-between">
                  {digits.map((digit, idx) => (
                    <TextInput
                      key={idx}
                      ref={(r) => { inputRefs.current[idx] = r; }}
                      className="border-2 rounded-2xl text-center text-2xl font-bold text-gray-900"
                      style={{
                        width: 48,
                        height: 60,
                        borderColor: digit ? '#FF6B6B' : '#E5E7EB',
                      }}
                      keyboardType="number-pad"
                      maxLength={1}
                      value={digit}
                      onChangeText={(val) => handleDigitChange(idx, val)}
                      onKeyPress={({ nativeEvent }) => handleDigitKeyPress(idx, nativeEvent.key)}
                      selectTextOnFocus
                    />
                  ))}
                </View>
              </View>
            )}

            <View className="mt-10">
              <Button
                title="Continue"
                onPress={handleSubmit}
                loading={loading}
                disabled={mode === 'parent' ? !canSubmitParent : !canSubmitKid}
              />
            </View>
          </View>

          <View className="h-8" />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
