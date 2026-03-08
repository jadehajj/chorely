import { View, ViewProps } from 'react-native';
import { cn } from '@/utils/cn';

interface Props extends ViewProps {
  className?: string;
}

export function Card({ className, ...props }: Props) {
  return (
    <View
      className={cn('bg-white dark:bg-gray-800 rounded-3xl p-4 shadow-sm', className)}
      {...props}
    />
  );
}
