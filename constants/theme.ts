export const COLORS = {
  primary: '#6366F1',
  primaryDark: '#4F46E5',
  success: '#22C55E',
  warning: '#F59E0B',
  danger: '#EF4444',
  surface: '#F9FAFB',
  text: '#111827',
  textSecondary: '#6B7280',
  border: '#E5E7EB',
  white: '#FFFFFF',
};

export const CHILD_THEMES = [
  '#6366F1', '#EC4899', '#F59E0B', '#22C55E',
  '#3B82F6', '#8B5CF6', '#EF4444', '#14B8A6',
];

export const TIER_LIMITS = {
  'com.chorely.starter': 1,
  'com.chorely.family': 3,
  'com.chorely.unlimited': Infinity,
} as const;

export const TIER_PRICES = {
  'com.chorely.starter': '$4.99',
  'com.chorely.family': '$6.99',
  'com.chorely.unlimited': '$9.99',
} as const;
