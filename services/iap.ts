import {
  initConnection,
  getProducts,
  requestPurchase,
  finishTransaction,
  getAvailablePurchases,
  Purchase,
  Product,
} from 'react-native-iap';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/services/firebase';
import { TIER_LIMITS } from '@/constants/theme';

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
  await initConnection();
}

export async function fetchProducts(): Promise<Product[]> {
  return getProducts({ skus: PRODUCT_IDS });
}

export async function purchaseTier(productId: string): Promise<Purchase> {
  const purchase = await requestPurchase({ sku: productId });
  await finishTransaction({ purchase: purchase as Purchase, isConsumable: false });
  return purchase as Purchase;
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
