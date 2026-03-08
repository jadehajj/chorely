import { TouchableOpacity, ActivityIndicator, Text, TouchableOpacityProps } from 'react-native';
import { cn } from '@/utils/cn';

interface Props extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  loading?: boolean;
  className?: string;
}

const variants = {
  primary: 'bg-primary active:bg-primary-dark',
  secondary: 'bg-white border border-gray-300 active:bg-gray-50',
  danger: 'bg-danger active:opacity-80',
  ghost: 'bg-transparent',
};

const textVariants = {
  primary: 'text-white font-semibold text-base',
  secondary: 'text-gray-800 font-semibold text-base',
  danger: 'text-white font-semibold text-base',
  ghost: 'text-primary font-semibold text-base',
};

export function Button({ title, variant = 'primary', loading, className, disabled, ...props }: Props) {
  return (
    <TouchableOpacity
      className={cn(
        'h-14 rounded-2xl items-center justify-center px-6',
        variants[variant],
        (disabled || loading) && 'opacity-50',
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? 'white' : '#6366F1'} />
      ) : (
        <Text className={textVariants[variant]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}
