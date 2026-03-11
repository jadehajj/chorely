import { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  Alert,
  SafeAreaView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { router } from 'expo-router';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import {
  initIAP,
  fetchProducts,
  purchaseTier,
  restorePurchases,
  savePurchaseToFirestore,
} from '@/services/iap';
import { createFamily } from '@/services/firestore';
import { TIER_PRICES, TIER_PRICES_ANNUAL } from '@/constants/theme';
import { useAuthStore } from '@/stores/authStore';
import { startSync } from '@/services/sync';
import { Product } from 'react-native-iap';

// Maps base tier product ID → annual variant
const ANNUAL_MAP: Record<string, string> = {
  'com.chorely.starter': 'com.chorely.starter.annual',
  'com.chorely.family':  'com.chorely.family.annual',
};

const TIERS = [
  {
    id: 'com.chorely.starter',
    title: 'Starter',
    subtitle: '1 child · 1 parent',
    popular: false,
  },
  {
    id: 'com.chorely.family',
    title: 'Family',
    subtitle: '2 children · 2 parents',
    popular: true,
  },
  {
    id: 'com.chorely.unlimited',
    title: 'Lifetime',
    subtitle: 'Unlimited children · 4 adults',
    popular: false,
  },
];

const TESTIMONIALS = [
  { name: 'Sarah M.', stars: '⭐⭐⭐⭐⭐', text: 'My kids actually do their chores now! The rewards system is brilliant.' },
  { name: 'James P.', stars: '⭐⭐⭐⭐⭐', text: 'Set up in 5 minutes, saves me an hour of nagging every day.' },
  { name: 'Emma T.', stars: '⭐⭐⭐⭐⭐', text: 'Love the photo proof feature. No more "I did it!" arguments.' },
];

const FEATURES = [
  { emoji: '📋', text: 'Assign chores with one tap' },
  { emoji: '💰', text: 'Pocket money or emoji rewards' },
  { emoji: '📸', text: 'Photo proof & parent approval mode' },
  { emoji: '🔔', text: 'Push notifications for the whole family' },
];

export default function Paywall() {
  const { uid, familyId, setAuth } = useAuthStore();
  // isUpgrade = true when the user already has a family (coming from Settings → Upgrade)
  const isUpgrade = !!familyId;

  const [selectedTier, setSelectedTier] = useState('com.chorely.family');
  const [isAnnual, setIsAnnual] = useState(false);
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    initIAP().catch(console.error);
    fetchProducts().then(setProducts).catch(console.error);
  }, []);

  // Returns the live App Store price, falling back to hardcoded constants
  function getPrice(tierId: string): string {
    const productId = isAnnual && ANNUAL_MAP[tierId] ? ANNUAL_MAP[tierId] : tierId;
    const live = products.find((p) => p.productId === productId);
    if (live?.localizedPrice) return live.localizedPrice;
    if (isAnnual && ANNUAL_MAP[tierId]) {
      return TIER_PRICES_ANNUAL[ANNUAL_MAP[tierId] as keyof typeof TIER_PRICES_ANNUAL] ?? '';
    }
    return TIER_PRICES[tierId as keyof typeof TIER_PRICES] ?? '';
  }

  const isLifetime = selectedTier === 'com.chorely.unlimited';
  // Annual toggle is irrelevant for Lifetime (one-time purchase, no annual variant)
  const activeProductId =
    !isLifetime && isAnnual && ANNUAL_MAP[selectedTier]
      ? ANNUAL_MAP[selectedTier]
      : selectedTier;

  const selectedTierObj = TIERS.find((t) => t.id === selectedTier)!;

  async function handlePurchase() {
    if (!uid) { router.push('/(auth)/sign-in'); return; }
    setLoading(true);
    try {
      await purchaseTier(activeProductId);
      if (isUpgrade) {
        // Upgrade path: family already exists — just update the tier in Firestore
        await savePurchaseToFirestore(familyId!, activeProductId);
        router.back();
      } else {
        // New user path: create family atomically via writeBatch, then route to onboarding
        const newFamilyId = await createFamily(uid, '', activeProductId);
        setAuth(uid, 'parent', newFamilyId, null);
        startSync(newFamilyId, 'parent', null);
        router.replace('/(auth)/onboarding');
      }
    } catch (e: any) {
      if (e.code !== 'E_USER_CANCELLED') {
        Alert.alert('Purchase failed', e.message ?? 'Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleRestore() {
    if (!uid) return;
    setLoading(true);
    try {
      // restorePurchases(familyId) updates Firestore if familyId is non-empty.
      // For new users (no familyId yet) we pass '' — restorePurchases returns the tier
      // and we create the family ourselves below.
      const tier = await restorePurchases(familyId ?? '');
      if (tier) {
        if (!familyId) {
          // New user — we know the tier, create the family now
          const newFamilyId = await createFamily(uid, '', tier);
          setAuth(uid, 'parent', newFamilyId, null);
          startSync(newFamilyId, 'parent', null);
        }
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

  const ctaLabel = isUpgrade
    ? `Upgrade to ${selectedTierObj.title}`
    : isLifetime
    ? 'Get Lifetime Access'
    : 'Start 7-Day Free Trial';

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
            style={{ fontSize: 32, fontWeight: '800', color: 'white', letterSpacing: -0.5, marginBottom: 6 }}
          >
            Chorely
          </Text>
          <Text style={{ fontSize: 15, color: 'rgba(255,255,255,0.85)', textAlign: 'center' }}>
            {isUpgrade
              ? 'Upgrade your family plan'
              : 'Start free for 7 days.\nCancel anytime.'}
          </Text>
        </View>

        {/* ── Feature bullets ── */}
        <View style={{ paddingHorizontal: 24, paddingTop: 28, paddingBottom: 8 }}>
          <Text style={{ fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 16 }}>
            Everything your family needs
          </Text>
          <View style={{ gap: 12 }}>
            {FEATURES.map(({ emoji, text }) => (
              <View key={text} style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
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

        {/* ── Testimonials (horizontal scroll) ── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 8, gap: 12 }}
        >
          {TESTIMONIALS.map((t) => (
            <View
              key={t.name}
              style={{
                width: 210,
                backgroundColor: 'white',
                borderRadius: 16,
                padding: 16,
                shadowColor: '#000',
                shadowOpacity: 0.05,
                shadowRadius: 8,
                shadowOffset: { width: 0, height: 2 },
                elevation: 2,
              }}
            >
              <Text style={{ fontSize: 12, marginBottom: 6 }}>{t.stars}</Text>
              <Text style={{ fontSize: 13, color: '#374151', lineHeight: 18, marginBottom: 8 }}>
                "{t.text}"
              </Text>
              <Text style={{ fontSize: 12, color: '#9CA3AF', fontWeight: '600' }}>{t.name}</Text>
            </View>
          ))}
        </ScrollView>

        {/* ── Annual / Weekly toggle — hidden for Lifetime ── */}
        {!isLifetime && (
          <View style={{ paddingHorizontal: 24, paddingTop: 24 }}>
            <View
              style={{
                flexDirection: 'row',
                backgroundColor: '#F3F4F6',
                borderRadius: 14,
                padding: 4,
              }}
            >
              <TouchableOpacity
                onPress={() => setIsAnnual(false)}
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  alignItems: 'center',
                  borderRadius: 10,
                  backgroundColor: !isAnnual ? 'white' : 'transparent',
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: !isAnnual ? '700' : '400',
                    color: !isAnnual ? '#111827' : '#6B7280',
                  }}
                >
                  Weekly
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setIsAnnual(true)}
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  paddingVertical: 10,
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  borderRadius: 10,
                  backgroundColor: isAnnual ? 'white' : 'transparent',
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: isAnnual ? '700' : '400',
                    color: isAnnual ? '#111827' : '#6B7280',
                  }}
                >
                  Annual
                </Text>
                <View
                  style={{
                    backgroundColor: '#22C55E',
                    borderRadius: 6,
                    paddingHorizontal: 6,
                    paddingVertical: 2,
                  }}
                >
                  <Text style={{ fontSize: 10, fontWeight: '700', color: 'white' }}>SAVE 50%</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ── Tier selection ── */}
        <View style={{ paddingHorizontal: 24, paddingTop: 20 }}>
          <Text style={{ fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 16 }}>
            Choose your plan
          </Text>
          {TIERS.map((tier) => {
            const selected = selectedTier === tier.id;
            return (
              <TouchableOpacity
                key={tier.id}
                onPress={() => setSelectedTier(tier.id)}
                style={{
                  borderWidth: 2,
                  borderColor: selected ? '#FF6B6B' : '#E5E7EB',
                  borderRadius: 20,
                  padding: 16,
                  marginBottom: 12,
                  backgroundColor: selected ? '#FFF5F5' : 'white',
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
              >
                {/* Radio dot */}
                <View
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 11,
                    borderWidth: 2,
                    borderColor: selected ? '#FF6B6B' : '#D1D5DB',
                    backgroundColor: selected ? '#FF6B6B' : 'transparent',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 14,
                  }}
                >
                  {selected && (
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: 'white' }} />
                  )}
                </View>

                {/* Labels */}
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827' }}>
                      {tier.title}
                    </Text>
                    {tier.popular && (
                      <View
                        style={{
                          backgroundColor: '#FF6B6B',
                          borderRadius: 6,
                          paddingHorizontal: 8,
                          paddingVertical: 2,
                        }}
                      >
                        <Text style={{ fontSize: 10, fontWeight: '700', color: 'white' }}>
                          POPULAR
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text style={{ fontSize: 13, color: '#6B7280', marginTop: 2 }}>
                    {tier.subtitle}
                  </Text>
                </View>

                {/* Price */}
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: '700',
                    color: selected ? '#FF6B6B' : '#374151',
                  }}
                >
                  {getPrice(tier.id)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── CTA ── */}
        <View style={{ paddingHorizontal: 24, paddingTop: 8 }}>
          <Button
            title={ctaLabel}
            onPress={handlePurchase}
            loading={loading}
            className="mb-2"
          />
          {!isUpgrade && !isLifetime && (
            <Text
              style={{ textAlign: 'center', fontSize: 13, color: '#9CA3AF', marginBottom: 12 }}
            >
              No charge today · Cancel anytime
            </Text>
          )}
          <Button title="Restore Purchase" variant="ghost" onPress={handleRestore} />
        </View>

        {/* ── Sign in link (new users only) ── */}
        {!isUpgrade && (
          <TouchableOpacity
            onPress={() => router.push('/(auth)/sign-in')}
            style={{ alignItems: 'center', paddingVertical: 16 }}
          >
            <Text style={{ color: '#9CA3AF', fontSize: 14 }}>
              Already have Chorely?{' '}
              <Text style={{ color: '#FF6B6B', fontWeight: '700' }}>Sign in</Text>
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
