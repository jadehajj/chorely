import { useState } from 'react';
import {
  View, TextInput, SafeAreaView, Alert, ScrollView, TouchableOpacity,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { router } from 'expo-router';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/services/firebase';
import { createFamily } from '@/services/firestore';
import { startSync } from '@/services/sync';
import { useAuthStore } from '@/stores/authStore';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';

// ─── Constants ───────────────────────────────────────────────────────────────

const AVATAR_EMOJIS = ['🦄', '🦊', '🐻', '🐼', '🐨', '🦁', '🐯', '🦸', '🧙', '🐸', '🦋', '🌟', '🐙', '🦖', '🐬', '🧸'];
const CHILD_COLORS = ['#6366F1', '#EC4899', '#F59E0B', '#22C55E', '#3B82F6', '#8B5CF6', '#EF4444', '#14B8A6', '#F97316', '#06B6D4'];
const REWARD_EMOJIS = ['⭐', '🌟', '💎', '🏆', '🎮', '🍦', '🎁', '🦄', '🚀', '🌈', '🍕', '🎉'];
const CURRENT_YEAR = new Date().getFullYear();

// Bug #18 fix: 'First child' → 'Add child'
const STEP_LABELS = ['Family', 'Add child', 'Review', 'Settings'];

// ─── Types ────────────────────────────────────────────────────────────────────

interface ChildDraft {
  name: string;
  avatarEmoji: string;
  colorTheme: string;
  rewardMode: 'money' | 'emoji';
  rewardEmoji: string;
  birthYear: string; // kept as string for TextInput, parsed on save
}

type VerificationMode = 'self' | 'approval';

function defaultChild(): ChildDraft {
  return {
    name: '',
    avatarEmoji: '🦄',
    colorTheme: '#6366F1',
    rewardMode: 'money',
    rewardEmoji: '⭐',
    birthYear: '',
  };
}

// ─── Step sub-components ──────────────────────────────────────────────────────

function EmojiRow({
  options, selected, onSelect, size = 'md',
}: { options: string[]; selected: string; onSelect: (v: string) => void; size?: 'sm' | 'md' }) {
  const btnSize = size === 'sm' ? 'w-10 h-10' : 'w-14 h-14';
  const txtSize = size === 'sm' ? 'text-xl' : 'text-3xl';
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
      {options.map((emoji) => (
        <TouchableOpacity
          key={emoji}
          onPress={() => onSelect(emoji)}
          className={`${btnSize} rounded-2xl items-center justify-center mr-2`}
          style={{ backgroundColor: selected === emoji ? '#FF6B6B20' : '#F3F4F6', borderWidth: selected === emoji ? 2 : 0, borderColor: '#FF6B6B' }}
        >
          <Text className={txtSize}>{emoji}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

function ColorRow({ selected, onSelect }: { selected: string; onSelect: (v: string) => void }) {
  return (
    <View className="flex-row flex-wrap gap-3">
      {CHILD_COLORS.map((color) => (
        <TouchableOpacity
          key={color}
          onPress={() => onSelect(color)}
          className="w-10 h-10 rounded-full items-center justify-center"
          style={{
            backgroundColor: color,
            borderWidth: selected === color ? 3 : 0,
            borderColor: '#111827',
            transform: [{ scale: selected === color ? 1.1 : 1 }],
          }}
        />
      ))}
    </View>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function Onboarding() {
  const { uid, setAuth } = useAuthStore();

  const [step, setStep] = useState(0);
  const [familyName, setFamilyName] = useState('');
  const [children, setChildren] = useState<ChildDraft[]>([]);
  const [currentChild, setCurrentChild] = useState<ChildDraft>(defaultChild());
  const [verificationMode, setVerificationMode] = useState<VerificationMode>('self');
  const [loading, setLoading] = useState(false);

  // ── Step 0: Family name ──
  function handleFamilyNameNext() {
    if (!familyName.trim()) {
      Alert.alert('Family name required', 'Please enter your family name to continue.');
      return;
    }
    setStep(1);
  }

  // ── Step 1: Add child ──
  function validateChild(): string | null {
    if (!currentChild.name.trim()) return 'Please enter a name for this child.';
    const yr = parseInt(currentChild.birthYear);
    if (currentChild.birthYear && (isNaN(yr) || yr < CURRENT_YEAR - 18 || yr > CURRENT_YEAR - 2)) {
      return 'Please enter a valid birth year (e.g. 2016).';
    }
    return null;
  }

  function handleAddChild() {
    const err = validateChild();
    if (err) { Alert.alert('Oops', err); return; }
    setChildren((prev) => [...prev, currentChild]);
    setCurrentChild(defaultChild());
    setStep(2);
  }

  // Bug #1 fix: skip adding a child without validation
  function handleSkipChild() {
    setStep(2);
  }

  function handleRemoveChild(idx: number) {
    setChildren((prev) => prev.filter((_, i) => i !== idx));
  }

  // ── Step 3: Finish ──
  async function handleFinish() {
    if (!uid) return;
    setLoading(true);
    try {
      const familyId = await createFamily(uid, familyName.trim(), 'free');

      // Write all children in parallel (empty array is fine — Promise.all([]) resolves immediately)
      await Promise.all(
        children.map((child) =>
          addDoc(collection(db, 'families', familyId, 'children'), {
            name: child.name.trim(),
            avatarEmoji: child.avatarEmoji,
            colorTheme: child.colorTheme,
            rewardMode: child.rewardMode,
            rewardEmoji: child.rewardEmoji,
            ...(child.birthYear ? { birthYear: parseInt(child.birthYear) } : {}),
            balance: 0,
            linkedDeviceId: null,
            createdAt: serverTimestamp(),
          })
        )
      );

      // Update family verification mode
      const { updateDoc, doc } = await import('firebase/firestore');
      await updateDoc(doc(db, 'families', familyId), { verificationMode });

      setAuth(uid, 'parent', familyId, null);
      startSync(familyId, 'parent', null);
      router.replace('/(parent)/dashboard');
    } catch (e: unknown) {
      Alert.alert('Setup failed', e instanceof Error ? e.message : 'Please try again.');
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
        {/* ── Progress header ──────────────────────────────────────────────── */}
        <View className="px-6 pt-5 mb-6">
          {/* Bug #6 fix: back button row (only shown when step > 0) */}
          {/* Bug #18 fix: step label text shown on right */}
          <View className="flex-row items-center mb-3">
            {step > 0 ? (
              <TouchableOpacity onPress={() => setStep(step - 1)}>
                <Text className="text-primary text-base">← Back</Text>
              </TouchableOpacity>
            ) : (
              // Invisible spacer so label stays right-aligned on step 0
              <View style={{ width: 52 }} />
            )}
            <Text
              variant="caption"
              className="flex-1 text-right text-gray-400"
            >
              {STEP_LABELS[step]}
            </Text>
          </View>

          {/* Progress dots */}
          <View className="flex-row gap-x-2">
            {STEP_LABELS.map((_, i) => (
              <View
                key={i}
                className="flex-1 h-1.5 rounded-full"
                style={{ backgroundColor: i <= step ? '#FF6B6B' : '#E5E7EB' }}
              />
            ))}
          </View>
        </View>

        <ScrollView
          className="flex-1"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="px-6">

            {/* ── STEP 0: Family name ─────────────────────────────── */}
            {step === 0 && (
              <View>
                <Text className="text-4xl mb-4">🏠</Text>
                <Text variant="h2" className="text-gray-900 mb-2">What's your family name?</Text>
                <Text variant="caption" className="mb-6">
                  This is how your family will appear in the app.
                </Text>
                <TextInput
                  className="border-2 rounded-2xl px-5 h-16 text-xl text-gray-900 mb-4"
                  style={{ borderColor: familyName.trim() ? '#FF6B6B' : '#E5E7EB' }}
                  placeholder="e.g. The Smiths"
                  placeholderTextColor="#9CA3AF"
                  value={familyName}
                  onChangeText={setFamilyName}
                  returnKeyType="next"
                  onSubmitEditing={handleFamilyNameNext}
                />
                <Button title="Next →" onPress={handleFamilyNameNext} className="mt-2" />
              </View>
            )}

            {/* ── STEP 1: Add first child ──────────────────────────── */}
            {step === 1 && (
              <View>
                <Text className="text-4xl mb-4">👧</Text>
                <Text variant="h2" className="text-gray-900 mb-1">Add your first child</Text>

                {/* Bug #1 fix: caption + skip link in one row */}
                <View className="flex-row items-center mb-6">
                  <Text variant="caption" className="flex-1">
                    You can add more after setup.
                  </Text>
                  <TouchableOpacity onPress={handleSkipChild}>
                    <Text className="text-primary font-medium" style={{ fontSize: 13 }}>
                      Skip for now →
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Name */}
                <Text variant="label" className="mb-2 text-gray-700">Name</Text>
                <TextInput
                  className="border-2 rounded-2xl px-5 h-14 text-base text-gray-900 mb-5"
                  style={{ borderColor: currentChild.name.trim() ? '#FF6B6B' : '#E5E7EB' }}
                  placeholder="Child's first name"
                  placeholderTextColor="#9CA3AF"
                  value={currentChild.name}
                  onChangeText={(v) => setCurrentChild((p) => ({ ...p, name: v }))}
                />

                {/* Avatar */}
                <Text variant="label" className="mb-2 text-gray-700">Avatar</Text>
                <View className="mb-5">
                  <EmojiRow
                    options={AVATAR_EMOJIS}
                    selected={currentChild.avatarEmoji}
                    onSelect={(v) => setCurrentChild((p) => ({ ...p, avatarEmoji: v }))}
                  />
                </View>

                {/* Color */}
                <Text variant="label" className="mb-3 text-gray-700">Colour theme</Text>
                <View className="mb-5">
                  <ColorRow
                    selected={currentChild.colorTheme}
                    onSelect={(v) => setCurrentChild((p) => ({ ...p, colorTheme: v }))}
                  />
                </View>

                {/* Birth year */}
                <Text variant="label" className="mb-2 text-gray-700">Birth year (optional)</Text>
                <TextInput
                  className="border-2 rounded-2xl px-5 h-14 text-base text-gray-900 mb-5"
                  style={{ borderColor: currentChild.birthYear ? '#FF6B6B' : '#E5E7EB' }}
                  placeholder="e.g. 2016"
                  placeholderTextColor="#9CA3AF"
                  value={currentChild.birthYear}
                  onChangeText={(v) => setCurrentChild((p) => ({ ...p, birthYear: v.replace(/\D/g, '').slice(0, 4) }))}
                  keyboardType="number-pad"
                  maxLength={4}
                />

                {/* Reward mode */}
                <Text variant="label" className="mb-3 text-gray-700">Rewards</Text>
                <View className="flex-row gap-x-3 mb-5">
                  {(['money', 'emoji'] as const).map((mode) => (
                    <TouchableOpacity
                      key={mode}
                      onPress={() => setCurrentChild((p) => ({ ...p, rewardMode: mode }))}
                      className="flex-1 py-4 rounded-2xl items-center border-2"
                      style={{
                        borderColor: currentChild.rewardMode === mode ? '#FF6B6B' : '#E5E7EB',
                        backgroundColor: currentChild.rewardMode === mode ? '#FF6B6B10' : '#fff',
                      }}
                    >
                      <Text className="text-2xl mb-1">{mode === 'money' ? '💰' : '🎉'}</Text>
                      <Text style={{ fontSize: 13, fontWeight: '600', color: currentChild.rewardMode === mode ? '#FF6B6B' : '#6B7280' }}>
                        {mode === 'money' ? 'Pocket money' : 'Emoji rewards'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Reward emoji — only for emoji mode */}
                {currentChild.rewardMode === 'emoji' && (
                  <View className="mb-5">
                    <Text variant="label" className="mb-2 text-gray-700">Reward emoji</Text>
                    <EmojiRow
                      options={REWARD_EMOJIS}
                      selected={currentChild.rewardEmoji}
                      onSelect={(v) => setCurrentChild((p) => ({ ...p, rewardEmoji: v }))}
                      size="sm"
                    />
                  </View>
                )}

                <Button title="Add Child →" onPress={handleAddChild} className="mt-2" />
              </View>
            )}

            {/* ── STEP 2: Review + add more ────────────────────────── */}
            {step === 2 && (
              <View>
                <Text className="text-4xl mb-4">✅</Text>
                <Text variant="h2" className="text-gray-900 mb-1">Looking great!</Text>
                <Text variant="caption" className="mb-6">Review your children or add more.</Text>

                {children.length === 0 && (
                  <Text variant="caption" className="text-center text-gray-400 mb-4">
                    No children added yet — you can add them here or after setup.
                  </Text>
                )}

                {children.map((child, idx) => (
                  <View
                    key={idx}
                    className="flex-row items-center bg-gray-50 rounded-2xl p-4 mb-3 border border-gray-100"
                  >
                    <View
                      className="w-12 h-12 rounded-full items-center justify-center mr-3"
                      style={{ backgroundColor: child.colorTheme + '30' }}
                    >
                      <Text className="text-2xl">{child.avatarEmoji}</Text>
                    </View>
                    <View className="flex-1">
                      <Text variant="label" className="text-gray-900">{child.name}</Text>
                      <Text variant="caption">
                        {child.rewardMode === 'money' ? '💰 Pocket money' : `${child.rewardEmoji} Emoji rewards`}
                        {child.birthYear ? ` · Born ${child.birthYear}` : ''}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleRemoveChild(idx)}
                      className="w-8 h-8 items-center justify-center"
                    >
                      <Text className="text-gray-400 text-xl">✕</Text>
                    </TouchableOpacity>
                  </View>
                ))}

                <TouchableOpacity
                  onPress={() => { setCurrentChild(defaultChild()); setStep(1); }}
                  className="border-2 border-dashed border-gray-300 rounded-2xl p-4 items-center mb-6 mt-2"
                >
                  <Text className="text-primary font-semibold">+ Add another child</Text>
                </TouchableOpacity>

                <Button title="Continue →" onPress={() => setStep(3)} />
              </View>
            )}

            {/* ── STEP 3: Verification mode ────────────────────────── */}
            {step === 3 && (
              <View>
                <Text className="text-4xl mb-4">🔒</Text>
                <Text variant="h2" className="text-gray-900 mb-1">How should chores work?</Text>
                <Text variant="caption" className="mb-6">You can always change this later in settings.</Text>

                {([
                  {
                    mode: 'self' as VerificationMode,
                    emoji: '🟢',
                    title: 'Kids self-complete',
                    desc: 'Children mark chores as done themselves — instant gratification!',
                  },
                  {
                    mode: 'approval' as VerificationMode,
                    emoji: '✅',
                    title: 'Parent approval required',
                    desc: 'You review and approve each completed chore before rewards are given.',
                  },
                ] as const).map(({ mode, emoji, title, desc }) => (
                  <TouchableOpacity
                    key={mode}
                    onPress={() => setVerificationMode(mode)}
                    className="rounded-2xl p-5 mb-3 border-2"
                    style={{
                      borderColor: verificationMode === mode ? '#FF6B6B' : '#E5E7EB',
                      backgroundColor: verificationMode === mode ? '#FF6B6B08' : '#fff',
                    }}
                  >
                    <View className="flex-row items-center mb-2">
                      <Text className="text-2xl mr-2">{emoji}</Text>
                      <Text variant="h3" className="text-gray-900">{title}</Text>
                    </View>
                    <Text variant="caption">{desc}</Text>
                  </TouchableOpacity>
                ))}

                <View className="mt-6">
                  <Button
                    title="Create Family 🎉"
                    onPress={handleFinish}
                    loading={loading}
                  />
                </View>
              </View>
            )}

          </View>
          <View className="h-12" />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
