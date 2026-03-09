import { TouchableOpacity, View } from 'react-native';
import { Text } from './Text';
import { cn } from '@/utils/cn';

interface Props {
  title: string;
  price: string;
  description: string;
  features: string[];
  isPopular?: boolean;
  isSelected?: boolean;
  onPress: () => void;
}

export function TierCard({ title, price, description, features, isPopular, isSelected, onPress }: Props) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className={cn(
        'rounded-3xl p-5 border-2 mb-3',
        isSelected ? 'border-primary bg-primary/10' : 'border-gray-200 bg-white',
      )}
    >
      {isPopular && (
        <View className="absolute -top-3 right-5 bg-primary px-3 py-1 rounded-full">
          <Text className="text-white text-xs font-bold">Most Popular ★</Text>
        </View>
      )}
      <View className="flex-row justify-between items-center mb-2">
        <Text variant="h3" className="dark:text-gray-900">{title}</Text>
        <Text className="text-2xl font-bold text-primary">{price}</Text>
      </View>
      <Text variant="caption" className="mb-3 dark:text-gray-600">{description}</Text>
      {features.map((f) => (
        <Text key={f} variant="caption" className="mb-1 dark:text-gray-600">✓ {f}</Text>
      ))}
    </TouchableOpacity>
  );
}
