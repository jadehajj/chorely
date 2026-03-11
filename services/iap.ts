import {
  initConnection,
  fetchProducts as iapFetchProducts,
  requestPurchase,
  finishTransaction,
  getAvailablePurchases,
  Purchase,
  Product,
} from 'react-native-iap';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/services/firebase';
import {
  TIER_LIMITS,
  TIER_IS_SUBSCRIPTION,
  ANNUAL_PRODUCT_IDS,
  ANNUAL_TO_BASE_TIER,
} from '@/constants/theme';

export const PRODUCT_IDS = [
  'com.chorely.starter',
  'com.chorely.family',
  'com.chorely.unlimited',
];

// Re-export for consumers that need to reference annual product IDs
export { ANNUAL_PRODUCT_IDS };

// Full set: weekly/one-time + annual variants
const ALL_PRODUCT_IDS = [...PRODUCT_IDS, ...ANNUAL_PRODUCT_IDS];

export function getChildLimit(productId: string | null): number {
  if (!productId) return 0;
  // Map annual product IDs to their base tier for limit lookups
  const baseId = ANNUAL_TO_BASE_TIER[productId] ?? productId;
  return TIER_LIMITS[baseId as keyof typeof TIER_LIMITS] ?? 0;
}

export async function initIAP(): Promise<void> {
  try {
    await initConnection();
  } catch {
    // StoreKit unavailable in Simulator — silently skip
  }
}

export async function fetchProducts(): Promise<Product[]> {
  // 'all' fetches both subscription products (Starter, Family) and
  // one-time in-app purchases (Unlimited Lifetime) in a single call.
  return ((await iapFetchProducts({ skus: ALL_PRODUCT_IDS, type: 'all' })) ?? []) as Product[];
}

export async function purchaseTier(productId: string): Promise<Purchase | null> {
  // Starter and Family (weekly + annual) are auto-renewing subscriptions; Unlimited is one-time.
  const isSub =
    TIER_IS_SUBSCRIPTION[productId as keyof typeof TIER_IS_SUBSCRIPTION] ??
    (ANNUAL_PRODUCT_IDS as readonly string[]).includes(productId) ??
    false;
  const result = await requestPurchase({
    type: isSub ? 'subs' : 'in-app',
    request: {
      apple: { sku: productId },
      google: { skus: [productId] },
    },
  });
  const purchase = Array.isArray(result) ? result[0] ?? null : result ?? null;
  if (purchase) {
    await finishTransaction({ purchase, isConsumable: false });
  }
  return purchase;
}

export async function restorePurchases(familyId: string): Promise<string | null> {
  const purchases = await getAvailablePurchases();
  // Priority order: highest tier first; within a tier, annual preferred over weekly
  const tierOrder = [
    'com.chorely.unlimited',
    'com.chorely.family.annual',
    'com.chorely.family',
    'com.chorely.starter.annual',
    'com.chorely.starter',
  ];
  let restoredProductId: string | null = null;
  for (const id of tierOrder) {
    if (purchases.some((p) => p.productId === id)) {
      restoredProductId = id;
      break;
    }
  }
  if (restoredProductId && familyId) {
    await updateDoc(doc(db, 'families', familyId), { tierProductId: restoredProductId });
  }
  return restoredProductId;
}

export async function savePurchaseToFirestore(
  familyId: string,
  productId: string,
): Promise<void> {
  await updateDoc(doc(db, 'families', familyId), { tierProductId: productId });
}
