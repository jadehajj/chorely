import { useState, useEffect } from 'react';
import { View, ScrollView, Alert, SafeAreaView, TouchableOpacity, StatusBar } from 'react-native';
import { router } from 'expo-router';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { TierCard } from '@/components/ui/TierCard';
import { initIAP, purchaseTier, restorePurchases } from '@/services/iap';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/services/firebase';
import { useAuthStore } from '@/stores/authStore';
import { startSync } from '@/services/sync';

// ── Pricing tiers ──────────────────────────────────────────────────────────
// All plans include a 7-day free trial.
// Starter + Family are weekly auto-renewing subscriptions.
// Lifetime Unlimited is a single one-time payment.

const TIERS = [
  {
    id: 'com.chorely.starter',
    title: 'Starter',
    price: '$2.99/wk',
    priceNote: 'after free trial',
    description: 'One account, core chore tracking',
    features: [
      '7-day free trial',
      '1 basic account',
      'Chore assignment & tracking',
      'Emoji or money rewards',
      'No iCloud sync',
    ],
  },
  {
    id: 'com.chorely.family',
    title: 'Family',
    price: '$4.99/wk',
    priceNote: 'after free trial',
    description: 'Full family management',
    features: [
      '7-day free trial',
      'Up to 2 parents',
      'Up to 2 children',
      'All core features',
      'iCloud sync',
    ],
    badge: 'Most Popular ★',
  },
  {
    id: 'com.chorely.unlimited',
    title: 'Lifetime',
    price: '$100',
    priceNote: 'one-time payment',
    description: 'Everything, forever',
    features: [
      '7-day free trial',
      'Up to 4 adults',
      'Unlimited children',
      'All core features',
      'iCloud sync',
    ],
    badge: 'Best Value',
  },
];

// Feature bullets shown above the pricing tiers
const FEATURES = [
  { emoji: '📋', text: 'Assign chores with one tap' },
  { emoji: '💰', text: 'Pocket money or emoji rewards' },
  { emoji: '✅', text: 'Photo proof & parent approval mode' },
  { emoji: '🔔', text: 'Push notifications for the whole family' },
];

// ── Component ──────────────────────────────────────────────────────────────

export default function Paywall() {
  const [selectedTier, setSelectedTier] = useState('com.chorely.family'); // Family is default
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

  const selectedTierData = TIERS.find((t) => t.id === selectedTier);
  const selectedPrice = selectedTierData?.price ?? '$4.99/wk';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
      <StatusBar barStyle="light-content" />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 48 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero banner ── */}
        <View
          style={{
            backgroundColor: '#FF6B6B',
            paddingTop: 32,
            paddingBottom: 40,
            paddingHorizontal: 24,
            alignItems: 'center',
            borderBottomLeftRadius: 32,
            borderBottomRightRadius: 32,
          }}
        >
          {/* Icon */}
          <View
            style={{
              width: 72,
              height: 72,
              borderRadius: 22,
              backgroundColor: 'rgba(255,255,255,0.25)',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 14,
            }}
          >
            <Text style={{ fontSize: 36 }}>🏠</Text>
          </View>

          <Text
            style={{
              fontSize: 32,
              fontWeight: '800',
              color: 'white',
              letterSpacing: -0.5,
              marginBottom: 6,
            }}
          >
            Chorely
          </Text>
          <Text style={{ fontSize: 15, color: 'rgba(255,255,255,0.85)', textAlign: 'center' }}>
            Start free for 7 days.{'\n'}Cancel anytime.
          </Text>
        </View>

        {/* ── Feature bullets ── */}
        <View style={{ paddingHorizontal: 24, paddingTop: 28, paddingBottom: 8 }}>
          <Text
            style={{ fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 16 }}
          >
            Everything your family needs
          </Text>
          <View style={{ gap: 12 }}>
            {FEATURES.map(({ emoji, text }) => (
              <View
                key={text}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    backgroundColor: '#FFF0F0',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ fontSize: 18 }}>{emoji}</Text>
                </View>
                <Text style={{ fontSize: 15, color: '#374151', flex: 1, lineHeight: 22 }}>
                  {text}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── Tier selection ── */}
        <View style={{ paddingHorizontal: 24, paddingTop: 28 }}>
          <Text
            style={{ fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 16 }}
          >
            Choose your plan
          </Text>
          {TIERS.map((tier) => (
            <TierCard
              key={tier.id}
              title={tier.title}
              price={tier.price}
              priceNote={tier.priceNote}
              description={tier.description}
              features={tier.features}
              badge={tier.badge}
              isSelected={selectedTier === tier.id}
              onPress={() => setSelectedTier(tier.id)}
            />
          ))}
        </View>

        {/* ── CTA ── */}
        <View style={{ paddingHorizontal: 24, paddingTop: 8 }}>
          <Button
            title={`Start Free Trial — then ${selectedPrice}`}
            onPress={handlePurchase}
            loading={loading}
            className="mb-3"
          />
          <Button
            title="Restore Purchase"
            variant="ghost"
            onPress={handleRestore}
          />
        </View>

        {/* ── Existing user sign-in link ── */}
        <TouchableOpacity
          onPress={() => router.push('/(auth)/sign-in')}
          style={{ alignItems: 'center', paddingVertical: 16 }}
        >
          <Text style={{ color: '#9CA3AF', fontSize: 14 }}>
            Already have Chorely?{' '}
            <Text style={{ color: '#FF6B6B', fontWeight: '700' }}>Sign in</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
