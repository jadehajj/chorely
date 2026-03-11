import { useEffect, useState } from 'react';
import { View, ScrollView, SafeAreaView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import {
  collection, getDocs, query, where, orderBy, limit,
} from 'firebase/firestore';
import { db } from '@/services/firebase';
import { Text } from '@/components/ui/Text';
import { useAuthStore } from '@/stores/authStore';
import { useFamilyStore } from '@/stores/familyStore';
import { formatReward } from '@/utils/formatReward';

interface Transaction {
  id: string;
  childId: string;
  type: 'earned' | 'manual' | 'deducted';
  amount: number;
  description: string;
  createdAt: Date;
}

const TYPE_EMOJI: Record<Transaction['type'], string> = {
  earned:   '⭐',
  manual:   '✏️',
  deducted: '💸',
};

export default function KidHistory() {
  const { linkedChildId, familyId } = useAuthStore();
  const { family, children } = useFamilyStore();
  const child = children.find((c) => c.id === linkedChildId);

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!familyId || !linkedChildId) return;

    getDocs(
      query(
        collection(db, 'families', familyId, 'transactions'),
        where('childId', '==', linkedChildId),
        orderBy('createdAt', 'desc'),
        limit(50),
      ),
    )
      .then((snap) => {
        const rows = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
          createdAt: d.data().createdAt?.toDate() ?? new Date(),
        })) as Transaction[];
        setTransactions(rows);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [familyId, linkedChildId]);

  if (!child || !family) return null;

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View className="flex-row items-center py-5">
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <Text className="text-primary text-base">← Back</Text>
          </TouchableOpacity>
          <Text variant="h2">My History</Text>
        </View>

        {loading && (
          <ActivityIndicator size="large" color="#FF6B6B" className="mt-12" />
        )}

        {!loading && transactions.length === 0 && (
          <View className="items-center mt-16">
            <Text className="text-5xl mb-4">📋</Text>
            <Text variant="h3" className="text-center text-gray-700 mb-2">No transactions yet</Text>
            <Text variant="caption" className="text-center text-gray-500">
              Complete chores to start building your history!
            </Text>
          </View>
        )}

        {!loading && transactions.map((tx) => (
          <View
            key={tx.id}
            className="bg-white rounded-2xl px-4 py-4 mb-3 flex-row items-center shadow-sm border border-gray-100"
          >
            <Text className="text-2xl mr-4">{TYPE_EMOJI[tx.type]}</Text>
            <View className="flex-1">
              <Text variant="label" className="text-gray-900">{tx.description || '—'}</Text>
              <Text variant="caption">{formatDate(tx.createdAt)}</Text>
            </View>
            <Text
              className={[
                'font-bold text-base',
                tx.amount >= 0 ? 'text-green-600' : 'text-red-500',
              ].join(' ')}
            >
              {tx.amount >= 0 ? '+' : ''}
              {formatReward(child, Math.abs(tx.amount), family.currency)}
            </Text>
          </View>
        ))}

        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}

function formatDate(date: Date): string {
  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
  });
}
