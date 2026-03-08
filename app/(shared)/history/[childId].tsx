import { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SectionList,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useFamilyStore } from '@/stores/familyStore';
import { db } from '@/services/firebase';
import { formatBalance, formatReward } from '@/utils/formatReward';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Transaction {
  id: string;
  childId: string;
  choreId: string | null;
  completionId: string | null;
  type: 'earned' | 'manual' | 'deducted';
  amount: number;
  description: string;
  createdAt: Date;
}

interface Section {
  title: string;
  data: Transaction[];
}

// ---------------------------------------------------------------------------
// Date helpers
// ---------------------------------------------------------------------------

function dayLabel(date: Date): string {
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  if (isSameDay(date, today)) return 'Today';
  if (isSameDay(date, yesterday)) return 'Yesterday';

  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

function dayKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function groupByDay(transactions: Transaction[]): Section[] {
  const map = new Map<string, { label: string; items: Transaction[] }>();

  for (const tx of transactions) {
    const key = dayKey(tx.createdAt);
    if (!map.has(key)) {
      map.set(key, { label: dayLabel(tx.createdAt), items: [] });
    }
    map.get(key)!.items.push(tx);
  }

  const sections: Section[] = [];
  for (const { label, items } of map.values()) {
    sections.push({ title: label, data: items });
  }
  return sections;
}

// ---------------------------------------------------------------------------
// Icon helper
// ---------------------------------------------------------------------------

function txIcon(tx: Transaction): string {
  if (tx.type === 'earned') return '💰';
  if (tx.type === 'deducted') return '➖';
  return tx.amount >= 0 ? '➕' : '➖';
}

// ---------------------------------------------------------------------------
// CSV helper
// ---------------------------------------------------------------------------

function buildCsv(transactions: Transaction[]): string {
  const header = 'Date,Description,Type,Amount\n';
  const rows = transactions
    .map((tx) => {
      const date = tx.createdAt.toISOString();
      const desc = `"${tx.description.replace(/"/g, '""')}"`;
      return `${date},${desc},${tx.type},${tx.amount}`;
    })
    .join('\n');
  return header + rows;
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function ChildHistory() {
  const { childId } = useLocalSearchParams<{ childId: string }>();
  const { family, children } = useFamilyStore();

  const child = children.find((c) => c.id === childId);

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  // Fetch transactions on mount
  useEffect(() => {
    if (!family || !childId) {
      setLoading(false);
      return;
    }
    const isValidChild = children.some((c) => c.id === childId);
    if (!isValidChild) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const snap = await getDocs(
          query(
            collection(db, 'families', family.id, 'transactions'),
            where('childId', '==', childId),
            orderBy('createdAt', 'desc'),
          ),
        );

        if (cancelled) return;

        const txs: Transaction[] = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            childId: data.childId as string,
            choreId: (data.choreId as string | null) ?? null,
            completionId: (data.completionId as string | null) ?? null,
            type: data.type as 'earned' | 'manual' | 'deducted',
            amount: data.amount as number,
            description: data.description as string,
            createdAt: (data.createdAt as { toDate: () => Date }).toDate(),
          };
        });

        setTransactions(txs);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Please try again.';
        Alert.alert('Failed to load history', msg);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [family, childId, children]);

  // Guard — child or family not found
  if (!child || !family) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center">
        <Text variant="caption">Child not found.</Text>
      </SafeAreaView>
    );
  }

  // CSV export
  async function handleExport() {
    if (transactions.length === 0) {
      Alert.alert('Nothing to export', 'There are no transactions to export.');
      return;
    }

    setExporting(true);
    try {
      const csv = buildCsv(transactions);
      const path = FileSystem.cacheDirectory + 'transactions.csv';
      await FileSystem.writeAsStringAsync(path, csv);
      await Sharing.shareAsync(path, {
        mimeType: 'text/csv',
        dialogTitle: `${child!.name}'s Transaction History`,
        UTI: 'public.comma-separated-values-text',
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Please try again.';
      Alert.alert('Export failed', msg);
    } finally {
      setExporting(false);
    }
  }

  const sections = groupByDay(transactions);

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="flex-row items-center px-5 py-4">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <Text className="text-primary text-base">← Back</Text>
        </TouchableOpacity>
        <View className="flex-1">
          <Text variant="h2">{child.name}'s History</Text>
        </View>
      </View>

      {/* Balance summary */}
      <Card className="mx-5 mb-4 items-center py-5">
        <Text variant="caption" className="mb-1">Current Balance</Text>
        <Text className="text-4xl font-bold text-primary">
          {formatBalance(child, child.balance, family.currency)}
        </Text>
      </Card>

      {/* Export button */}
      <View className="px-5 mb-4">
        <Button
          title="Export CSV"
          variant="secondary"
          onPress={handleExport}
          loading={exporting}
        />
      </View>

      {/* Transaction list */}
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#FF6B6B" />
        </View>
      ) : transactions.length === 0 ? (
        <View className="flex-1 items-center justify-center px-5">
          <Text className="text-6xl mb-4">🪙</Text>
          <Text variant="h3" className="mb-2 text-center">No transactions yet</Text>
          <Text variant="caption" className="text-center">
            Completed chores and balance adjustments will appear here.
          </Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}
          renderSectionHeader={({ section }) => (
            <Text variant="label" className="mt-4 mb-2 text-gray-500">
              {section.title}
            </Text>
          )}
          renderItem={({ item: tx }) => {
            const isPositive = tx.amount >= 0;
            const formattedAmount = formatReward(child, Math.abs(tx.amount), family.currency);
            const timeStr = tx.createdAt.toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
            });

            return (
              <Card className="mb-2 flex-row items-center">
                {/* Icon */}
                <View className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center mr-3">
                  <Text className="text-xl">{txIcon(tx)}</Text>
                </View>

                {/* Description + time */}
                <View className="flex-1">
                  <Text variant="label" numberOfLines={1}>{tx.description}</Text>
                  <Text variant="caption">{timeStr}</Text>
                </View>

                {/* Amount */}
                <Text
                  className={`text-base font-semibold ${isPositive ? 'text-green-600' : 'text-red-500'}`}
                >
                  {isPositive ? '+' : '-'}{formattedAmount}
                </Text>
              </Card>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}
