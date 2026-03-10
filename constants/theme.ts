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

// Max number of child accounts per tier
export const TIER_LIMITS = {
  'com.chorely.starter':   1,        // 1 basic account, no family accounts
  'com.chorely.family':    2,        // up to 2 children
  'com.chorely.unlimited': Infinity, // unlimited children
} as const;

// Max number of parent/adult accounts per tier
export const TIER_PARENT_LIMITS = {
  'com.chorely.starter':   1, // single account only
  'com.chorely.family':    2, // up to 2 parents
  'com.chorely.unlimited': 4, // up to 4 adults
} as const;

export const TIER_PRICES = {
  'com.chorely.starter':   '$2.99/wk',
  'com.chorely.family':    '$4.99/wk',
  'com.chorely.unlimited': '$100',
} as const;

// Starter + Family are auto-renewing subscriptions; Unlimited is a one-time purchase
export const TIER_IS_SUBSCRIPTION = {
  'com.chorely.starter':   true,
  'com.chorely.family':    true,
  'com.chorely.unlimited': false,
} as const;
