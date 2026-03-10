import { TouchableOpacity, View } from 'react-native';
import { Text } from './Text';
import { cn } from '@/utils/cn';

interface Props {
  title: string;
  price: string;       // e.g. "$2.99/wk" or "$100"
  priceNote?: string;  // e.g. "after 7-day free trial"
  description: string;
  features: string[];
  badge?: string;      // e.g. "Most Popular ★" — shown as a floating pill
  isSelected?: boolean;
  onPress: () => void;
}

export function TierCard({
  title,
  price,
  priceNote,
  description,
  features,
  badge,
  isSelected,
  onPress,
}: Props) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className={cn(
        'rounded-3xl p-5 border-2 mb-3',
        isSelected ? 'border-primary bg-primary/10' : 'border-gray-200 bg-white',
      )}
    >
      {/* Floating badge pill (e.g. "Most Popular ★") */}
      {badge && (
        <View className="absolute -top-3 right-5 bg-primary px-3 py-1 rounded-full">
          <Text className="text-white text-xs font-bold">{badge}</Text>
        </View>
      )}

      {/* Title row + price */}
      <View className="flex-row justify-between items-start mb-1">
        <Text variant="h3" className="dark:text-gray-900">{title}</Text>

        {/* Price stacked: big number + small period note */}
        <View style={{ alignItems: 'flex-end' }}>
          <Text className="text-2xl font-bold text-primary">{price}</Text>
          {priceNote ? (
            <Text style={{ fontSize: 10, color: '#9CA3AF', marginTop: 1 }}>{priceNote}</Text>
          ) : null}
        </View>
      </View>

      <Text variant="caption" className="mb-3 dark:text-gray-600">{description}</Text>

      {features.map((f) => (
        <Text key={f} variant="caption" className="mb-1 dark:text-gray-600">✓ {f}</Text>
      ))}
    </TouchableOpacity>
  );
}
