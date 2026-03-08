import { Text as RNText, TextProps } from 'react-native';
import { cn } from '@/utils/cn';

interface Props extends TextProps {
  variant?: 'h1' | 'h2' | 'h3' | 'body' | 'caption' | 'label';
  className?: string;
}

const variants = {
  h1: 'text-3xl font-bold text-gray-900 dark:text-white',
  h2: 'text-2xl font-bold text-gray-900 dark:text-white',
  h3: 'text-xl font-semibold text-gray-800 dark:text-gray-100',
  body: 'text-base text-gray-700 dark:text-gray-300',
  caption: 'text-sm text-gray-500 dark:text-gray-400',
  label: 'text-sm font-medium text-gray-700 dark:text-gray-300',
};

export function Text({ variant = 'body', className, ...props }: Props) {
  return <RNText className={cn(variants[variant], className)} {...props} />;
}
