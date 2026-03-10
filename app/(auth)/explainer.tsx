import { useRef, useState } from 'react';
import {
  View,
  FlatList,
  Dimensions,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Platform,
  ViewToken,
} from 'react-native';
import { router } from 'expo-router';
import { Text } from '@/components/ui/Text';

const { width: W } = Dimensions.get('window');

// ── Types ──────────────────────────────────────────────────────────────────

interface Badge {
  emoji: string;
  label: string;
}

interface SlideData {
  id: string;
  bg: string;
  darkBg: string;
  emoji: string;
  badges: Badge[];
  title: string;
  body: string;
}

// ── Slide content ──────────────────────────────────────────────────────────

const SLIDES: SlideData[] = [
  {
    id: '1',
    bg: '#FF6B6B',
    darkBg: '#D94F4F',
    emoji: '📋',
    badges: [
      { emoji: '🛏️', label: 'Make bed' },
      { emoji: '🍽️', label: 'Dishes' },
      { emoji: '🧹', label: 'Vacuum' },
      { emoji: '🐕', label: 'Walk dog' },
    ],
    title: 'Assign chores your way',
    body: 'Create daily, weekly, or one-off chores and assign them to each child in seconds.',
  },
  {
    id: '2',
    bg: '#FF9843',
    darkBg: '#D97A20',
    emoji: '💰',
    badges: [
      { emoji: '⭐', label: 'Stars' },
      { emoji: '🌟', label: 'Bonus' },
      { emoji: '🎁', label: 'Rewards' },
      { emoji: '🎮', label: 'Screen time' },
    ],
    title: 'Kids earn real rewards',
    body: 'Pocket money or emoji stars — balances update automatically when chores are done.',
  },
  {
    id: '3',
    bg: '#6366F1',
    darkBg: '#4338CA',
    emoji: '✅',
    badges: [
      { emoji: '📸', label: 'Photo proof' },
      { emoji: '🔔', label: 'Alerts' },
      { emoji: '📊', label: 'Progress' },
      { emoji: '👏', label: 'Celebrate' },
    ],
    title: "You're always in control",
    body: 'Approve completions with photo proof, track progress, and get notified in real time.',
  },
];

// ── Illustration ───────────────────────────────────────────────────────────

function Illustration({
  darkBg,
  emoji,
  badges,
}: Pick<SlideData, 'darkBg' | 'emoji' | 'badges'>) {
  return (
    <View
      style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 }}
    >
      {/* Central emoji in a deep-tinted circle */}
      <View
        style={{
          width: 136,
          height: 136,
          borderRadius: 68,
          backgroundColor: darkBg,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 28,
          shadowColor: '#000',
          shadowOpacity: 0.18,
          shadowRadius: 24,
          shadowOffset: { width: 0, height: 10 },
          elevation: 8,
        }}
      >
        <Text style={{ fontSize: 62 }}>{emoji}</Text>
      </View>

      {/* Badge strip — mini cards showing what the feature does */}
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {badges.map(({ emoji: e, label }) => (
          <View
            key={label}
            style={{
              alignItems: 'center',
              backgroundColor: 'rgba(255,255,255,0.2)',
              borderRadius: 16,
              paddingVertical: 10,
              paddingHorizontal: 10,
              minWidth: 64,
            }}
          >
            <Text style={{ fontSize: 24, marginBottom: 3 }}>{e}</Text>
            <Text
              style={{
                color: 'rgba(255,255,255,0.9)',
                fontSize: 10,
                fontWeight: '600',
                textAlign: 'center',
              }}
            >
              {label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ── Single slide (fills FlatList page) ────────────────────────────────────

function SlideItem({ item }: { item: SlideData }) {
  return (
    <View style={{ width: W, flex: 1, backgroundColor: item.bg }}>
      <Illustration darkBg={item.darkBg} emoji={item.emoji} badges={item.badges} />
    </View>
  );
}

// ── Main screen ────────────────────────────────────────────────────────────

export default function Explainer() {
  const [activeIdx, setActiveIdx] = useState(0);
  const listRef = useRef<FlatList<SlideData>>(null);

  // useRef prevents re-creating the callback on every render (FlatList requirement)
  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems[0]) setActiveIdx(viewableItems[0].index ?? 0);
    },
  ).current;

  function advance() {
    if (activeIdx < SLIDES.length - 1) {
      listRef.current?.scrollToIndex({ index: activeIdx + 1, animated: true });
    } else {
      router.replace('/(auth)/paywall');
    }
  }

  const isLast = activeIdx === SLIDES.length - 1;
  const slide = SLIDES[activeIdx];

  return (
    // Outer View background matches the active slide so there are no colour gaps
    <View style={{ flex: 1, backgroundColor: slide.bg }}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={{ flex: 1 }}>

        {/* ── Top bar: wordmark + skip ── */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: 24,
            paddingVertical: 12,
          }}
        >
          <Text
            style={{ color: 'white', fontSize: 22, fontWeight: '800', letterSpacing: -0.5 }}
          >
            Chorely
          </Text>
          <TouchableOpacity
            onPress={() => router.replace('/(auth)/paywall')}
            hitSlop={{ top: 12, bottom: 12, left: 16, right: 16 }}
          >
            <Text
              style={{ color: 'rgba(255,255,255,0.75)', fontSize: 16, fontWeight: '600' }}
            >
              Skip
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── Horizontally paged slides ── */}
        <FlatList
          ref={listRef}
          data={SLIDES}
          keyExtractor={(s) => s.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
          renderItem={({ item }) => <SlideItem item={item} />}
          style={{ flex: 1 }}
          scrollEventThrottle={16}
        />

        {/* ── Bottom white card (title, body, dots, CTA) ── */}
        <View
          style={{
            backgroundColor: 'white',
            borderTopLeftRadius: 36,
            borderTopRightRadius: 36,
            paddingHorizontal: 28,
            paddingTop: 28,
            paddingBottom: Platform.OS === 'ios' ? 4 : 24,
          }}
        >
          <Text
            style={{
              fontSize: 28,
              fontWeight: '800',
              color: '#111827',
              marginBottom: 10,
              lineHeight: 34,
              letterSpacing: -0.5,
            }}
          >
            {slide.title}
          </Text>
          <Text
            style={{ fontSize: 16, color: '#6B7280', lineHeight: 24, marginBottom: 28 }}
          >
            {slide.body}
          </Text>

          {/* Dots + CTA row */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 4,
            }}
          >
            {/* Expanding-dot pagination */}
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {SLIDES.map((_, i) => (
                <View
                  key={i}
                  style={{
                    height: 8,
                    width: i === activeIdx ? 24 : 8,
                    borderRadius: 4,
                    backgroundColor: i === activeIdx ? slide.bg : '#E5E7EB',
                  }}
                />
              ))}
            </View>

            {/* Pill button — colour-matched to active slide */}
            <TouchableOpacity
              onPress={advance}
              style={{
                backgroundColor: slide.bg,
                borderRadius: 30,
                paddingHorizontal: 22,
                paddingVertical: 13,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                shadowColor: slide.bg,
                shadowOpacity: 0.35,
                shadowRadius: 10,
                shadowOffset: { width: 0, height: 4 },
                elevation: 6,
              }}
            >
              <Text style={{ color: 'white', fontWeight: '700', fontSize: 16 }}>
                {isLast ? 'Get Started' : 'Next'}
              </Text>
              <Text style={{ color: 'white', fontSize: 16 }}>
                {isLast ? '🚀' : '→'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Sign-in prompt on last slide only */}
          {isLast && (
            <TouchableOpacity
              onPress={() => router.push('/(auth)/sign-in')}
              style={{ alignItems: 'center', paddingVertical: 16 }}
            >
              <Text style={{ color: '#9CA3AF', fontSize: 14 }}>
                Already have an account?{' '}
                <Text style={{ color: slide.bg, fontWeight: '700' }}>Sign in</Text>
              </Text>
            </TouchableOpacity>
          )}
        </View>

      </SafeAreaView>
    </View>
  );
}
