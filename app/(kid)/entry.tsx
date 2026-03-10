import { useState } from 'react';
import { View, TextInput, SafeAreaView, Alert } from 'react-native';
import { router } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/services/firebase';
import { useAuthStore } from '@/stores/authStore';
import { redeemKidCode } from '@/services/firestore';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { startSync } from '@/services/sync';

export default function KidEntry() {
  const { uid, setAuth } = useAuthStore();
  const [code, setCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    if (!uid || code.length !== 6) return;
    setIsSubmitting(true);
    try {
      await redeemKidCode(uid, code);
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setAuth(uid, data.role, data.familyId, data.linkedChildId);
        if (data.familyId) startSync(data.familyId);
      }
      router.replace('/(kid)/view');
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Please try again.';
      Alert.alert('Error', message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 items-center justify-center px-6 gap-6">
        <Text className="text-2xl font-bold text-center">Enter Your Code</Text>
        <TextInput
          className="border-2 border-gray-300 rounded-xl text-center text-3xl tracking-widest w-full py-4 px-2"
          keyboardType="number-pad"
          maxLength={6}
          value={code}
          onChangeText={setCode}
          placeholder="------"
        />
        <Button
          title="Let's Go! 🎉"
          onPress={handleSubmit}
          disabled={code.length !== 6 || isSubmitting}
        />
      </View>
    </SafeAreaView>
  );
}
