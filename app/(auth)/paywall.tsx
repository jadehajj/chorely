import { useState, useEffect } from 'react';
import { View, ScrollView, Alert, SafeAreaView } from 'react-native';
import { router } from 'expo-router';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { TierCard } from '@/components/ui/TierCard';
import { initIAP, fetchProducts, purchaseTier, restorePurchases } from '@/services/iap';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/services/firebase';
import { useAuthStore } from '@/stores/authStore';
import { startSync } from '@/services/sync';

const TIERS = [
  {
    id: 'com.chorely.starter',
    title: 'Starter',
    price: '$4.99',
    description: 'Perfect for single-child families',
    features: ['2 parents', '1 child', 'All core features', 'iCloud-style sync'],
  },
  {
    id: 'com.chorely.family',
    title: 'Family',
    price: '$6.99',
    description: 'Most popular for growing families',
    features: ['2 parents', 'Up to 3 children', 'All core features', 'iCloud-style sync'],
    isPopular: true,
  },
  {
    id: 'com.chorely.unlimited',
    title: 'Unlimited',
    price: '$9.99',
    description: 'Large & blended families',
    features: ['2 parents', 'Unlimited children', 'All core features', 'iCloud-style sync'],
  },
];

export default function Paywall() {
  const [selectedTier, setSelectedTier] = useState('com.chorely.family');
  const [loading, setLoading] = useState(false);
  const { uid, familyId, setAuth } = useAuthStore();

  useEffect(() => {
    initIAP().catch(console.error);
  }, []);

  async function handlePurchase() {
    if (!uid) { router.push('/(auth)/sign-in'); return; }
    setLoading(true);
    try {
      await purchaseTier(selectedTier);
      const newFamilyId = `family_${uid}_${Date.now()}`;
      await setDoc(doc(db, 'families', newFamilyId), {
        name: '',
        joinCode: '',
        verificationMode: 'self',
        currency: 'AUD',
        tierProductId: selectedTier,
        parentIds: [uid],
        createdAt: serverTimestamp(),
      });
      await setDoc(doc(db, 'users', uid), { familyId: newFamilyId }, { merge: true });
      setAuth(uid, 'parent', newFamilyId, null);
      startSync(newFamilyId, 'parent', null);
      router.replace('/(auth)/onboarding');
    } catch (e: any) {
      if (e.code !== 'E_USER_CANCELLED') {
        Alert.alert('Purchase failed', e.message);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleRestore() {
    if (!uid) return;
    setLoading(true);
    try {
      const tier = await restorePurchases(familyId ?? '');
      if (tier) {
        Alert.alert('Restored!', 'Your purchase has been restored.');
        router.replace('/(auth)/onboarding');
      } else {
        Alert.alert('Nothing to restore', 'No previous purchases found.');
      }
    } catch (e: any) {
      Alert.alert('Restore failed', e.message ?? 'Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
        <View className="items-center py-8">
          <Text className="text-5xl mb-2">✅</Text>
          <Text variant="h1" className="text-center dark:text-gray-900">Chorely</Text>
          <Text variant="caption" className="text-center mt-1 dark:text-gray-600">
            Buy once. Yours forever. No subscription.
          </Text>
        </View>

        <View className="mb-6 mt-2">
          {TIERS.map((tier) => (
            <TierCard
              key={tier.id}
              {...tier}
              isSelected={selectedTier === tier.id}
              onPress={() => setSelectedTier(tier.id)}
            />
          ))}
        </View>

        <Button
          title={`Get Chorely — ${TIERS.find(t => t.id === selectedTier)?.price}`}
          onPress={handlePurchase}
          loading={loading}
          className="mb-3"
        />
        <Button
          title="Restore Purchases"
          variant="ghost"
          onPress={handleRestore}
          className="mb-8"
        />
      </ScrollView>
    </SafeAreaView>
  );
}
