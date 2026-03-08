import { useState } from 'react';
import { View, TextInput, ScrollView, TouchableOpacity } from 'react-native';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { CHILD_THEMES } from '@/constants/theme';

const AVATAR_EMOJIS = ['👦', '👧', '🧒', '👶', '🐱', '🐶', '🦄', '🐻', '🐼', '🦊'];

interface Props {
  onNext: (child: { name: string; avatarEmoji: string; colorTheme: string; rewardMode: 'money' | 'emoji'; rewardEmoji: string }) => void;
}

export function StepAddChild({ onNext }: Props) {
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('👦');
  const [color, setColor] = useState(CHILD_THEMES[0]);
  const [rewardMode, setRewardMode] = useState<'money' | 'emoji'>('money');
  const [rewardEmoji, setRewardEmoji] = useState('⭐');

  return (
    <ScrollView className="flex-1 px-5">
      <Text variant="h2" className="mb-6">Add your first child</Text>

      <Text variant="label" className="mb-2">Name</Text>
      <TextInput
        className="border border-gray-200 rounded-2xl px-4 h-14 text-base mb-6"
        placeholder="Child's name"
        value={name}
        onChangeText={setName}
      />

      <Text variant="label" className="mb-3">Avatar</Text>
      <View className="flex-row flex-wrap mb-6">
        {AVATAR_EMOJIS.map((e) => (
          <TouchableOpacity
            key={e}
            onPress={() => setAvatar(e)}
            className={`w-12 h-12 items-center justify-center rounded-full mr-2 mb-2 ${avatar === e ? 'bg-indigo-100 border-2 border-primary' : 'bg-gray-100'}`}
          >
            <Text className="text-2xl">{e}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text variant="label" className="mb-3">Colour theme</Text>
      <View className="flex-row flex-wrap mb-6">
        {CHILD_THEMES.map((theme) => (
          <TouchableOpacity
            key={theme}
            onPress={() => setColor(theme)}
            style={{ backgroundColor: theme }}
            className={`w-10 h-10 rounded-full mr-2 mb-2 ${color === theme ? 'border-4 border-gray-800' : ''}`}
          />
        ))}
      </View>

      <Text variant="label" className="mb-3">Reward type</Text>
      <View className="flex-row mb-6">
        <TouchableOpacity
          onPress={() => setRewardMode('money')}
          className={`flex-1 h-14 items-center justify-center rounded-2xl mr-2 border-2 ${rewardMode === 'money' ? 'border-primary bg-indigo-50' : 'border-gray-200'}`}
        >
          <Text className="text-lg">💰 Money</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setRewardMode('emoji')}
          className={`flex-1 h-14 items-center justify-center rounded-2xl border-2 ${rewardMode === 'emoji' ? 'border-primary bg-indigo-50' : 'border-gray-200'}`}
        >
          <Text className="text-lg">⭐ Emoji</Text>
        </TouchableOpacity>
      </View>

      <Button
        title="Next →"
        onPress={() => onNext({ name, avatarEmoji: avatar, colorTheme: color, rewardMode, rewardEmoji })}
        disabled={!name.trim()}
      />
    </ScrollView>
  );
}
