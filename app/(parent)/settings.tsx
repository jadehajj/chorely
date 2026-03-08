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

export default function Settings() {
  const { family, children } = useFamilyStore();
  const { familyId } = useAuthStore();

  const [generatingJoinCode, setGeneratingJoinCode] = useState(false);
  const [updatingVerification, setUpdatingVerification] = useState(false);
  const [updatingCurrency, setUpdatingCurrency] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [kidCodeLoadingId, setKidCodeLoadingId] = useState<string | null>(null);

  if (!family || !familyId) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center">
        <Text variant="caption">Loading settings…</Text>
      </SafeAreaView>
    );
  }

  async function handleGenerateJoinCode() {
    setGeneratingJoinCode(true);
    try {
      await generateJoinCode(familyId!);
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

  async function handleCurrencyChange(newCurrency: Currency) {
    if (newCurrency === family!.currency) return;
    setUpdatingCurrency(true);
    try {
      await updateDoc(doc(db, 'families', familyId!), { currency: newCurrency });
    } catch (e: unknown) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Please try again.');
    } finally {
      setUpdatingCurrency(false);
    }
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
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <Text className="text-primary">← Back</Text>
          </TouchableOpacity>
          <Text variant="h2">Settings</Text>
        </View>

        {/* Family section */}
        <Text variant="h3" className="mb-3">Family</Text>
        <Card className="mb-4">
          <Text variant="label" className="mb-1">Family Name</Text>
          <Text variant="body" className="mb-4">{family.name}</Text>

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
        <Text variant="h3" className="mb-3">Currency</Text>
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

        {/* Children section */}
        {children.length > 0 && (
          <>
            <Text variant="h3" className="mb-3">Children</Text>
            <Card className="mb-4">
              {children.map((child, index) => (
                <View
                  key={child.id}
                  className={[
                    'flex-row items-center justify-between py-3',
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
                    <Text variant="label">{child.name}</Text>
                  </View>
                  <Button
                    title="Get Device Code"
                    variant="secondary"
                    loading={kidCodeLoadingId === child.id}
                    onPress={() => handleGetKidCode(child.id, child.name)}
                    className="h-10 px-3"
                  />
                </View>
              ))}
            </Card>
          </>
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
