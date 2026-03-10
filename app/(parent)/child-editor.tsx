import { useState } from 'react';
import {
  View, TextInput, ScrollView, SafeAreaView, TouchableOpacity, Alert,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { useFamilyStore } from '@/stores/familyStore';
import { useAuthStore } from '@/stores/authStore';
import { addChild, updateChild, deleteChild } from '@/services/firestore';

// ─── Constants (mirrored from onboarding) ─────────────────────────────────────

const AVATAR_EMOJIS = ['🦄', '🦊', '🐻', '🐼', '🐨', '🦁', '🐯', '🦸', '🧙', '🐸', '🦋', '🌟', '🐙', '🦖', '🐬', '🧸'];
const CHILD_COLORS = ['#6366F1', '#EC4899', '#F59E0B', '#22C55E', '#3B82F6', '#8B5CF6', '#EF4444', '#14B8A6', '#F97316', '#06B6D4'];
const REWARD_EMOJIS = ['⭐', '🌟', '💎', '🏆', '🎮', '🍦', '🎁', '🦄', '🚀', '🌈', '🍕', '🎉'];
const CURRENT_YEAR = new Date().getFullYear();

// ─── Picker sub-components ────────────────────────────────────────────────────

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
          style={{
            backgroundColor: selected === emoji ? '#FF6B6B20' : '#F3F4F6',
            borderWidth: selected === emoji ? 2 : 0,
            borderColor: '#FF6B6B',
          }}
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
          className="w-10 h-10 rounded-full"
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

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function ChildEditor() {
  const { childId } = useLocalSearchParams<{ childId?: string }>();
  const { children } = useFamilyStore();
  const { familyId } = useAuthStore();

  const existing = childId ? children.find((c) => c.id === childId) : null;
  const isEdit = !!existing;

  const [name, setName] = useState(existing?.name ?? '');
  const [avatarEmoji, setAvatarEmoji] = useState(existing?.avatarEmoji ?? '🦄');
  const [colorTheme, setColorTheme] = useState(existing?.colorTheme ?? '#6366F1');
  const [rewardMode, setRewardMode] = useState<'money' | 'emoji'>(existing?.rewardMode ?? 'money');
  const [rewardEmoji, setRewardEmoji] = useState(existing?.rewardEmoji ?? '⭐');
  // Store birthYear as string for TextInput; parse to number only on save
  const [birthYear, setBirthYear] = useState(existing?.birthYear ? String(existing.birthYear) : '');
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  function validate(): string | null {
    if (!name.trim()) return 'Please enter a name for this child.';
    const yr = parseInt(birthYear, 10);
    if (birthYear && (isNaN(yr) || yr < CURRENT_YEAR - 18 || yr > CURRENT_YEAR - 2)) {
      return `Please enter a valid birth year between ${CURRENT_YEAR - 18} and ${CURRENT_YEAR - 2}.`;
    }
    return null;
  }

  async function handleSave() {
    if (!familyId) return;
    const err = validate();
    if (err) { Alert.alert('Oops', err); return; }

    setLoading(true);
    try {
      const data = {
        name: name.trim(),
        avatarEmoji,
        colorTheme,
        rewardMode,
        rewardEmoji,
        birthYear: birthYear ? parseInt(birthYear, 10) : null,
      };
      if (isEdit) {
        await updateChild(familyId, childId!, data);
      } else {
        await addChild(familyId, data);
      }
      router.back();
    } catch (e: unknown) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function handleDelete() {
    Alert.alert(
      'Remove child',
      `Remove ${existing!.name} from your family? Their chores and history will be deleted. This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            if (!familyId) return;
            setDeleting(true);
            try {
              await deleteChild(familyId, childId!);
              router.back();
            } catch (e: unknown) {
              Alert.alert('Error', e instanceof Error ? e.message : 'Could not remove child.');
              setDeleting(false);
            }
          },
        },
      ],
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          className="flex-1 px-5"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View className="flex-row items-center py-5">
            <TouchableOpacity onPress={() => router.back()} className="mr-4">
              <Text className="text-primary text-base">← Back</Text>
            </TouchableOpacity>
            <Text variant="h2">{isEdit ? 'Edit Child' : 'Add Child'}</Text>
          </View>

          {/* Name */}
          <Text variant="label" className="mb-2 text-gray-700">Name</Text>
          <TextInput
            className="border-2 rounded-2xl px-5 h-14 text-base text-gray-900 mb-5"
            style={{ borderColor: name.trim() ? '#FF6B6B' : '#E5E7EB' }}
            placeholder="Child's first name"
            placeholderTextColor="#9CA3AF"
            value={name}
            onChangeText={setName}
            autoFocus={!isEdit}
          />

          {/* Avatar */}
          <Text variant="label" className="mb-2 text-gray-700">Avatar</Text>
          <View className="mb-5">
            <EmojiRow options={AVATAR_EMOJIS} selected={avatarEmoji} onSelect={setAvatarEmoji} />
          </View>

          {/* Colour theme */}
          <Text variant="label" className="mb-3 text-gray-700">Colour theme</Text>
          <View className="mb-5">
            <ColorRow selected={colorTheme} onSelect={setColorTheme} />
          </View>

          {/* Birth year */}
          <Text variant="label" className="mb-2 text-gray-700">Birth year (optional)</Text>
          <TextInput
            className="border-2 rounded-2xl px-5 h-14 text-base text-gray-900 mb-5"
            style={{ borderColor: birthYear ? '#FF6B6B' : '#E5E7EB' }}
            placeholder="e.g. 2016"
            placeholderTextColor="#9CA3AF"
            value={birthYear}
            onChangeText={(v) => setBirthYear(v.replace(/\D/g, '').slice(0, 4))}
            keyboardType="number-pad"
            maxLength={4}
          />

          {/* Reward mode */}
          <Text variant="label" className="mb-3 text-gray-700">Rewards</Text>
          <View className="flex-row gap-x-3 mb-5">
            {(['money', 'emoji'] as const).map((mode) => (
              <TouchableOpacity
                key={mode}
                onPress={() => setRewardMode(mode)}
                className="flex-1 py-4 rounded-2xl items-center border-2"
                style={{
                  borderColor: rewardMode === mode ? '#FF6B6B' : '#E5E7EB',
                  backgroundColor: rewardMode === mode ? '#FF6B6B10' : '#fff',
                }}
              >
                <Text className="text-2xl mb-1">{mode === 'money' ? '💰' : '🎉'}</Text>
                <Text style={{ fontSize: 13, fontWeight: '600', color: rewardMode === mode ? '#FF6B6B' : '#6B7280' }}>
                  {mode === 'money' ? 'Pocket money' : 'Emoji rewards'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Reward emoji — only shown for emoji mode */}
          {rewardMode === 'emoji' && (
            <View className="mb-5">
              <Text variant="label" className="mb-2 text-gray-700">Reward emoji</Text>
              <EmojiRow options={REWARD_EMOJIS} selected={rewardEmoji} onSelect={setRewardEmoji} size="sm" />
            </View>
          )}

          {/* Save */}
          <Button
            title={isEdit ? 'Save Changes' : 'Add Child'}
            onPress={handleSave}
            loading={loading}
            className="mb-4 mt-2"
          />

          {/* Delete — edit mode only */}
          {isEdit && (
            <Button
              title="Remove Child"
              variant="danger"
              onPress={handleDelete}
              loading={deleting}
              className="mb-10"
            />
          )}

          <View className="h-4" />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
