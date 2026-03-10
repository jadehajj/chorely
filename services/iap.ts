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
import { TIER_LIMITS, TIER_IS_SUBSCRIPTION } from '@/constants/theme';

export const PRODUCT_IDS = [
  'com.chorely.starter',
  'com.chorely.family',
  'com.chorely.unlimited',
];

export function getChildLimit(productId: string | null): number {
  if (!productId) return 0;
  return TIER_LIMITS[productId as keyof typeof TIER_LIMITS] ?? 0;
}

export async function initIAP(): Promise<void> {
  try {
    await initConnection();
  } catch {
    // StoreKit unavailable in simulator — silently skip
  }
}

export async function fetchProducts(): Promise<Product[]> {
  // 'all' fetches both subscription products (Starter, Family) and
  // one-time in-app purchases (Unlimited Lifetime) in a single call.
  return ((await iapFetchProducts({ skus: PRODUCT_IDS, type: 'all' })) ?? []) as Product[];
}

export async function purchaseTier(productId: string): Promise<Purchase | null> {
  // Starter and Family are auto-renewing subscriptions; Unlimited is a one-time purchase.
  const isSub = TIER_IS_SUBSCRIPTION[productId as keyof typeof TIER_IS_SUBSCRIPTION] ?? false;
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
  const tierOrder = [...PRODUCT_IDS].reverse();
  let highestTier: string | null = null;
  for (const tier of tierOrder) {
    if (purchases.some((p) => p.productId === tier)) {
      highestTier = tier;
      break;
    }
  }
  if (highestTier && familyId) {
    await updateDoc(doc(db, 'families', familyId), { tierProductId: highestTier });
  }
  return highestTier;
}

export async function savePurchaseToFirestore(
  familyId: string,
  productId: string,
): Promise<void> {
  await updateDoc(doc(db, 'families', familyId), { tierProductId: productId });
}
