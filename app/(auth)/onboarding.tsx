import { useState } from 'react';
import { View, TextInput, SafeAreaView, Alert } from 'react-native';
import { router } from 'expo-router';
import { doc, addDoc, collection, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/services/firebase';
import { useAuthStore } from '@/stores/authStore';
import { useFamilyStore } from '@/stores/familyStore';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { StepAddChild } from '@/components/onboarding/StepAddChild';

type VerificationMode = 'self' | 'approval';

interface ChildData {
  name: string;
  avatarEmoji: string;
  colorTheme: string;
  rewardMode: 'money' | 'emoji';
  rewardEmoji: string;
}

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const [childData, setChildData] = useState<ChildData | null>(null);
  const [familyName, setFamilyName] = useState('');
  const [verificationMode, setVerificationMode] = useState<VerificationMode>('self');
  const [loading, setLoading] = useState(false);
  const { uid } = useAuthStore();
  const { family } = useFamilyStore();

  function handleChildNext(child: ChildData) {
    setChildData(child);
    setStep(1);
  }

  async function handleFinish() {
    if (!uid || !family || !childData) return;
    setLoading(true);
    try {
      await addDoc(collection(db, 'families', family.id, 'children'), {
        ...childData,
        balance: 0,
        linkedDeviceId: null,
        createdAt: serverTimestamp(),
      });
      await updateDoc(doc(db, 'families', family.id), {
        name: familyName.trim() || 'Our Family',
        verificationMode,
      });
      router.replace('/(parent)/dashboard');
    } catch (e: unknown) {
      Alert.alert('Setup failed', e instanceof Error ? e.message : 'Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const steps = ['Add child', 'Verification', 'Family name'];

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Progress indicator */}
      <View className="flex-row px-5 pt-4 mb-6">
        {steps.map((s, i) => (
          <View key={s} className="flex-1 items-center">
            <View className={`w-8 h-8 rounded-full items-center justify-center ${i <= step ? 'bg-primary' : 'bg-gray-200'}`}>
              <Text className={`text-sm font-bold ${i <= step ? 'text-white' : 'text-gray-500'}`}>{i + 1}</Text>
            </View>
          </View>
        ))}
      </View>

      {step === 0 && <StepAddChild onNext={handleChildNext} />}

      {step === 1 && (
        <View className="flex-1 px-5">
          <Text variant="h2" className="mb-6">How should chores work?</Text>
          {(['self', 'approval'] as VerificationMode[]).map((mode) => (
            <Button
              key={mode}
              title={mode === 'self' ? '🟢 Kids self-complete' : '✅ Parent approval required'}
              variant={verificationMode === mode ? 'primary' : 'secondary'}
              onPress={() => setVerificationMode(mode)}
              className="mb-3"
            />
          ))}
          <Button title="Next →" onPress={() => setStep(2)} className="mt-4" />
        </View>
      )}

      {step === 2 && (
        <View className="flex-1 px-5">
          <Text variant="h2" className="mb-6">What's your family name?</Text>
          <TextInput
            className="border border-gray-200 rounded-2xl px-4 h-14 text-base mb-6"
            placeholder="The Smiths"
            value={familyName}
            onChangeText={setFamilyName}
          />
          <Button title="Let's go! 🎉" onPress={handleFinish} loading={loading} />
        </View>
      )}
    </SafeAreaView>
  );
}
