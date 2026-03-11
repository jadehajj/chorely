import { useState } from 'react';
import {
  View,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  Share,
  Switch,
} from 'react-native';
import { router } from 'expo-router';
import { signOut } from 'firebase/auth';
import { updateDoc, doc } from 'firebase/firestore';
import { auth, db } from '@/services/firebase';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useFamilyStore } from '@/stores/familyStore';
import { useAuthStore } from '@/stores/authStore';
import { generateJoinCode, generateKidDeviceCode } from '@/services/firestore';

const CURRENCIES = ['AUD', 'USD', 'GBP', 'EUR'] as const;
type Currency = (typeof CURRENCIES)[number];

const TIER_NAMES: Record<string, string> = {
  'com.chorely.starter':        'Starter (Weekly)',
  'com.chorely.starter.annual': 'Starter (Annual)',
  'com.chorely.family':         'Family (Weekly)',
  'com.chorely.family.annual':  'Family (Annual)',
  'com.chorely.unlimited':      'Lifetime Unlimited',
};

export default function Settings() {
  const { family, children } = useFamilyStore();
  const { familyId } = useAuthStore();

  const [generatingJoinCode, setGeneratingJoinCode] = useState(false);
  const [updatingVerification, setUpdatingVerification] = useState(false);
  const [updatingCurrency, setUpdatingCurrency] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [kidCodeLoadingId, setKidCodeLoadingId] = useState<string | null>(null);

  // Family not yet set up — show informative screen instead of infinite spinner
  if (!family || !familyId) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-row px-5 py-5 items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-4 p-1">
            <Text className="text-primary text-base">← Back</Text>
          </TouchableOpacity>
          <Text variant="h2" className="text-gray-900">Settings</Text>
        </View>
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-5xl mb-4">⚙️</Text>
          <Text variant="h3" className="text-center text-gray-900 mb-2">Family Not Set Up</Text>
          <Text variant="caption" className="text-center text-gray-500">
            Complete your family setup to access settings.
          </Text>
          <TouchableOpacity
            onPress={() => router.replace('/(auth)/welcome')}
            className="mt-6 bg-primary rounded-2xl px-8 py-3"
          >
            <Text className="text-white font-semibold">Set Up Family</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Bug #15 fix: show the new join code in an Alert after generating
  async function handleGenerateJoinCode() {
    setGeneratingJoinCode(true);
    try {
      const newCode = await generateJoinCode(familyId!);
      Alert.alert(
        'New Code Generated',
        `Your new parent join code is:\n\n${newCode}\n\nShare this with parents who want to join your family. The old code is now invalid.`,
        [{ text: 'OK' }],
      );
    } catch (e: unknown) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Please try again.');
    } finally {
      setGeneratingJoinCode(false);
    }
  }

  async function handleShareJoinCode() {
    try {
      await Share.share({ message: `Join our family on Chorely! Code: ${family!.joinCode}` });
    } catch (e: unknown) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Please try again.');
    }
  }

  async function handleToggleVerification() {
    const newMode = family!.verificationMode === 'self' ? 'approval' : 'self';
    setUpdatingVerification(true);
    try {
      await updateDoc(doc(db, 'families', familyId!), { verificationMode: newMode });
    } catch (e: unknown) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Please try again.');
    } finally {
      setUpdatingVerification(false);
    }
  }

  // Bug #14 fix: confirm before changing currency (balances don't change, only symbol)
  async function handleCurrencyChange(newCurrency: Currency) {
    if (newCurrency === family!.currency) return;
    Alert.alert(
      `Switch to ${newCurrency}?`,
      `Existing balances will stay the same — only the currency symbol will change.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Switch',
          onPress: async () => {
            setUpdatingCurrency(true);
            try {
              await updateDoc(doc(db, 'families', familyId!), { currency: newCurrency });
            } catch (e: unknown) {
              Alert.alert('Error', e instanceof Error ? e.message : 'Please try again.');
            } finally {
              setUpdatingCurrency(false);
            }
          },
        },
      ],
    );
  }

  async function handleGetKidCode(childId: string, childName: string) {
    setKidCodeLoadingId(childId);
    try {
      const code = await generateKidDeviceCode(familyId!, childId);
      Alert.alert(
        `Code for ${childName}`,
        `Device code: ${code}\n\nThis code expires in 10 minutes. Enter it on ${childName}'s device to link it.`,
        [{ text: 'OK' }],
      );
    } catch (e: unknown) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Please try again.');
    } finally {
      setKidCodeLoadingId(null);
    }
  }

  async function handleSignOut() {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          setSigningOut(true);
          try {
            await signOut(auth);
            router.replace('/(auth)/sign-in');
          } catch (e: unknown) {
            Alert.alert('Error', e instanceof Error ? e.message : 'Please try again.');
            setSigningOut(false);
          }
        },
      },
    ]);
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View className="flex-row items-center py-5">
          <TouchableOpacity onPress={() => router.back()} className="mr-4 p-1">
            <Text className="text-primary">← Back</Text>
          </TouchableOpacity>
          <Text variant="h2" className="text-gray-900">Settings</Text>
        </View>

        {/* Family section */}
        <Text variant="h3" className="mb-3 text-gray-900">Family</Text>
        <Card className="mb-4">
          <Text variant="label" className="mb-1">Family Name</Text>
          <Text variant="body" className="mb-4 text-gray-900">{family.name}</Text>

          <Text variant="label" className="mb-2">Parent Join Code</Text>
          <View className="bg-gray-100 rounded-2xl px-4 py-3 mb-3 items-center">
            <Text className="text-2xl font-bold tracking-widest text-gray-900">
              {family.joinCode}
            </Text>
          </View>
          <View className="flex-row gap-x-2">
            <Button
              title="Share Code"
              variant="secondary"
              onPress={handleShareJoinCode}
              className="flex-1 h-11"
            />
            <Button
              title="New Code"
              variant="secondary"
              loading={generatingJoinCode}
              onPress={handleGenerateJoinCode}
              className="flex-1 h-11"
            />
          </View>
        </Card>

        {/* Verification mode */}
        <Card className="mb-4">
          <View className="flex-row items-center justify-between">
            <View className="flex-1 mr-4">
              <Text variant="label" className="mb-1">Chore Verification</Text>
              <Text variant="caption">
                {family.verificationMode === 'approval'
                  ? 'Approval — you review each completion'
                  : 'Self — kids mark chores done instantly'}
              </Text>
            </View>
            <Switch
              value={family.verificationMode === 'approval'}
              onValueChange={handleToggleVerification}
              disabled={updatingVerification}
              trackColor={{ false: '#d1d5db', true: '#FF6B6B' }}
              thumbColor="#ffffff"
            />
          </View>
          <View className="flex-row justify-between mt-3">
            <Text variant="caption" className={family.verificationMode === 'self' ? 'text-primary font-semibold' : ''}>
              Self
            </Text>
            <Text variant="caption" className={family.verificationMode === 'approval' ? 'text-primary font-semibold' : ''}>
              Approval
            </Text>
          </View>
        </Card>

        {/* Currency section */}
        <Text variant="h3" className="mb-3 text-gray-900">Currency</Text>
        <Card className="mb-4">
          <View className="flex-row flex-wrap gap-2">
            {CURRENCIES.map((currency) => (
              <TouchableOpacity
                key={currency}
                onPress={() => handleCurrencyChange(currency)}
                disabled={updatingCurrency}
                className={[
                  'px-5 py-2 rounded-full border',
                  family.currency === currency
                    ? 'bg-primary border-primary'
                    : 'bg-white border-gray-300',
                  updatingCurrency ? 'opacity-50' : '',
                ].join(' ')}
              >
                <Text
                  className={family.currency === currency ? 'text-white font-semibold' : 'text-gray-700'}
                >
                  {currency}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {/* Subscription section */}
        <Text variant="h3" className="mb-3 text-gray-900">Subscription</Text>
        <Card className="mb-6">
          <View className="flex-row items-center justify-between">
            <View>
              <Text variant="label" className="mb-1">Current Plan</Text>
              <Text variant="body" className="text-gray-900">
                {TIER_NAMES[family.tierProductId] ?? 'Free'}
              </Text>
            </View>
            {family.tierProductId !== 'com.chorely.unlimited' && (
              <TouchableOpacity
                onPress={() => router.push('/(auth)/paywall')}
                className="bg-primary rounded-2xl px-5 py-2"
              >
                <Text className="text-white font-semibold text-sm">Upgrade</Text>
              </TouchableOpacity>
            )}
          </View>
        </Card>

        {/* Children section */}
        {/* Bug #4 fix: always show header + Add Child button, even when children.length === 0 */}
        {/* Bug #11 fix: each child row has an Edit button → /(parent)/child-editor?childId=... */}
        <View className="flex-row items-center justify-between mb-3">
          <Text variant="h3" className="text-gray-900">Children</Text>
          <TouchableOpacity onPress={() => router.push('/(parent)/child-editor')}>
            <Text className="text-primary text-sm font-semibold">+ Add Child</Text>
          </TouchableOpacity>
        </View>
        {children.length > 0 && (
          <Card className="mb-4">
            {children.map((child, index) => (
              <View
                key={child.id}
                className={[
                  'flex-row items-center py-3',
                  index < children.length - 1 ? 'border-b border-gray-100' : '',
                ].join(' ')}
              >
                <View className="flex-row items-center flex-1">
                  <View
                    className="w-10 h-10 rounded-full items-center justify-center mr-3"
                    style={{ backgroundColor: child.colorTheme + '30' }}
                  >
                    <Text className="text-xl">{child.avatarEmoji}</Text>
                  </View>
                  <View>
                    <Text variant="label" className="text-gray-900">{child.name}</Text>
                    {child.birthYear && (
                      <Text variant="caption">Born {child.birthYear}</Text>
                    )}
                  </View>
                </View>
                {/* Bug #11 fix: Edit button */}
                <TouchableOpacity
                  onPress={() => router.push({ pathname: '/(parent)/child-editor', params: { childId: child.id } })}
                  className="px-3 py-2 mr-2"
                >
                  <Text variant="caption" className="text-primary">Edit</Text>
                </TouchableOpacity>
                <Button
                  title="Device Code"
                  variant="secondary"
                  loading={kidCodeLoadingId === child.id}
                  onPress={() => handleGetKidCode(child.id, child.name)}
                  className="h-10 px-3"
                />
              </View>
            ))}
          </Card>
        )}

        {/* Sign out */}
        <Button
          title="Sign Out"
          variant="danger"
          loading={signingOut}
          onPress={handleSignOut}
          className="mb-8"
        />

      </ScrollView>
    </SafeAreaView>
  );
}
