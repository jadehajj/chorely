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
  'com.chorely.starter':   1,        // 1 child account
  'com.chorely.family':    2,        // up to 2 children
  'com.chorely.unlimited': Infinity, // unlimited children
} as const;

// Max number of parent/adult accounts per tier
export const TIER_PARENT_LIMITS = {
  'com.chorely.starter':   1, // single parent only
  'com.chorely.family':    2, // up to 2 parents
  'com.chorely.unlimited': 4, // up to 4 adults
} as const;

// Hardcoded fallback prices shown when App Store fetch fails (e.g. Simulator)
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

// Annual subscription product IDs (Starter and Family only — Lifetime has no annual variant)
// These must be created in App Store Connect before they can be purchased.
export const ANNUAL_PRODUCT_IDS = [
  'com.chorely.starter.annual',
  'com.chorely.family.annual',
] as const;

// Hardcoded fallback prices for annual plans (shown when App Store fetch fails)
export const TIER_PRICES_ANNUAL = {
  'com.chorely.starter.annual': '$79.99/yr',  // ≈$1.54/wk vs $2.99/wk — 48% off
  'com.chorely.family.annual':  '$129.99/yr', // ≈$2.50/wk vs $4.99/wk — 50% off
} as const;

// Maps annual product ID → base tier product ID (for child/parent limit lookups)
export const ANNUAL_TO_BASE_TIER: Record<string, string> = {
  'com.chorely.starter.annual': 'com.chorely.starter',
  'com.chorely.family.annual':  'com.chorely.family',
};
