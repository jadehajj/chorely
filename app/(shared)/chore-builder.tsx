import { useState } from 'react';
import { View, TextInput, ScrollView, SafeAreaView, Switch, TouchableOpacity, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { useFamilyStore } from '@/stores/familyStore';
import { useChoresStore } from '@/stores/choresStore';
import { createChore, updateChore } from '@/services/firestore';

const CHORE_EMOJIS = ['🧹', '🍽️', '🛏️', '🐕', '🌿', '🛁', '🗑️', '📚', '🧺', '🪟', '🧴', '🍳'];
const SCHEDULES = [
  { label: 'Daily', value: 'daily' },
  { label: 'Weekly', value: 'weekly' },
  { label: 'One-off', value: 'once' },
];

export default function ChoreBuilder() {
  const { choreId } = useLocalSearchParams<{ choreId?: string }>();
  const { family, children } = useFamilyStore();
  const { chores } = useChoresStore();
  const existing = choreId ? chores.find((c) => c.id === choreId) : null;

  const [name, setName] = useState(existing?.name ?? '');
  const [icon, setIcon] = useState(existing?.iconEmoji ?? '🧹');
  const [schedule, setSchedule] = useState(existing?.schedule ?? 'daily');
  const [value, setValue] = useState(String(existing?.value ?? '1'));
  const [assignedChildId, setAssignedChildId] = useState(existing?.assignedChildId ?? children[0]?.id ?? '');
  const [requiresApproval, setRequiresApproval] = useState(existing?.requiresApproval ?? false);
  const [loading, setLoading] = useState(false);

  const assignedChild = children.find((c) => c.id === assignedChildId);

  async function handleSave() {
    if (!family || !name.trim() || !assignedChildId) return;
    setLoading(true);
    try {
      const data = {
        name: name.trim(),
        iconEmoji: icon,
        schedule,
        value: parseFloat(value) || 0,
        assignedChildId,
        requiresApproval,
      };
      if (existing) {
        await updateChore(family.id, existing.id, data);
      } else {
        await createChore(family.id, data);
      }
      router.back();
    } catch (e: unknown) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1 px-5">
        <View className="flex-row items-center py-5">
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <Text className="text-primary text-base">← Back</Text>
          </TouchableOpacity>
          <Text variant="h2">{existing ? 'Edit Chore' : 'New Chore'}</Text>
        </View>

        <Text variant="label" className="mb-2">Chore name</Text>
        <TextInput
          className="border border-gray-200 rounded-2xl px-4 h-14 text-base mb-5"
          placeholder="e.g. Tidy bedroom"
          value={name}
          onChangeText={setName}
        />

        <Text variant="label" className="mb-3">Icon</Text>
        <View className="flex-row flex-wrap mb-5">
          {CHORE_EMOJIS.map((e) => (
            <TouchableOpacity
              key={e}
              onPress={() => setIcon(e)}
              className={`w-12 h-12 items-center justify-center rounded-2xl mr-2 mb-2 ${icon === e ? 'bg-primary/20 border-2 border-primary' : 'bg-gray-100'}`}
            >
              <Text className="text-2xl">{e}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text variant="label" className="mb-3">Schedule</Text>
        <View className="flex-row mb-5">
          {SCHEDULES.map((s) => (
            <TouchableOpacity
              key={s.value}
              onPress={() => setSchedule(s.value as 'daily' | 'weekly' | 'once')}
              className={`flex-1 h-11 items-center justify-center rounded-xl mr-2 border ${schedule === s.value ? 'border-primary bg-primary/10' : 'border-gray-200'}`}
            >
              <Text variant="caption" className={schedule === s.value ? 'text-primary font-semibold' : ''}>{s.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text variant="label" className="mb-2">Assign to</Text>
        <View className="flex-row flex-wrap mb-5">
          {children.map((child) => (
            <TouchableOpacity
              key={child.id}
              onPress={() => setAssignedChildId(child.id)}
              className={`flex-row items-center px-4 h-11 rounded-full mr-2 mb-2 border ${assignedChildId === child.id ? 'border-primary bg-primary/10' : 'border-gray-200'}`}
            >
              <Text className="mr-1">{child.avatarEmoji}</Text>
              <Text variant="caption">{child.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text variant="label" className="mb-2">
          Reward value {assignedChild?.rewardMode === 'emoji' ? `(${assignedChild.rewardEmoji})` : `(${family?.currency ?? 'AUD'})`}
        </Text>
        <TextInput
          className="border border-gray-200 rounded-2xl px-4 h-14 text-base mb-5"
          placeholder={assignedChild?.rewardMode === 'emoji' ? '5' : '2.00'}
          value={value}
          onChangeText={setValue}
          keyboardType="decimal-pad"
        />

        <View className="flex-row items-center justify-between mb-8">
          <View className="flex-1">
            <Text variant="label">Require my approval</Text>
            <Text variant="caption">Balance updates only after you approve</Text>
          </View>
          <Switch
            value={requiresApproval}
            onValueChange={setRequiresApproval}
            trackColor={{ true: '#FF6B6B' }}
          />
        </View>

        <Button title="Save Chore" onPress={handleSave} loading={loading} className="mb-8" />
      </ScrollView>
    </SafeAreaView>
  );
}
