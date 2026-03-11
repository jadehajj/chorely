import { useMemo } from 'react';
import { View, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Text } from '@/components/ui/Text';
import { ChildCard } from '@/components/parent/ChildCard';
import { useFamilyStore } from '@/stores/familyStore';
import { useCompletionsStore } from '@/stores/completionsStore';
import { useChoresStore } from '@/stores/choresStore';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function isToday(date: Date): boolean {
  const today = new Date();
  return date.toDateString() === today.toDateString();
}

export default function Dashboard() {
  const { family, children } = useFamilyStore();
  const { completions } = useCompletionsStore();
  const { chores } = useChoresStore();

  const totalPending = completions.filter((c) => c.status === 'pending').length;

  // Bug #16 fix: dailyDone only counts completions for daily-schedule chores
  // Bug #9 fix: dailyTotal === 0 → show '—' in the stat tile (see StatTile usage below)
  const { dailyTotal, dailyDone } = useMemo(() => {
    const daily = chores.filter((c) => c.schedule === 'daily' && c.isActive);
    const dailyChoreIds = new Set(daily.map((c) => c.id));
    const done = completions.filter(
      (c) => isToday(c.submittedAt) && c.status !== 'rejected' && dailyChoreIds.has(c.choreId),
    );
    return { dailyTotal: daily.length, dailyDone: done.length };
  }, [chores, completions]);

  // Bug #17 fix: build list of names of children with pending completions
  const pendingChildNames = useMemo(() => {
    const ids = [...new Set(
      completions.filter((c) => c.status === 'pending').map((c) => c.childId),
    )];
    return ids
      .map((id) => children.find((ch) => ch.id === id)?.name)
      .filter((n): n is string => Boolean(n));
  }, [completions, children]);

  const dateStr = new Date().toLocaleDateString('en-AU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View className="flex-row justify-between items-start pt-5 pb-4">
          <View className="flex-1">
            <Text variant="caption" className="text-gray-400 mb-0.5">{dateStr}</Text>
            <Text style={{ fontSize: 26, fontWeight: '800', color: '#111827' }}>
              {getGreeting()} 👋
            </Text>
            <Text variant="caption" className="text-gray-500 mt-0.5">
              {family?.name ?? 'Your Family'}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/(parent)/settings')}
            className="w-11 h-11 bg-white rounded-full items-center justify-center shadow-sm border border-gray-100 mt-1"
          >
            <Text className="text-lg">⚙️</Text>
          </TouchableOpacity>
        </View>

        {/* Stats row */}
        {/* Bug #9 fix: pass '—' when dailyTotal === 0 so tile never shows "0/0" */}
        <View className="flex-row gap-x-3 mb-4">
          <StatTile emoji="👨‍👩‍👧" value={children.length} label="Kids" color="#7C6CF8" />
          <StatTile
            emoji="✅"
            value={dailyTotal === 0 ? '—' : `${dailyDone}/${dailyTotal}`}
            label="Done today"
            color="#4CAF50"
          />
          <StatTile emoji="⏳" value={totalPending} label="Pending" color="#FFD93D" />
        </View>

        {/* Pending approval banner */}
        {totalPending > 0 && (
          <TouchableOpacity
            onPress={() => router.push('/(shared)/approval-queue')}
            className="rounded-2xl p-4 mb-4 flex-row items-center justify-between"
            style={{ backgroundColor: '#FFF8E1', borderWidth: 1, borderColor: '#FFD93D' }}
          >
            <View className="flex-row items-center flex-1">
              <Text className="text-2xl mr-3">🔔</Text>
              <View>
                <Text style={{ fontWeight: '700', color: '#92400E', fontSize: 14 }}>
                  {totalPending} chore{totalPending !== 1 ? 's' : ''} need your approval
                </Text>
                {/* Bug #17 fix: show names of children with pending chores */}
                <Text style={{ color: '#B45309', fontSize: 12 }}>
                  {pendingChildNames.length > 0
                    ? (pendingChildNames.length > 2
                        ? `${pendingChildNames.slice(0, 2).join(', ')} + ${pendingChildNames.length - 2} more`
                        : pendingChildNames.join(', ')
                      ) + ' · tap to review'
                    : 'Tap to review'}
                </Text>
              </View>
            </View>
            <Text style={{ color: '#B45309', fontSize: 18 }}>→</Text>
          </TouchableOpacity>
        )}

        {/* Your Kids section */}
        <View className="flex-row items-center justify-between mb-3">
          <Text variant="h3" className="text-gray-900">Your Kids</Text>
          <TouchableOpacity onPress={() => router.push('/(shared)/chore-builder')}>
            <Text className="text-primary text-sm font-semibold">+ Add Chore</Text>
          </TouchableOpacity>
        </View>

        {/* Bug #24 fix: empty state with direct "Add Child" action button */}
        {children.length === 0 ? (
          <View className="bg-white rounded-3xl p-8 items-center mb-4 border border-gray-100">
            <Text style={{ fontSize: 48, lineHeight: 64 }} className="mb-3">👶</Text>
            <Text variant="h3" className="text-gray-900 text-center mb-1">No kids yet</Text>
            <Text variant="caption" className="text-center text-gray-500 mb-5">
              Add your first child to start assigning chores and tracking rewards.
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/(parent)/child-editor')}
              className="bg-primary rounded-2xl py-3 px-8"
            >
              <Text className="text-white font-bold text-base">+ Add Child</Text>
            </TouchableOpacity>
          </View>
        ) : (
          children.map((child) => (
            <ChildCard
              key={child.id}
              child={child}
              onPress={() => router.push(`/(parent)/child/${child.id}`)}
            />
          ))
        )}

        {/* Add Chore primary CTA */}
        <TouchableOpacity
          onPress={() => router.push('/(shared)/chore-builder')}
          className="bg-primary rounded-3xl p-4 mt-2 mb-10 flex-row items-center justify-center"
          style={{ gap: 8 }}
        >
          <Text style={{ color: 'white', fontSize: 22, lineHeight: 26 }}>+</Text>
          <Text style={{ color: 'white', fontWeight: '700', fontSize: 16 }}>Add New Chore</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Stat Tile ────────────────────────────────────────────────────────────────

interface StatTileProps {
  emoji: string;
  value: string | number;
  label: string;
  color: string;
}

function StatTile({ emoji, value, label, color }: StatTileProps) {
  return (
    <View className="flex-1 bg-white rounded-2xl p-4 items-center shadow-sm border border-gray-100">
      <View
        className="w-10 h-10 rounded-full items-center justify-center mb-2"
        style={{ backgroundColor: color + '22' }}
      >
        <Text className="text-xl">{emoji}</Text>
      </View>
      <Text style={{ fontSize: 22, fontWeight: '800', color: '#111827' }}>{value}</Text>
      <Text style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2, textAlign: 'center' }}>{label}</Text>
    </View>
  );
}
