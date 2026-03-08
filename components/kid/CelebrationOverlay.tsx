import { useEffect } from 'react';
import { View, Modal } from 'react-native';
import LottieView from 'lottie-react-native';
import { Text } from '@/components/ui/Text';

interface Props {
  visible: boolean;
  message: string;
  onDone: () => void;
}

export function CelebrationOverlay({ visible, message, onDone }: Props) {
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(onDone, 2500);
      return () => clearTimeout(timer);
    }
  }, [visible, onDone]);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View className="flex-1 bg-black/40 items-center justify-center">
        <LottieView
          source={require('@/assets/animations/celebration.json')}
          autoPlay
          loop={false}
          style={{ width: '100%', height: '100%', position: 'absolute' }}
        />
        <Text className="text-white text-4xl font-bold text-center">{message}</Text>
      </View>
    </Modal>
  );
}
