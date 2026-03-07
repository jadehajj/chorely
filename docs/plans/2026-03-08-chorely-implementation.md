# Chorely Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build Chorely, a fully functional React Native (Expo) iOS kids chore & pocket money tracker with Firebase sync, Sign in with Apple + Google, 3 IAP tiers, and real-time multi-device sync.

**Architecture:** Expo managed workflow with EAS Dev Client. Expo Router for file-based navigation. Firebase JS SDK v10 for Firestore sync + Auth. Zustand for in-memory state. expo-sqlite for offline-first caching. NativeWind for styling.

**Tech Stack:** React Native + Expo SDK 52, TypeScript, Expo Router v3, Firebase JS SDK v10, Zustand v5, NativeWind v4, react-native-iap v12, expo-notifications, expo-apple-authentication, @react-native-google-signin/google-signin, React Native Reanimated v3, lottie-react-native, expo-sqlite v14

---

## Prerequisites (complete before Task 1)

- [ ] Apple Developer account created
- [ ] Firebase project `chorely` created with Auth (Apple + Google enabled) + Firestore + Storage
- [ ] `GoogleService-Info.plist` downloaded from Firebase Console → Project Settings → iOS app
- [ ] Xcode installed on Mac
- [ ] Node.js 20+ installed
- [ ] Run: `npm install -g eas-cli expo-cli`
- [ ] Run: `npx expo login` (create free Expo account if needed)
- [ ] Run: `eas login`

---

## Task 1: Project Scaffold

**Files:**
- Create: `package.json` (via npx create-expo-app)
- Modify: `app.json`
- Create: `tsconfig.json`
- Create: `jest.config.js`
- Create: `babel.config.js`
- Create: `.env.example`

**Step 1: Scaffold the project**

```bash
cd "/Users/jahmm/Documents/Projects/App Tests/Chorely"
npx create-expo-app@latest . --template blank-typescript
```

**Step 2: Install all dependencies**

```bash
npx expo install expo-router expo-constants expo-linking expo-status-bar expo-splash-screen
npx expo install expo-apple-authentication expo-notifications expo-file-system expo-media-library expo-sqlite
npx expo install react-native-reanimated react-native-gesture-handler react-native-safe-area-context react-native-screens
npm install firebase @react-native-async-storage/async-storage react-native-get-random-values
npm install @react-native-google-signin/google-signin
npm install react-native-iap
npm install zustand
npm install lottie-react-native
npm install nativewind tailwindcss
npm install react-native-csv
npm install --save-dev @testing-library/react-native @testing-library/jest-native jest-expo
```

**Step 3: Replace `app.json` entirely**

```json
{
  "expo": {
    "name": "Chorely",
    "slug": "chorely",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "scheme": "chorely",
    "userInterfaceStyle": "automatic",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.chorely.app",
      "usesAppleSignIn": true,
      "infoPlist": {
        "UIBackgroundModes": ["remote-notification"]
      }
    },
    "plugins": [
      "expo-router",
      "expo-apple-authentication",
      [
        "expo-notifications",
        {
          "icon": "./assets/notification-icon.png",
          "color": "#ffffff"
        }
      ],
      "@react-native-google-signin/google-signin",
      [
        "react-native-iap",
        {
          "paymentProvider": "Apple"
        }
      ]
    ],
    "experiments": {
      "typedRoutes": true
    }
  }
}
```

**Step 4: Replace `babel.config.js`**

```js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
    ],
    plugins: ['react-native-reanimated/plugin'],
  };
};
```

**Step 5: Create `jest.config.js`**

```js
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterFramework: ['@testing-library/jest-native/extend-expect'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|react-navigation|@react-navigation/.*|nativewind|lottie-react-native)',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
};
```

**Step 6: Create `tsconfig.json`**

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

**Step 7: Create `.env.example`**

```
EXPO_PUBLIC_FIREBASE_API_KEY=
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=
EXPO_PUBLIC_FIREBASE_PROJECT_ID=
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
EXPO_PUBLIC_FIREBASE_APP_ID=
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=
```

**Step 8: Copy `.env.example` to `.env.local` and fill in values from Firebase Console → Project Settings → General → Your apps → Web app config**

**Step 9: Create folder structure**

```bash
mkdir -p app/\(auth\) app/\(parent\)/child app/\(kid\) app/\(shared\)/history
mkdir -p components/ui components/parent components/kid components/onboarding components/settings
mkdir -p stores services utils constants assets/animations
```

**Step 10: Create placeholder `app/index.tsx` (auth redirect)**

```tsx
import { Redirect } from 'expo-router';

export default function Index() {
  return <Redirect href="/(auth)/paywall" />;
}
```

**Step 11: Commit**

```bash
git init
git add .
git commit -m "feat: scaffold Chorely Expo project with all dependencies"
```

---

## Task 2: Firebase Initialization

**Files:**
- Create: `constants/firebaseConfig.ts`
- Create: `services/firebase.ts`
- Copy: `GoogleService-Info.plist` → project root (Expo picks it up automatically)

**Step 1: Write test**

```bash
# Create: __tests__/services/firebase.test.ts
```

```ts
import { getApp } from 'firebase/app';

describe('Firebase initialization', () => {
  it('initializes without throwing', () => {
    require('@/services/firebase');
    expect(() => getApp()).not.toThrow();
  });
});
```

**Step 2: Run test to confirm it fails**

```bash
npx jest __tests__/services/firebase.test.ts
```
Expected: FAIL — module not found

**Step 3: Create `constants/firebaseConfig.ts`**

```ts
export const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID!,
};
```

**Step 4: Create `services/firebase.ts`**

```ts
import { initializeApp, getApps } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { firebaseConfig } from '@/constants/firebaseConfig';

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
```

**Step 5: Copy `GoogleService-Info.plist` to project root**

```bash
# Copy the file you downloaded from Firebase Console to:
cp ~/Downloads/GoogleService-Info.plist "/Users/jahmm/Documents/Projects/App Tests/Chorely/GoogleService-Info.plist"
```

**Step 6: Run test — expect PASS**

```bash
npx jest __tests__/services/firebase.test.ts
```

**Step 7: Create Firestore security rules file `firestore.rules`**

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own user doc
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Parents can read/write their entire family
    match /families/{familyId} {
      allow read, write: if request.auth != null &&
        request.auth.uid in resource.data.parentIds;

      match /{subcollection}/{docId} {
        allow read, write: if request.auth != null &&
          get(/databases/$(database)/documents/families/$(familyId)).data.parentIds.hasAny([request.auth.uid]);
      }
    }

    // Kid devices: read own child doc, write completions only
    match /families/{familyId}/children/{childId} {
      allow read: if request.auth != null &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.linkedChildId == childId;
    }

    match /families/{familyId}/completions/{completionId} {
      allow create: if request.auth != null &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'kid';
    }
  }
}
```

**Step 8: Commit**

```bash
git add .
git commit -m "feat: initialize Firebase with Auth, Firestore, Storage"
```

---

## Task 3: Navigation Structure

**Files:**
- Create: `app/_layout.tsx`
- Create: `app/(auth)/_layout.tsx`
- Create: `app/(parent)/_layout.tsx`
- Create: `app/(kid)/_layout.tsx`
- Create: `app/(shared)/_layout.tsx`
- Create: `stores/authStore.ts` (skeleton)

**Step 1: Create `stores/authStore.ts` skeleton**

```ts
import { create } from 'zustand';

export type UserRole = 'parent' | 'kid' | null;

interface AuthState {
  uid: string | null;
  role: UserRole;
  familyId: string | null;
  linkedChildId: string | null;
  isLoading: boolean;
  setAuth: (uid: string, role: UserRole, familyId: string, linkedChildId?: string) => void;
  clearAuth: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  uid: null,
  role: null,
  familyId: null,
  linkedChildId: null,
  isLoading: true,
  setAuth: (uid, role, familyId, linkedChildId = null) =>
    set({ uid, role, familyId, linkedChildId, isLoading: false }),
  clearAuth: () =>
    set({ uid: null, role: null, familyId: null, linkedChildId: null, isLoading: false }),
  setLoading: (isLoading) => set({ isLoading }),
}));
```

**Step 2: Create `app/_layout.tsx`**

```tsx
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/services/firebase';
import { useAuthStore } from '@/stores/authStore';
import 'react-native-get-random-values';

export default function RootLayout() {
  const { setAuth, clearAuth, setLoading } = useAuthStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setAuth(user.uid, data.role, data.familyId, data.linkedChildId);
        } else {
          // New user — no user doc yet, route to paywall
          setLoading(false);
        }
      } else {
        clearAuth();
      }
    });
    return unsubscribe;
  }, []);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(parent)" />
      <Stack.Screen name="(kid)" />
      <Stack.Screen name="(shared)" />
    </Stack>
  );
}
```

**Step 3: Create `app/(auth)/_layout.tsx`**

```tsx
import { Stack } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { Redirect } from 'expo-router';

export default function AuthLayout() {
  const { uid, role } = useAuthStore();
  if (uid && role === 'parent') return <Redirect href="/(parent)/dashboard" />;
  if (uid && role === 'kid') return <Redirect href="/(kid)/view" />;
  return <Stack screenOptions={{ headerShown: false }} />;
}
```

**Step 4: Create `app/(parent)/_layout.tsx`**

```tsx
import { Stack } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { Redirect } from 'expo-router';

export default function ParentLayout() {
  const { uid, role } = useAuthStore();
  if (!uid) return <Redirect href="/(auth)/paywall" />;
  if (role === 'kid') return <Redirect href="/(kid)/view" />;
  return <Stack screenOptions={{ headerShown: false }} />;
}
```

**Step 5: Create `app/(kid)/_layout.tsx`**

```tsx
import { Stack } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { Redirect } from 'expo-router';

export default function KidLayout() {
  const { uid, role } = useAuthStore();
  if (!uid) return <Redirect href="/(auth)/paywall" />;
  if (role === 'parent') return <Redirect href="/(parent)/dashboard" />;
  return <Stack screenOptions={{ headerShown: false }} />;
}
```

**Step 6: Create `app/(shared)/_layout.tsx`**

```tsx
import { Stack } from 'expo-router';
export default function SharedLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
```

**Step 7: Create placeholder screens so router doesn't error**

```bash
# app/(auth)/paywall.tsx
echo 'import { View, Text } from "react-native"; export default function Paywall() { return <View><Text>Paywall</Text></View>; }' > app/\(auth\)/paywall.tsx

# app/(parent)/dashboard.tsx
echo 'import { View, Text } from "react-native"; export default function Dashboard() { return <View><Text>Dashboard</Text></View>; }' > app/\(parent\)/dashboard.tsx

# app/(kid)/view.tsx
echo 'import { View, Text } from "react-native"; export default function KidView() { return <View><Text>Kid View</Text></View>; }' > app/\(kid\)/view.tsx
```

**Step 8: Commit**

```bash
git add .
git commit -m "feat: set up Expo Router navigation with auth guard"
```

---

## Task 4: Theme & UI Components

**Files:**
- Create: `tailwind.config.js`
- Create: `global.css`
- Create: `constants/theme.ts`
- Create: `components/ui/Text.tsx`
- Create: `components/ui/Button.tsx`
- Create: `components/ui/Card.tsx`

**Step 1: Create `tailwind.config.js`**

```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: '#6366F1',
        'primary-dark': '#4F46E5',
        success: '#22C55E',
        warning: '#F59E0B',
        danger: '#EF4444',
        surface: '#F9FAFB',
        'surface-dark': '#1F2937',
      },
      fontFamily: {
        sans: ['System'],
      },
    },
  },
};
```

**Step 2: Create `global.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

**Step 3: Add global.css import to `app/_layout.tsx`**

Add this line at the top of `app/_layout.tsx`:
```ts
import '../global.css';
```

**Step 4: Create `constants/theme.ts`**

```ts
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

export const TIER_LIMITS = {
  'com.chorely.starter': 1,
  'com.chorely.family': 3,
  'com.chorely.unlimited': Infinity,
} as const;

export const TIER_PRICES = {
  'com.chorely.starter': '$4.99',
  'com.chorely.family': '$6.99',
  'com.chorely.unlimited': '$9.99',
} as const;
```

**Step 5: Create `components/ui/Text.tsx`**

```tsx
import { Text as RNText, TextProps } from 'react-native';
import { cn } from '@/utils/cn';

interface Props extends TextProps {
  variant?: 'h1' | 'h2' | 'h3' | 'body' | 'caption' | 'label';
  className?: string;
}

const variants = {
  h1: 'text-3xl font-bold text-gray-900 dark:text-white',
  h2: 'text-2xl font-bold text-gray-900 dark:text-white',
  h3: 'text-xl font-semibold text-gray-800 dark:text-gray-100',
  body: 'text-base text-gray-700 dark:text-gray-300',
  caption: 'text-sm text-gray-500 dark:text-gray-400',
  label: 'text-sm font-medium text-gray-700 dark:text-gray-300',
};

export function Text({ variant = 'body', className, ...props }: Props) {
  return <RNText className={cn(variants[variant], className)} {...props} />;
}
```

**Step 6: Create `utils/cn.ts`**

```ts
export function cn(...classes: (string | undefined | false | null)[]) {
  return classes.filter(Boolean).join(' ');
}
```

**Step 7: Create `components/ui/Button.tsx`**

```tsx
import { TouchableOpacity, ActivityIndicator, Text, TouchableOpacityProps } from 'react-native';
import { cn } from '@/utils/cn';

interface Props extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  loading?: boolean;
  className?: string;
}

const variants = {
  primary: 'bg-primary active:bg-primary-dark',
  secondary: 'bg-white border border-gray-300 active:bg-gray-50',
  danger: 'bg-red-500 active:bg-red-600',
  ghost: 'bg-transparent',
};

const textVariants = {
  primary: 'text-white font-semibold text-base',
  secondary: 'text-gray-800 font-semibold text-base',
  danger: 'text-white font-semibold text-base',
  ghost: 'text-primary font-semibold text-base',
};

export function Button({ title, variant = 'primary', loading, className, disabled, ...props }: Props) {
  return (
    <TouchableOpacity
      className={cn(
        'h-14 rounded-2xl items-center justify-center px-6',
        variants[variant],
        (disabled || loading) && 'opacity-50',
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? 'white' : '#6366F1'} />
      ) : (
        <Text className={textVariants[variant]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}
```

**Step 8: Create `components/ui/Card.tsx`**

```tsx
import { View, ViewProps } from 'react-native';
import { cn } from '@/utils/cn';

interface Props extends ViewProps {
  className?: string;
}

export function Card({ className, ...props }: Props) {
  return (
    <View
      className={cn('bg-white dark:bg-gray-800 rounded-3xl p-4 shadow-sm', className)}
      {...props}
    />
  );
}
```

**Step 9: Commit**

```bash
git add .
git commit -m "feat: add theme, NativeWind config, and base UI components"
```

---

## Task 5: Zustand Stores

**Files:**
- Create: `stores/familyStore.ts`
- Create: `stores/choresStore.ts`
- Create: `stores/completionsStore.ts`
- Create: `utils/formatReward.ts`
- Create: `__tests__/utils/formatReward.test.ts`

**Step 1: Write tests for `formatReward`**

```ts
// __tests__/utils/formatReward.test.ts
import { formatReward, formatBalance } from '@/utils/formatReward';

const moneyChild = { rewardMode: 'money' as const, rewardEmoji: '' };
const emojiChild = { rewardMode: 'emoji' as const, rewardEmoji: '⭐' };

describe('formatReward', () => {
  it('formats money amount with currency symbol', () => {
    expect(formatReward(moneyChild, 12.5, 'AUD')).toBe('$12.50');
  });
  it('formats emoji amount with emoji unit', () => {
    expect(formatReward(emojiChild, 23, 'AUD')).toBe('23 ⭐');
  });
  it('formats zero money', () => {
    expect(formatReward(moneyChild, 0, 'AUD')).toBe('$0.00');
  });
  it('formats zero emoji', () => {
    expect(formatReward(emojiChild, 0, 'AUD')).toBe('0 ⭐');
  });
});

describe('formatBalance', () => {
  it('formats large money balance', () => {
    expect(formatBalance(moneyChild, 1234.5, 'AUD')).toBe('$1,234.50');
  });
});
```

**Step 2: Run test — expect FAIL**

```bash
npx jest __tests__/utils/formatReward.test.ts
```

**Step 3: Create `utils/formatReward.ts`**

```ts
export interface RewardChild {
  rewardMode: 'money' | 'emoji';
  rewardEmoji: string;
}

export function formatReward(child: RewardChild, amount: number, currency: string): string {
  if (child.rewardMode === 'emoji') {
    return `${Math.floor(amount)} ${child.rewardEmoji}`;
  }
  return formatMoney(amount, currency);
}

export function formatBalance(child: RewardChild, amount: number, currency: string): string {
  if (child.rewardMode === 'emoji') {
    return `${Math.floor(amount)} ${child.rewardEmoji}`;
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatMoney(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}
```

**Step 4: Run test — expect PASS**

```bash
npx jest __tests__/utils/formatReward.test.ts
```

**Step 5: Create `stores/familyStore.ts`**

```ts
import { create } from 'zustand';

export interface Child {
  id: string;
  name: string;
  avatarEmoji: string;
  colorTheme: string;
  rewardMode: 'money' | 'emoji';
  rewardEmoji: string;
  balance: number;
  linkedDeviceId: string | null;
}

export interface Family {
  id: string;
  name: string;
  joinCode: string;
  verificationMode: 'self' | 'approval';
  currency: string;
  tierProductId: string;
  parentIds: string[];
}

interface FamilyState {
  family: Family | null;
  children: Child[];
  setFamily: (family: Family) => void;
  setChildren: (children: Child[]) => void;
  updateChild: (id: string, updates: Partial<Child>) => void;
  addChild: (child: Child) => void;
}

export const useFamilyStore = create<FamilyState>((set) => ({
  family: null,
  children: [],
  setFamily: (family) => set({ family }),
  setChildren: (children) => set({ children }),
  updateChild: (id, updates) =>
    set((state) => ({
      children: state.children.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    })),
  addChild: (child) => set((state) => ({ children: [...state.children, child] })),
}));
```

**Step 6: Create `stores/choresStore.ts`**

```ts
import { create } from 'zustand';

export interface Chore {
  id: string;
  name: string;
  iconEmoji: string;
  schedule: 'daily' | 'weekly' | 'once' | string[];
  value: number;
  assignedChildId: string;
  requiresApproval: boolean;
  isActive: boolean;
}

interface ChoresState {
  chores: Chore[];
  setChores: (chores: Chore[]) => void;
  addChore: (chore: Chore) => void;
  updateChore: (id: string, updates: Partial<Chore>) => void;
  removeChore: (id: string) => void;
}

export const useChoresStore = create<ChoresState>((set) => ({
  chores: [],
  setChores: (chores) => set({ chores }),
  addChore: (chore) => set((state) => ({ chores: [...state.chores, chore] })),
  updateChore: (id, updates) =>
    set((state) => ({
      chores: state.chores.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    })),
  removeChore: (id) =>
    set((state) => ({ chores: state.chores.filter((c) => c.id !== id) })),
}));
```

**Step 7: Create `stores/completionsStore.ts`**

```ts
import { create } from 'zustand';

export interface Completion {
  id: string;
  choreId: string;
  childId: string;
  status: 'pending' | 'approved' | 'rejected';
  photoUrl: string | null;
  submittedAt: Date;
  reviewedAt: Date | null;
  rejectionReason: string | null;
}

interface CompletionsState {
  completions: Completion[];
  setCompletions: (completions: Completion[]) => void;
  addCompletion: (completion: Completion) => void;
  updateCompletion: (id: string, updates: Partial<Completion>) => void;
}

export const useCompletionsStore = create<CompletionsState>((set) => ({
  completions: [],
  setCompletions: (completions) => set({ completions }),
  addCompletion: (completion) =>
    set((state) => ({ completions: [...state.completions, completion] })),
  updateCompletion: (id, updates) =>
    set((state) => ({
      completions: state.completions.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    })),
}));
```

**Step 8: Commit**

```bash
git add .
git commit -m "feat: add Zustand stores and formatReward utility"
```

---

## Task 6: Firebase Auth Service

**Files:**
- Create: `services/auth.ts`
- Create: `__tests__/services/auth.test.ts`
- Create: `__mocks__/firebase/auth.ts`

**Step 1: Create Firebase auth mock `__mocks__/@firebase/auth.ts`**

```ts
export const signInWithCredential = jest.fn();
export const signOut = jest.fn();
export const OAuthProvider = jest.fn().mockImplementation(() => ({
  credential: jest.fn(),
}));
export const GoogleAuthProvider = {
  credential: jest.fn(),
};
```

**Step 2: Write tests**

```ts
// __tests__/services/auth.test.ts
jest.mock('firebase/auth', () => require('../__mocks__/@firebase/auth'));
jest.mock('firebase/firestore');
jest.mock('@/services/firebase', () => ({ auth: {}, db: {} }));

import { signOut } from 'firebase/auth';
import { signOutUser } from '@/services/auth';

describe('auth service', () => {
  it('calls Firebase signOut on signOutUser', async () => {
    (signOut as jest.Mock).mockResolvedValue(undefined);
    await signOutUser();
    expect(signOut).toHaveBeenCalled();
  });
});
```

**Step 3: Run test — expect FAIL**

```bash
npx jest __tests__/services/auth.test.ts
```

**Step 4: Create `services/auth.ts`**

```ts
import {
  signInWithCredential,
  signOut,
  OAuthProvider,
  GoogleAuthProvider,
  UserCredential,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import * as AppleAuthentication from 'expo-apple-authentication';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { auth, db } from '@/services/firebase';

GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
});

export async function signInWithApple(): Promise<UserCredential> {
  const appleCredential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
  });

  const provider = new OAuthProvider('apple.com');
  const credential = provider.credential({
    idToken: appleCredential.identityToken!,
    rawNonce: appleCredential.authorizationCode!,
  });

  const result = await signInWithCredential(auth, credential);
  await ensureUserDoc(result.user.uid, 'parent');
  return result;
}

export async function signInWithGoogle(): Promise<UserCredential> {
  await GoogleSignin.hasPlayServices();
  const { idToken } = await GoogleSignin.signIn();
  const credential = GoogleAuthProvider.credential(idToken);
  const result = await signInWithCredential(auth, credential);
  await ensureUserDoc(result.user.uid, 'parent');
  return result;
}

export async function signOutUser(): Promise<void> {
  await signOut(auth);
}

async function ensureUserDoc(uid: string, role: 'parent' | 'kid'): Promise<void> {
  const ref = doc(db, 'users', uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, { role, familyId: null, linkedChildId: null, createdAt: serverTimestamp() });
  }
}

export async function linkKidDevice(
  uid: string,
  familyId: string,
  childId: string,
): Promise<void> {
  await setDoc(doc(db, 'users', uid), {
    role: 'kid',
    familyId,
    linkedChildId: childId,
  });
}
```

**Step 5: Run test — expect PASS**

```bash
npx jest __tests__/services/auth.test.ts
```

**Step 6: Commit**

```bash
git add .
git commit -m "feat: add Firebase auth service (Apple + Google sign-in)"
```

---

## Task 7: IAP Service & Tier Constants

**Files:**
- Create: `services/iap.ts`
- Create: `__tests__/services/iap.test.ts`
- Modify: `constants/theme.ts` (TIER_LIMITS already there)

**Step 1: Write tests**

```ts
// __tests__/services/iap.test.ts
import { getChildLimit } from '@/services/iap';

describe('getChildLimit', () => {
  it('returns 1 for starter', () => {
    expect(getChildLimit('com.chorely.starter')).toBe(1);
  });
  it('returns 3 for family', () => {
    expect(getChildLimit('com.chorely.family')).toBe(3);
  });
  it('returns Infinity for unlimited', () => {
    expect(getChildLimit('com.chorely.unlimited')).toBe(Infinity);
  });
  it('returns 0 for no tier', () => {
    expect(getChildLimit(null)).toBe(0);
  });
});
```

**Step 2: Run test — expect FAIL**

```bash
npx jest __tests__/services/iap.test.ts
```

**Step 3: Create `services/iap.ts`**

```ts
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
  // Find highest tier purchased
  const tierOrder = PRODUCT_IDS;
  let highestTier: string | null = null;
  for (const tier of tierOrder.reverse()) {
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
```

**Step 4: Run test — expect PASS**

```bash
npx jest __tests__/services/iap.test.ts
```

**Step 5: Commit**

```bash
git add .
git commit -m "feat: add IAP service with tier management"
```

---

## Task 8: Paywall Screen

**Files:**
- Replace: `app/(auth)/paywall.tsx`
- Create: `components/ui/TierCard.tsx`

**Step 1: Create `components/ui/TierCard.tsx`**

```tsx
import { TouchableOpacity, View } from 'react-native';
import { Text } from './Text';
import { cn } from '@/utils/cn';

interface Props {
  title: string;
  price: string;
  description: string;
  features: string[];
  isPopular?: boolean;
  isSelected?: boolean;
  onPress: () => void;
}

export function TierCard({ title, price, description, features, isPopular, isSelected, onPress }: Props) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className={cn(
        'rounded-3xl p-5 border-2 mb-3',
        isSelected ? 'border-primary bg-indigo-50' : 'border-gray-200 bg-white',
      )}
    >
      {isPopular && (
        <View className="absolute -top-3 right-5 bg-primary px-3 py-1 rounded-full">
          <Text className="text-white text-xs font-bold">Most Popular ★</Text>
        </View>
      )}
      <View className="flex-row justify-between items-center mb-2">
        <Text variant="h3">{title}</Text>
        <Text className="text-2xl font-bold text-primary">{price}</Text>
      </View>
      <Text variant="caption" className="mb-3">{description}</Text>
      {features.map((f) => (
        <Text key={f} variant="caption" className="mb-1">✓ {f}</Text>
      ))}
    </TouchableOpacity>
  );
}
```

**Step 2: Replace `app/(auth)/paywall.tsx`**

```tsx
import { useState, useEffect } from 'react';
import { View, ScrollView, Alert, SafeAreaView } from 'react-native';
import { router } from 'expo-router';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { TierCard } from '@/components/ui/TierCard';
import { initIAP, fetchProducts, purchaseTier, restorePurchases } from '@/services/iap';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '@/services/firebase';
import { useAuthStore } from '@/stores/authStore';
import { Product } from 'react-native-iap';

const TIERS = [
  {
    id: 'com.chorely.starter',
    title: 'Starter',
    price: '$4.99',
    description: 'Perfect for single-child families',
    features: ['2 parents', '1 child', 'All core features', 'iCloud-style sync'],
  },
  {
    id: 'com.chorely.family',
    title: 'Family',
    price: '$6.99',
    description: 'Most popular for growing families',
    features: ['2 parents', 'Up to 3 children', 'All core features', 'iCloud-style sync'],
    isPopular: true,
  },
  {
    id: 'com.chorely.unlimited',
    title: 'Unlimited',
    price: '$9.99',
    description: 'Large & blended families',
    features: ['2 parents', 'Unlimited children', 'All core features', 'iCloud-style sync'],
  },
];

export default function Paywall() {
  const [selectedTier, setSelectedTier] = useState('com.chorely.family');
  const [loading, setLoading] = useState(false);
  const { uid } = useAuthStore();

  useEffect(() => {
    initIAP().catch(console.error);
  }, []);

  async function handlePurchase() {
    if (!uid) { router.push('/(auth)/sign-in'); return; }
    setLoading(true);
    try {
      await purchaseTier(selectedTier);
      // Create family doc
      const familyId = `family_${uid}_${Date.now()}`;
      await setDoc(doc(db, 'families', familyId), {
        name: '',
        joinCode: '',
        verificationMode: 'self',
        currency: 'AUD',
        tierProductId: selectedTier,
        parentIds: [uid],
        createdAt: serverTimestamp(),
      });
      await setDoc(doc(db, 'users', uid), { familyId }, { merge: true });
      router.replace('/(auth)/onboarding');
    } catch (e: any) {
      if (e.code !== 'E_USER_CANCELLED') {
        Alert.alert('Purchase failed', e.message);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleRestore() {
    if (!uid) return;
    setLoading(true);
    try {
      const tier = await restorePurchases('');
      if (tier) {
        Alert.alert('Restored!', 'Your purchase has been restored.');
        router.replace('/(auth)/sign-in');
      } else {
        Alert.alert('Nothing to restore', 'No previous purchases found.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
        <View className="items-center py-8">
          <Text className="text-5xl mb-2">✅</Text>
          <Text variant="h1" className="text-center">Chorely</Text>
          <Text variant="caption" className="text-center mt-1">
            Buy once. Yours forever. No subscription.
          </Text>
        </View>

        <View className="mb-6 mt-2">
          {TIERS.map((tier) => (
            <TierCard
              key={tier.id}
              {...tier}
              isSelected={selectedTier === tier.id}
              onPress={() => setSelectedTier(tier.id)}
            />
          ))}
        </View>

        <Button
          title={`Get Chorely — ${TIERS.find(t => t.id === selectedTier)?.price}`}
          onPress={handlePurchase}
          loading={loading}
          className="mb-3"
        />
        <Button
          title="Restore Purchases"
          variant="ghost"
          onPress={handleRestore}
          className="mb-8"
        />
      </ScrollView>
    </SafeAreaView>
  );
}
```

**Step 3: Commit**

```bash
git add .
git commit -m "feat: add paywall screen with 3 IAP tiers"
```

---

## Task 9: Sign-in Screen

**Files:**
- Create: `app/(auth)/sign-in.tsx`

**Step 1: Create `app/(auth)/sign-in.tsx`**

```tsx
import { useState } from 'react';
import { View, Alert, SafeAreaView, Image } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import { router } from 'expo-router';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { signInWithApple, signInWithGoogle } from '@/services/auth';
import { useAuthStore } from '@/stores/authStore';

export default function SignIn() {
  const [loading, setLoading] = useState<'apple' | 'google' | null>(null);

  async function handleApple() {
    setLoading('apple');
    try {
      await signInWithApple();
      // onAuthStateChanged in _layout.tsx handles routing
    } catch (e: any) {
      if (e.code !== 'ERR_REQUEST_CANCELED') {
        Alert.alert('Sign in failed', e.message);
      }
    } finally {
      setLoading(null);
    }
  }

  async function handleGoogle() {
    setLoading('google');
    try {
      await signInWithGoogle();
    } catch (e: any) {
      Alert.alert('Sign in failed', e.message);
    } finally {
      setLoading(null);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 px-8 justify-center">
        <View className="items-center mb-12">
          <Text className="text-6xl mb-4">✅</Text>
          <Text variant="h1" className="text-center">Welcome to Chorely</Text>
          <Text variant="body" className="text-center text-gray-500 mt-2">
            Sign in to sync across all your family's devices
          </Text>
        </View>

        <AppleAuthentication.AppleAuthenticationButton
          buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
          buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
          cornerRadius={16}
          style={{ width: '100%', height: 56, marginBottom: 12 }}
          onPress={handleApple}
        />

        <Button
          title={loading === 'google' ? 'Signing in...' : '  Sign in with Google'}
          variant="secondary"
          loading={loading === 'google'}
          onPress={handleGoogle}
        />

        <Text variant="caption" className="text-center mt-8 text-gray-400">
          Your family's data is private and encrypted.{'\n'}We never see your information.
        </Text>
      </View>
    </SafeAreaView>
  );
}
```

**Step 2: Commit**

```bash
git add .
git commit -m "feat: add sign-in screen with Apple and Google buttons"
```

---

## Task 10: Onboarding Wizard

**Files:**
- Create: `app/(auth)/onboarding.tsx`
- Create: `components/onboarding/StepAddChild.tsx`
- Create: `components/onboarding/StepAddChore.tsx`
- Create: `components/onboarding/StepVerification.tsx`
- Create: `components/onboarding/StepFamilyName.tsx`

**Step 1: Create `components/onboarding/StepAddChild.tsx`**

```tsx
import { useState } from 'react';
import { View, TextInput, ScrollView, TouchableOpacity } from 'react-native';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { CHILD_THEMES } from '@/constants/theme';

const AVATAR_EMOJIS = ['👦', '👧', '🧒', '👶', '🐱', '🐶', '🦄', '🐻', '🐼', '🦊'];

interface Props {
  onNext: (child: { name: string; avatarEmoji: string; colorTheme: string; rewardMode: 'money' | 'emoji'; rewardEmoji: string }) => void;
}

export function StepAddChild({ onNext }: Props) {
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('👦');
  const [color, setColor] = useState(CHILD_THEMES[0]);
  const [rewardMode, setRewardMode] = useState<'money' | 'emoji'>('money');
  const [rewardEmoji, setRewardEmoji] = useState('⭐');

  return (
    <ScrollView className="flex-1 px-5">
      <Text variant="h2" className="mb-6">Add your first child</Text>

      <Text variant="label" className="mb-2">Name</Text>
      <TextInput
        className="border border-gray-200 rounded-2xl px-4 h-14 text-base mb-6"
        placeholder="Child's name"
        value={name}
        onChangeText={setName}
      />

      <Text variant="label" className="mb-3">Avatar</Text>
      <View className="flex-row flex-wrap mb-6">
        {AVATAR_EMOJIS.map((e) => (
          <TouchableOpacity
            key={e}
            onPress={() => setAvatar(e)}
            className={`w-12 h-12 items-center justify-center rounded-full mr-2 mb-2 ${avatar === e ? 'bg-indigo-100 border-2 border-primary' : 'bg-gray-100'}`}
          >
            <Text className="text-2xl">{e}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text variant="label" className="mb-3">Reward type</Text>
      <View className="flex-row mb-6">
        <TouchableOpacity
          onPress={() => setRewardMode('money')}
          className={`flex-1 h-14 items-center justify-center rounded-2xl mr-2 border-2 ${rewardMode === 'money' ? 'border-primary bg-indigo-50' : 'border-gray-200'}`}
        >
          <Text className="text-lg">💰 Money</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setRewardMode('emoji')}
          className={`flex-1 h-14 items-center justify-center rounded-2xl border-2 ${rewardMode === 'emoji' ? 'border-primary bg-indigo-50' : 'border-gray-200'}`}
        >
          <Text className="text-lg">⭐ Emoji</Text>
        </TouchableOpacity>
      </View>

      <Button
        title="Next →"
        onPress={() => onNext({ name, avatarEmoji: avatar, colorTheme: color, rewardMode, rewardEmoji })}
        disabled={!name.trim()}
      />
    </ScrollView>
  );
}
```

**Step 2: Create `app/(auth)/onboarding.tsx`**

```tsx
import { useState } from 'react';
import { View, SafeAreaView } from 'react-native';
import { router } from 'expo-router';
import { doc, setDoc, addDoc, collection, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/services/firebase';
import { useAuthStore } from '@/stores/authStore';
import { useFamilyStore } from '@/stores/familyStore';
import { Text } from '@/components/ui/Text';
import { StepAddChild } from '@/components/onboarding/StepAddChild';
import { Button } from '@/components/ui/Button';

type VerificationMode = 'self' | 'approval';

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const [childData, setChildData] = useState<any>(null);
  const [familyName, setFamilyName] = useState('');
  const [verificationMode, setVerificationMode] = useState<VerificationMode>('self');
  const { uid } = useAuthStore();
  const { family } = useFamilyStore();

  async function handleChildNext(child: any) {
    setChildData(child);
    setStep(1);
  }

  async function handleFinish() {
    if (!uid || !family) return;
    try {
      // Save child
      await addDoc(collection(db, 'families', family.id, 'children'), {
        ...childData,
        balance: 0,
        linkedDeviceId: null,
        createdAt: serverTimestamp(),
      });
      // Update family name + verification mode
      await updateDoc(doc(db, 'families', family.id), {
        name: familyName || 'Our Family',
        verificationMode,
      });
      router.replace('/(parent)/dashboard');
    } catch (e: any) {
      console.error(e);
    }
  }

  const steps = ['Add child', 'Verification', 'Family name'];

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Progress */}
      <View className="flex-row px-5 pt-4 mb-6">
        {steps.map((s, i) => (
          <View key={s} className="flex-1 items-center">
            <View className={`w-8 h-8 rounded-full items-center justify-center ${i <= step ? 'bg-primary' : 'bg-gray-200'}`}>
              <Text className={`text-sm font-bold ${i <= step ? 'text-white' : 'text-gray-500'}`}>{i + 1}</Text>
            </View>
          </View>
        ))}
      </View>

      {step === 0 && <StepAddChild onNext={handleChildNext} />}

      {step === 1 && (
        <View className="flex-1 px-5">
          <Text variant="h2" className="mb-6">How should chores work?</Text>
          {(['self', 'approval'] as VerificationMode[]).map((mode) => (
            <Button
              key={mode}
              title={mode === 'self' ? '🟢 Kids self-complete' : '✅ Parent approval required'}
              variant={verificationMode === mode ? 'primary' : 'secondary'}
              onPress={() => setVerificationMode(mode)}
              className="mb-3"
            />
          ))}
          <Button title="Next →" onPress={() => setStep(2)} className="mt-4" />
        </View>
      )}

      {step === 2 && (
        <View className="flex-1 px-5">
          <Text variant="h2" className="mb-6">What's your family name?</Text>
          <View className="border border-gray-200 rounded-2xl px-4 h-14 justify-center mb-6">
            <Text className="text-base text-gray-400">The Smiths</Text>
          </View>
          <Button title="Let's go! 🎉" onPress={handleFinish} />
        </View>
      )}
    </SafeAreaView>
  );
}
```

**Step 3: Commit**

```bash
git add .
git commit -m "feat: add onboarding wizard (add child, verification mode, family name)"
```

---

## Task 11: Firestore Service

**Files:**
- Create: `services/firestore.ts`

**Step 1: Create `services/firestore.ts`**

```ts
import {
  collection, doc, addDoc, setDoc, updateDoc, deleteDoc,
  onSnapshot, query, where, orderBy, serverTimestamp,
  getDocs, writeBatch, Unsubscribe,
} from 'firebase/firestore';
import { db } from '@/services/firebase';
import { useFamilyStore } from '@/stores/familyStore';
import { useChoresStore } from '@/stores/choresStore';
import { useCompletionsStore } from '@/stores/completionsStore';

// Subscribe to all family data (call once after login)
export function subscribeToFamily(familyId: string): Unsubscribe[] {
  const unsubs: Unsubscribe[] = [];

  // Family doc
  unsubs.push(
    onSnapshot(doc(db, 'families', familyId), (snap) => {
      if (snap.exists()) {
        useFamilyStore.getState().setFamily({ id: snap.id, ...snap.data() } as any);
      }
    })
  );

  // Children
  unsubs.push(
    onSnapshot(collection(db, 'families', familyId, 'children'), (snap) => {
      const children = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      useFamilyStore.getState().setChildren(children as any);
    })
  );

  // Chores
  unsubs.push(
    onSnapshot(
      query(collection(db, 'families', familyId, 'chores'), where('isActive', '==', true)),
      (snap) => {
        const chores = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        useChoresStore.getState().setChores(chores as any);
      }
    )
  );

  // Completions (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  unsubs.push(
    onSnapshot(
      query(
        collection(db, 'families', familyId, 'completions'),
        where('submittedAt', '>=', thirtyDaysAgo),
        orderBy('submittedAt', 'desc')
      ),
      (snap) => {
        const completions = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
          submittedAt: d.data().submittedAt?.toDate(),
          reviewedAt: d.data().reviewedAt?.toDate() ?? null,
        }));
        useCompletionsStore.getState().setCompletions(completions as any);
      }
    )
  );

  return unsubs;
}

// Chores CRUD
export async function createChore(familyId: string, chore: Omit<any, 'id'>): Promise<string> {
  const ref = await addDoc(collection(db, 'families', familyId, 'chores'), {
    ...chore,
    isActive: true,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateChore(familyId: string, choreId: string, updates: any): Promise<void> {
  await updateDoc(doc(db, 'families', familyId, 'chores', choreId), updates);
}

export async function deleteChore(familyId: string, choreId: string): Promise<void> {
  await updateDoc(doc(db, 'families', familyId, 'chores', choreId), { isActive: false });
}

// Completions
export async function submitCompletion(
  familyId: string,
  choreId: string,
  childId: string,
  photoUrl: string | null,
  requiresApproval: boolean,
): Promise<string> {
  const status = requiresApproval ? 'pending' : 'approved';
  const ref = await addDoc(collection(db, 'families', familyId, 'completions'), {
    choreId, childId, status, photoUrl,
    submittedAt: serverTimestamp(),
    reviewedAt: null,
    rejectionReason: null,
  });

  if (!requiresApproval) {
    await creditBalance(familyId, choreId, childId, ref.id);
  }

  return ref.id;
}

export async function approveCompletion(
  familyId: string,
  completionId: string,
  choreId: string,
  childId: string,
): Promise<void> {
  await updateDoc(doc(db, 'families', familyId, 'completions', completionId), {
    status: 'approved',
    reviewedAt: serverTimestamp(),
  });
  await creditBalance(familyId, choreId, childId, completionId);
}

export async function rejectCompletion(
  familyId: string,
  completionId: string,
  reason: string,
): Promise<void> {
  await updateDoc(doc(db, 'families', familyId, 'completions', completionId), {
    status: 'rejected',
    reviewedAt: serverTimestamp(),
    rejectionReason: reason,
  });
}

async function creditBalance(
  familyId: string,
  choreId: string,
  childId: string,
  completionId: string,
): Promise<void> {
  const choreSnap = await getDocs(
    query(collection(db, 'families', familyId, 'chores'), where('__name__', '==', choreId))
  );
  if (choreSnap.empty) return;
  const chore = choreSnap.docs[0].data();

  const batch = writeBatch(db);

  // Increment child balance
  const childRef = doc(db, 'families', familyId, 'children', childId);
  const childSnap = await getDocs(
    query(collection(db, 'families', familyId, 'children'), where('__name__', '==', childId))
  );
  if (!childSnap.empty) {
    const current = childSnap.docs[0].data().balance ?? 0;
    batch.update(childRef, { balance: current + chore.value });
  }

  // Create transaction record
  const txRef = doc(collection(db, 'families', familyId, 'transactions'));
  batch.set(txRef, {
    childId, choreId, completionId,
    type: 'earned',
    amount: chore.value,
    description: chore.name,
    createdAt: serverTimestamp(),
  });

  await batch.commit();
}

// Manual balance adjustment
export async function adjustBalance(
  familyId: string,
  childId: string,
  amount: number,
  description: string,
): Promise<void> {
  const childRef = doc(db, 'families', familyId, 'children', childId);
  const snap = await getDocs(
    query(collection(db, 'families', familyId, 'children'), where('__name__', '==', childId))
  );
  if (snap.empty) return;
  const current = snap.docs[0].data().balance ?? 0;

  const batch = writeBatch(db);
  batch.update(childRef, { balance: current + amount });
  const txRef = doc(collection(db, 'families', familyId, 'transactions'));
  batch.set(txRef, {
    childId, type: amount >= 0 ? 'manual' : 'deducted',
    amount, description,
    completionId: null,
    createdAt: serverTimestamp(),
  });
  await batch.commit();
}

// Join codes
export async function generateJoinCode(familyId: string): Promise<string> {
  const code = 'CHORELY-' + Math.random().toString(36).slice(2, 6).toUpperCase();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await updateDoc(doc(db, 'families', familyId), { joinCode: code, joinCodeExpiresAt: expiresAt });
  return code;
}

export async function joinFamily(uid: string, code: string): Promise<void> {
  const snap = await getDocs(
    query(collection(db, 'families'), where('joinCode', '==', code))
  );
  if (snap.empty) throw new Error('Invalid or expired code');
  const family = snap.docs[0];
  const data = family.data();
  if (new Date() > data.joinCodeExpiresAt.toDate()) throw new Error('Code has expired');

  const batch = writeBatch(db);
  batch.update(doc(db, 'families', family.id), {
    parentIds: [...data.parentIds, uid],
  });
  batch.set(doc(db, 'users', uid), { familyId: family.id, role: 'parent', linkedChildId: null }, { merge: true });
  await batch.commit();
}

export async function generateKidDeviceCode(familyId: string, childId: string): Promise<string> {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  await setDoc(doc(db, 'kidCodes', code), { familyId, childId, expiresAt });
  return code;
}

export async function redeemKidCode(uid: string, code: string): Promise<void> {
  const snap = await getDocs(
    query(collection(db, 'kidCodes'), where('__name__', '==', code))
  );
  if (snap.empty) throw new Error('Invalid code');
  const data = snap.docs[0].data();
  if (new Date() > data.expiresAt.toDate()) throw new Error('Code expired');

  const batch = writeBatch(db);
  batch.set(doc(db, 'users', uid), {
    role: 'kid', familyId: data.familyId, linkedChildId: data.childId,
  });
  batch.update(doc(db, 'families', data.familyId, 'children', data.childId), { linkedDeviceId: uid });
  batch.delete(doc(db, 'kidCodes', code));
  await batch.commit();
}
```

**Step 2: Commit**

```bash
git add .
git commit -m "feat: add comprehensive Firestore service (CRUD, completions, join codes)"
```

---

## Task 12: Parent Dashboard

**Files:**
- Replace: `app/(parent)/dashboard.tsx`
- Create: `components/parent/ChildCard.tsx`
- Create: `services/sync.ts`

**Step 1: Create `services/sync.ts`** (starts Firestore listeners after login)

```ts
import { subscribeToFamily } from './firestore';
import { useAuthStore } from '@/stores/authStore';

let unsubs: (() => void)[] = [];

export function startSync(familyId: string) {
  stopSync();
  unsubs = subscribeToFamily(familyId);
}

export function stopSync() {
  unsubs.forEach((u) => u());
  unsubs = [];
}
```

**Step 2: Wire sync start in `app/_layout.tsx`** — add to the onAuthStateChanged handler:

```ts
// After setAuth call in app/_layout.tsx:
import { startSync, stopSync } from '@/services/sync';
// In the if(user) branch, after setAuth:
if (data.familyId) startSync(data.familyId);
// In the else (signOut) branch:
stopSync();
```

**Step 3: Create `components/parent/ChildCard.tsx`**

```tsx
import { TouchableOpacity, View } from 'react-native';
import { Text } from '@/components/ui/Text';
import { Child } from '@/stores/familyStore';
import { formatBalance } from '@/utils/formatReward';
import { useFamilyStore } from '@/stores/familyStore';
import { useCompletionsStore } from '@/stores/completionsStore';
import { useChoresStore } from '@/stores/choresStore';

interface Props {
  child: Child;
  onPress: () => void;
}

export function ChildCard({ child, onPress }: Props) {
  const { family } = useFamilyStore();
  const { completions } = useCompletionsStore();
  const { chores } = useChoresStore();

  const todayChores = chores.filter((c) => c.assignedChildId === child.id);
  const todayCompletions = completions.filter(
    (c) => c.childId === child.id && isToday(c.submittedAt) && c.status !== 'rejected'
  );
  const pendingCount = completions.filter(
    (c) => c.childId === child.id && c.status === 'pending'
  ).length;

  return (
    <TouchableOpacity
      onPress={onPress}
      className="bg-white rounded-3xl p-5 mb-3 shadow-sm border border-gray-100"
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center flex-1">
          <View
            className="w-14 h-14 rounded-full items-center justify-center mr-4"
            style={{ backgroundColor: child.colorTheme + '30' }}
          >
            <Text className="text-3xl">{child.avatarEmoji}</Text>
          </View>
          <View className="flex-1">
            <Text variant="h3">{child.name}</Text>
            <Text variant="caption">
              {todayCompletions.length}/{todayChores.length} chores done today
            </Text>
          </View>
        </View>
        <View className="items-end">
          <Text variant="h3" className="text-primary">
            {formatBalance(child, child.balance, family?.currency ?? 'AUD')}
          </Text>
          {pendingCount > 0 && (
            <View className="bg-warning rounded-full px-2 py-0.5 mt-1">
              <Text className="text-white text-xs font-bold">{pendingCount} pending</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

function isToday(date: Date): boolean {
  const today = new Date();
  return date.toDateString() === today.toDateString();
}
```

**Step 4: Replace `app/(parent)/dashboard.tsx`**

```tsx
import { View, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Text } from '@/components/ui/Text';
import { ChildCard } from '@/components/parent/ChildCard';
import { useFamilyStore } from '@/stores/familyStore';
import { useCompletionsStore } from '@/stores/completionsStore';

export default function Dashboard() {
  const { family, children } = useFamilyStore();
  const { completions } = useCompletionsStore();

  const totalPending = completions.filter((c) => c.status === 'pending').length;

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="flex-row justify-between items-center py-5">
          <View>
            <Text variant="h2">{family?.name || 'Our Family'}</Text>
            <Text variant="caption">
              {new Date().toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' })}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/(parent)/settings')}
            className="w-10 h-10 bg-white rounded-full items-center justify-center shadow-sm"
          >
            <Text>⚙️</Text>
          </TouchableOpacity>
        </View>

        {/* Pending approval banner */}
        {totalPending > 0 && (
          <TouchableOpacity
            onPress={() => router.push('/(shared)/approval-queue')}
            className="bg-warning rounded-2xl p-4 mb-4 flex-row items-center justify-between"
          >
            <Text className="text-white font-semibold">
              {totalPending} chore{totalPending > 1 ? 's' : ''} waiting for approval
            </Text>
            <Text className="text-white">→</Text>
          </TouchableOpacity>
        )}

        {/* Children */}
        {children.map((child) => (
          <ChildCard
            key={child.id}
            child={child}
            onPress={() => router.push(`/(parent)/child/${child.id}`)}
          />
        ))}

        {/* Add chore shortcut */}
        <TouchableOpacity
          onPress={() => router.push('/(shared)/chore-builder')}
          className="bg-primary rounded-3xl p-5 mt-2 flex-row items-center justify-center"
        >
          <Text className="text-white font-bold text-base">+ Add New Chore</Text>
        </TouchableOpacity>

        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}
```

**Step 5: Commit**

```bash
git add .
git commit -m "feat: add parent dashboard with child cards and pending approval banner"
```

---

## Task 13: Chore Builder

**Files:**
- Replace: `app/(shared)/chore-builder.tsx`

**Step 1: Replace `app/(shared)/chore-builder.tsx`**

```tsx
import { useState } from 'react';
import { View, TextInput, ScrollView, SafeAreaView, Switch, TouchableOpacity, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { useFamilyStore } from '@/stores/familyStore';
import { useChoresStore, Chore } from '@/stores/choresStore';
import { createChore, updateChore } from '@/services/firestore';

const CHORE_EMOJIS = ['🧹', '🍽️', '🛏️', '🐕', '🌿', '🛁', '🗑️', '📚', '🧺', '🪟', '🧴', '🍳'];
const SCHEDULES = [
  { label: 'Daily', value: 'daily' },
  { label: 'Weekly', value: 'weekly' },
  { label: 'One-off', value: 'once' },
];

export default function ChoreBuilder() {
  const { choreId } = useLocalSearchParams<{ choreId?: string }>();
  const { family, children } = useFamilyStore();
  const { chores } = useChoresStore();
  const existing = choreId ? chores.find((c) => c.id === choreId) : null;

  const [name, setName] = useState(existing?.name ?? '');
  const [icon, setIcon] = useState(existing?.iconEmoji ?? '🧹');
  const [schedule, setSchedule] = useState(existing?.schedule ?? 'daily');
  const [value, setValue] = useState(String(existing?.value ?? '1'));
  const [assignedChildId, setAssignedChildId] = useState(existing?.assignedChildId ?? children[0]?.id ?? '');
  const [requiresApproval, setRequiresApproval] = useState(existing?.requiresApproval ?? false);
  const [loading, setLoading] = useState(false);

  const assignedChild = children.find((c) => c.id === assignedChildId);

  async function handleSave() {
    if (!family || !name.trim()) return;
    setLoading(true);
    try {
      const data = {
        name: name.trim(),
        iconEmoji: icon,
        schedule,
        value: parseFloat(value) || 0,
        assignedChildId,
        requiresApproval,
      };
      if (existing) {
        await updateChore(family.id, existing.id, data);
      } else {
        await createChore(family.id, data);
      }
      router.back();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1 px-5">
        <View className="flex-row items-center py-5">
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <Text className="text-primary text-base">← Back</Text>
          </TouchableOpacity>
          <Text variant="h2">{existing ? 'Edit Chore' : 'New Chore'}</Text>
        </View>

        <Text variant="label" className="mb-2">Chore name</Text>
        <TextInput
          className="border border-gray-200 rounded-2xl px-4 h-14 text-base mb-5"
          placeholder="e.g. Tidy bedroom"
          value={name}
          onChangeText={setName}
        />

        <Text variant="label" className="mb-3">Icon</Text>
        <View className="flex-row flex-wrap mb-5">
          {CHORE_EMOJIS.map((e) => (
            <TouchableOpacity
              key={e}
              onPress={() => setIcon(e)}
              className={`w-12 h-12 items-center justify-center rounded-2xl mr-2 mb-2 ${icon === e ? 'bg-indigo-100 border-2 border-primary' : 'bg-gray-100'}`}
            >
              <Text className="text-2xl">{e}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text variant="label" className="mb-3">Schedule</Text>
        <View className="flex-row mb-5">
          {SCHEDULES.map((s) => (
            <TouchableOpacity
              key={s.value}
              onPress={() => setSchedule(s.value)}
              className={`flex-1 h-11 items-center justify-center rounded-xl mr-2 border ${schedule === s.value ? 'border-primary bg-indigo-50' : 'border-gray-200'}`}
            >
              <Text variant="caption" className={schedule === s.value ? 'text-primary font-semibold' : ''}>{s.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text variant="label" className="mb-2">Assign to</Text>
        <View className="flex-row flex-wrap mb-5">
          {children.map((child) => (
            <TouchableOpacity
              key={child.id}
              onPress={() => setAssignedChildId(child.id)}
              className={`flex-row items-center px-4 h-11 rounded-full mr-2 mb-2 border ${assignedChildId === child.id ? 'border-primary bg-indigo-50' : 'border-gray-200'}`}
            >
              <Text className="mr-1">{child.avatarEmoji}</Text>
              <Text variant="caption">{child.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text variant="label" className="mb-2">
          Reward value {assignedChild?.rewardMode === 'emoji' ? `(${assignedChild.rewardEmoji})` : `(${family?.currency ?? 'AUD'})`}
        </Text>
        <TextInput
          className="border border-gray-200 rounded-2xl px-4 h-14 text-base mb-5"
          placeholder={assignedChild?.rewardMode === 'emoji' ? '5' : '2.00'}
          value={value}
          onChangeText={setValue}
          keyboardType="decimal-pad"
        />

        <View className="flex-row items-center justify-between mb-8">
          <View className="flex-1">
            <Text variant="label">Require my approval</Text>
            <Text variant="caption">Balance updates only after you approve</Text>
          </View>
          <Switch
            value={requiresApproval}
            onValueChange={setRequiresApproval}
            trackColor={{ true: '#6366F1' }}
          />
        </View>

        <Button title={loading ? 'Saving...' : 'Save Chore'} onPress={handleSave} loading={loading} className="mb-8" />
      </ScrollView>
    </SafeAreaView>
  );
}
```

**Step 2: Commit**

```bash
git add .
git commit -m "feat: add chore builder screen"
```

---

## Task 14: Child Detail Screen

**Files:**
- Create: `app/(parent)/child/[id].tsx`
- Create: `components/parent/ManualAdjustModal.tsx`

**Step 1: Create `app/(parent)/child/[id].tsx`**

```tsx
import { useState } from 'react';
import { View, ScrollView, SafeAreaView, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useFamilyStore } from '@/stores/familyStore';
import { useChoresStore } from '@/stores/choresStore';
import { useCompletionsStore } from '@/stores/completionsStore';
import { formatBalance, formatReward } from '@/utils/formatReward';
import { approveCompletion, rejectCompletion, adjustBalance } from '@/services/firestore';

export default function ChildDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { family, children } = useFamilyStore();
  const { chores } = useChoresStore();
  const { completions } = useCompletionsStore();
  const [rejectingId, setRejectingId] = useState<string | null>(null);

  const child = children.find((c) => c.id === id);
  if (!child || !family) return null;

  const childChores = chores.filter((c) => c.assignedChildId === id);
  const pendingCompletions = completions.filter(
    (c) => c.childId === id && c.status === 'pending'
  );

  async function handleApprove(completionId: string, choreId: string) {
    await approveCompletion(family!.id, completionId, choreId, id!);
  }

  async function handleReject(completionId: string) {
    Alert.prompt('Rejection reason', 'Optional message for your child', async (reason) => {
      await rejectCompletion(family!.id, completionId, reason ?? '');
    });
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1 px-5">
        {/* Header */}
        <View className="flex-row items-center py-5">
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <Text className="text-primary">← Back</Text>
          </TouchableOpacity>
          <View
            className="w-10 h-10 rounded-full items-center justify-center mr-3"
            style={{ backgroundColor: child.colorTheme + '30' }}
          >
            <Text className="text-2xl">{child.avatarEmoji}</Text>
          </View>
          <Text variant="h2">{child.name}</Text>
        </View>

        {/* Balance card */}
        <Card className="items-center py-8 mb-4">
          <Text variant="caption" className="mb-1">Current Balance</Text>
          <Text className="text-5xl font-bold text-primary">
            {formatBalance(child, child.balance, family.currency)}
          </Text>
          <TouchableOpacity
            className="mt-4 bg-gray-100 px-4 py-2 rounded-full"
            onPress={() => Alert.alert('Manual Adjustment', 'Use + or − buttons', [
              { text: '+ Add', onPress: () => {
                Alert.prompt('Add amount', '', async (v) => {
                  await adjustBalance(family.id, id, parseFloat(v ?? '0'), 'Manual bonus');
                });
              }},
              { text: '− Deduct', onPress: () => {
                Alert.prompt('Deduct amount', '', async (v) => {
                  await adjustBalance(family.id, id, -parseFloat(v ?? '0'), 'Manual deduction');
                });
              }},
              { text: 'Cancel', style: 'cancel' },
            ])}
          >
            <Text variant="caption">Manual Adjustment</Text>
          </TouchableOpacity>
        </Card>

        {/* Pending approvals */}
        {pendingCompletions.length > 0 && (
          <View className="mb-4">
            <Text variant="h3" className="mb-3">Needs Approval</Text>
            {pendingCompletions.map((completion) => {
              const chore = chores.find((c) => c.id === completion.choreId);
              return (
                <Card key={completion.id} className="mb-2">
                  <View className="flex-row items-center justify-between mb-3">
                    <Text className="text-xl mr-2">{chore?.iconEmoji}</Text>
                    <Text variant="label" className="flex-1">{chore?.name}</Text>
                  </View>
                  <View className="flex-row">
                    <Button
                      title="Approve ✓"
                      onPress={() => handleApprove(completion.id, completion.choreId)}
                      className="flex-1 mr-2 h-11"
                    />
                    <Button
                      title="Reject ✗"
                      variant="danger"
                      onPress={() => handleReject(completion.id)}
                      className="flex-1 h-11"
                    />
                  </View>
                </Card>
              );
            })}
          </View>
        )}

        {/* Today's chores */}
        <Text variant="h3" className="mb-3">Chores</Text>
        {childChores.map((chore) => (
          <Card key={chore.id} className="mb-2 flex-row items-center justify-between">
            <View className="flex-row items-center flex-1">
              <Text className="text-2xl mr-3">{chore.iconEmoji}</Text>
              <View>
                <Text variant="label">{chore.name}</Text>
                <Text variant="caption">{chore.schedule} · {formatReward(child, chore.value, family.currency)}</Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={() => router.push({ pathname: '/(shared)/chore-builder', params: { choreId: chore.id } })}
            >
              <Text variant="caption" className="text-primary">Edit</Text>
            </TouchableOpacity>
          </Card>
        ))}

        <Button
          title="View History"
          variant="secondary"
          onPress={() => router.push(`/(shared)/history/${id}`)}
          className="mt-4 mb-8"
        />
      </ScrollView>
    </SafeAreaView>
  );
}
```

**Step 2: Commit**

```bash
git add .
git commit -m "feat: add child detail screen with balance, approvals, and chores"
```

---

## Task 15: Kid View & Celebration Animation

**Files:**
- Replace: `app/(kid)/view.tsx`
- Create: `components/kid/ChoreCard.tsx`
- Create: `components/kid/CelebrationOverlay.tsx`
- Add: `assets/animations/celebration.json` (download from LottieFiles.com — search "confetti")

**Step 1: Download celebration Lottie file**

Go to https://lottiefiles.com/search?q=confetti and download a free confetti animation as `celebration.json`.
Save it to: `assets/animations/celebration.json`

**Step 2: Create `components/kid/CelebrationOverlay.tsx`**

```tsx
import { useEffect } from 'react';
import { View, Modal } from 'react-native';
import LottieView from 'lottie-react-native';
import { Text } from '@/components/ui/Text';

interface Props {
  visible: boolean;
  message: string;
  onDone: () => void;
}

export function CelebrationOverlay({ visible, message, onDone }: Props) {
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(onDone, 2500);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View className="flex-1 bg-black/40 items-center justify-center">
        <LottieView
          source={require('@/assets/animations/celebration.json')}
          autoPlay
          loop={false}
          style={{ width: '100%', height: '100%', position: 'absolute' }}
        />
        <Text className="text-white text-4xl font-bold text-center">{message}</Text>
      </View>
    </Modal>
  );
}
```

**Step 3: Create `components/kid/ChoreCard.tsx`**

```tsx
import { TouchableOpacity, View } from 'react-native';
import { Text } from '@/components/ui/Text';
import { Chore } from '@/stores/choresStore';
import { Completion } from '@/stores/completionsStore';

interface Props {
  chore: Chore;
  completion?: Completion;
  onPress: () => void;
}

export function ChoreCard({ chore, completion, onPress }: Props) {
  const isPending = completion?.status === 'pending';
  const isDone = completion?.status === 'approved';

  return (
    <TouchableOpacity
      onPress={isDone ? undefined : onPress}
      className={`rounded-3xl p-6 mb-4 ${isDone ? 'bg-green-50 border-2 border-green-300' : isPending ? 'bg-amber-50 border-2 border-amber-300' : 'bg-white border-2 border-gray-200'}`}
      activeOpacity={isDone ? 1 : 0.7}
    >
      <Text className="text-5xl mb-3">{chore.iconEmoji}</Text>
      <Text variant="h3" className="mb-1">{chore.name}</Text>
      {isDone && <Text className="text-green-600 font-semibold">✓ Done!</Text>}
      {isPending && <Text className="text-amber-600 font-semibold">⏳ Waiting for Mum/Dad…</Text>}
      {!isDone && !isPending && (
        <View className="bg-primary rounded-2xl py-3 px-5 items-center mt-3">
          <Text className="text-white font-bold text-lg">Done! 🎉</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}
```

**Step 4: Replace `app/(kid)/view.tsx`**

```tsx
import { useState } from 'react';
import { View, ScrollView, SafeAreaView, Alert } from 'react-native';
import { Text } from '@/components/ui/Text';
import { ChoreCard } from '@/components/kid/ChoreCard';
import { CelebrationOverlay } from '@/components/kid/CelebrationOverlay';
import { useAuthStore } from '@/stores/authStore';
import { useFamilyStore } from '@/stores/familyStore';
import { useChoresStore } from '@/stores/choresStore';
import { useCompletionsStore } from '@/stores/completionsStore';
import { submitCompletion } from '@/services/firestore';
import { formatBalance } from '@/utils/formatReward';

export default function KidView() {
  const { linkedChildId } = useAuthStore();
  const { family, children } = useFamilyStore();
  const { chores } = useChoresStore();
  const { completions } = useCompletionsStore();
  const [celebrating, setCelebrating] = useState(false);
  const [celebrationMsg, setCelebrationMsg] = useState('');

  const child = children.find((c) => c.id === linkedChildId);
  if (!child || !family) return null;

  const myChores = chores.filter((c) => c.assignedChildId === linkedChildId);
  const todayCompletions = completions.filter(
    (c) => c.childId === linkedChildId && isToday(c.submittedAt)
  );

  async function handleChorePress(chore: typeof myChores[0]) {
    const existing = todayCompletions.find((c) => c.choreId === chore.id);
    if (existing) return;

    const needsApproval = chore.requiresApproval ||
      (family.verificationMode === 'approval' && !chore.requiresApproval === false);
    const requiresApproval = family.verificationMode === 'approval' || chore.requiresApproval;

    await submitCompletion(family.id, chore.id, child.id, null, requiresApproval);

    if (!requiresApproval) {
      setCelebrationMsg(`${chore.iconEmoji}\n+${chore.value}!`);
      setCelebrating(true);
    } else {
      Alert.alert('Submitted!', 'Waiting for Mum or Dad to approve 👍');
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1 px-5">
        <View className="items-center py-8">
          <Text className="text-6xl mb-3">{child.avatarEmoji}</Text>
          <Text variant="h2">{child.name}</Text>
          <Text className="text-4xl font-bold text-primary mt-2">
            {formatBalance(child, child.balance, family.currency)}
          </Text>
        </View>

        <Text variant="h3" className="mb-4">Today's Chores</Text>
        {myChores.map((chore) => {
          const completion = todayCompletions.find((c) => c.choreId === chore.id);
          return (
            <ChoreCard
              key={chore.id}
              chore={chore}
              completion={completion}
              onPress={() => handleChorePress(chore)}
            />
          );
        })}

        {myChores.length === 0 && (
          <Text variant="caption" className="text-center mt-8">No chores today! 🎉</Text>
        )}
        <View className="h-8" />
      </ScrollView>

      <CelebrationOverlay
        visible={celebrating}
        message={celebrationMsg}
        onDone={() => setCelebrating(false)}
      />
    </SafeAreaView>
  );
}

function isToday(date: Date): boolean {
  return date.toDateString() === new Date().toDateString();
}
```

**Step 5: Commit**

```bash
git add .
git commit -m "feat: add kid view with chore cards and celebration animation"
```

---

## Task 16: Approval Queue

**Files:**
- Create: `app/(shared)/approval-queue.tsx`

**Step 1: Create `app/(shared)/approval-queue.tsx`**

```tsx
import { View, ScrollView, SafeAreaView, Alert, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useFamilyStore } from '@/stores/familyStore';
import { useChoresStore } from '@/stores/choresStore';
import { useCompletionsStore } from '@/stores/completionsStore';
import { approveCompletion, rejectCompletion } from '@/services/firestore';

export default function ApprovalQueue() {
  const { family, children } = useFamilyStore();
  const { chores } = useChoresStore();
  const { completions } = useCompletionsStore();

  const pending = completions.filter((c) => c.status === 'pending');

  async function handleApprove(completionId: string, choreId: string, childId: string) {
    if (!family) return;
    await approveCompletion(family.id, completionId, choreId, childId);
  }

  async function handleReject(completionId: string) {
    if (!family) return;
    Alert.prompt(
      'Reason (optional)',
      'Let your child know why',
      async (reason) => {
        await rejectCompletion(family.id, completionId, reason ?? '');
      }
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1 px-5">
        <View className="flex-row items-center py-5">
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <Text className="text-primary">← Back</Text>
          </TouchableOpacity>
          <Text variant="h2">Approval Queue</Text>
          {pending.length > 0 && (
            <View className="ml-3 bg-warning rounded-full w-6 h-6 items-center justify-center">
              <Text className="text-white text-xs font-bold">{pending.length}</Text>
            </View>
          )}
        </View>

        {pending.length === 0 && (
          <View className="items-center py-16">
            <Text className="text-5xl mb-4">✅</Text>
            <Text variant="h3" className="text-center">All caught up!</Text>
            <Text variant="caption" className="text-center mt-2">No chores waiting for approval.</Text>
          </View>
        )}

        {pending.map((completion) => {
          const chore = chores.find((c) => c.id === completion.choreId);
          const child = children.find((c) => c.id === completion.childId);
          return (
            <Card key={completion.id} className="mb-3">
              <View className="flex-row items-center mb-4">
                <Text className="text-3xl mr-3">{chore?.iconEmoji}</Text>
                <View className="flex-1">
                  <Text variant="label">{chore?.name}</Text>
                  <Text variant="caption">
                    {child?.avatarEmoji} {child?.name} · {completion.submittedAt.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
              </View>
              {completion.photoUrl && (
                <Text variant="caption" className="mb-3 text-primary">📷 Photo attached</Text>
              )}
              <View className="flex-row">
                <Button
                  title="Approve ✓"
                  onPress={() => handleApprove(completion.id, completion.choreId, completion.childId)}
                  className="flex-1 mr-2 h-11"
                />
                <Button
                  title="Reject ✗"
                  variant="danger"
                  onPress={() => handleReject(completion.id)}
                  className="flex-1 h-11"
                />
              </View>
            </Card>
          );
        })}
        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}
```

**Step 2: Commit**

```bash
git add .
git commit -m "feat: add approval queue screen"
```

---

## Task 17: Transaction History & CSV Export

**Files:**
- Create: `app/(shared)/history/[childId].tsx`
- Create: `services/csv.ts`

**Step 1: Create `services/csv.ts`**

```ts
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

export async function exportTransactionsCSV(
  transactions: any[],
  childName: string,
  currency: string,
  rewardMode: string,
  rewardEmoji: string,
): Promise<void> {
  const unit = rewardMode === 'emoji' ? rewardEmoji : currency;
  const rows = [
    ['Date', 'Description', `Amount (${unit})`, 'Type', 'Balance'],
    ...transactions.map((tx, i) => {
      const runningBalance = transactions
        .slice(0, i + 1)
        .reduce((sum, t) => sum + (t.type === 'deducted' ? -t.amount : t.amount), 0);
      return [
        new Date(tx.createdAt?.toDate?.() ?? tx.createdAt).toLocaleDateString('en-AU'),
        tx.description,
        tx.amount.toFixed(rewardMode === 'emoji' ? 0 : 2),
        tx.type,
        runningBalance.toFixed(rewardMode === 'emoji' ? 0 : 2),
      ];
    }),
  ];

  const csv = rows.map((row) => row.join(',')).join('\n');
  const filename = `${childName.replace(/\s/g, '_')}_transactions.csv`;
  const path = FileSystem.documentDirectory + filename;
  await FileSystem.writeAsStringAsync(path, csv, { encoding: FileSystem.EncodingType.UTF8 });
  await Sharing.shareAsync(path, { mimeType: 'text/csv', dialogTitle: `Export ${childName}'s transactions` });
}
```

**Step 2: Create `app/(shared)/history/[childId].tsx`**

```tsx
import { useEffect, useState } from 'react';
import { View, FlatList, SafeAreaView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '@/services/firebase';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useFamilyStore } from '@/stores/familyStore';
import { formatReward } from '@/utils/formatReward';
import { exportTransactionsCSV } from '@/services/csv';

export default function TransactionHistory() {
  const { childId } = useLocalSearchParams<{ childId: string }>();
  const { family, children } = useFamilyStore();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const child = children.find((c) => c.id === childId);

  useEffect(() => {
    if (!family || !childId) return;
    getDocs(
      query(
        collection(db, 'families', family.id, 'transactions'),
        orderBy('createdAt', 'desc')
      )
    ).then((snap) => {
      setTransactions(
        snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((t: any) => t.childId === childId)
      );
      setLoading(false);
    });
  }, [family, childId]);

  const typeColors: Record<string, string> = {
    earned: 'text-green-600',
    deducted: 'text-red-500',
    manual: 'text-blue-500',
    goal_reached: 'text-purple-500',
  };

  async function handleExport() {
    if (!child) return;
    await exportTransactionsCSV(transactions, child.name, family!.currency, child.rewardMode, child.rewardEmoji);
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-row items-center px-5 py-5">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <Text className="text-primary">← Back</Text>
        </TouchableOpacity>
        <Text variant="h2" className="flex-1">{child?.name}'s History</Text>
        <Button title="Export CSV" variant="ghost" onPress={handleExport} className="h-9" />
      </View>

      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 20 }}
        renderItem={({ item }) => (
          <Card className="mb-2 flex-row items-center justify-between">
            <View className="flex-1">
              <Text variant="label">{item.description}</Text>
              <Text variant="caption">
                {item.createdAt?.toDate?.()?.toLocaleDateString('en-AU') ?? '—'}
              </Text>
            </View>
            <Text className={`font-bold text-base ${typeColors[item.type] ?? 'text-gray-700'}`}>
              {item.type === 'deducted' ? '−' : '+'}
              {child ? formatReward(child, item.amount, family?.currency ?? 'AUD') : item.amount}
            </Text>
          </Card>
        )}
        ListEmptyComponent={
          <Text variant="caption" className="text-center mt-16">No transactions yet.</Text>
        }
      />
    </SafeAreaView>
  );
}
```

**Step 3: Commit**

```bash
git add .
git commit -m "feat: add transaction history with CSV export"
```

---

## Task 18: Settings Screen

**Files:**
- Create: `app/(parent)/settings.tsx`

**Step 1: Create `app/(parent)/settings.tsx`**

```tsx
import { useState } from 'react';
import { View, ScrollView, SafeAreaView, Switch, Alert, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/services/firebase';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useFamilyStore } from '@/stores/familyStore';
import { useAuthStore } from '@/stores/authStore';
import { signOutUser } from '@/services/auth';
import { generateJoinCode, joinFamily, generateKidDeviceCode } from '@/services/firestore';
import { restorePurchases } from '@/services/iap';
import { stopSync } from '@/services/sync';

const CURRENCIES = ['AUD', 'USD', 'GBP', 'CAD', 'NZD', 'EUR', 'JPY', 'SGD'];

export default function Settings() {
  const { family, children } = useFamilyStore();
  const { uid } = useAuthStore();
  const [joinCode, setJoinCode] = useState<string | null>(null);
  const [kidCode, setKidCode] = useState<string | null>(null);

  if (!family) return null;

  const isApprovalMode = family.verificationMode === 'approval';

  async function toggleVerificationMode() {
    const next = isApprovalMode ? 'self' : 'approval';
    await updateDoc(doc(db, 'families', family!.id), { verificationMode: next });
  }

  async function handleGenerateJoinCode() {
    const code = await generateJoinCode(family!.id);
    setJoinCode(code);
    Alert.alert('Family Join Code', `Share this code with the second parent:\n\n${code}\n\n(Expires in 24 hours)`);
  }

  async function handleGenerateKidCode(childId: string) {
    const code = await generateKidDeviceCode(family!.id, childId);
    setKidCode(code);
    Alert.alert('Kid Device Code', `Enter this code on the child\'s device:\n\n${code}\n\n(Expires in 10 minutes)`);
  }

  async function handleSignOut() {
    Alert.alert('Sign Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: async () => {
        stopSync();
        await signOutUser();
      }},
    ]);
  }

  async function handleRestorePurchases() {
    const tier = await restorePurchases(family!.id);
    if (tier) {
      Alert.alert('Restored', `Your ${tier} purchase has been restored.`);
    } else {
      Alert.alert('Nothing to restore', 'No previous purchases found.');
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1 px-5">
        <View className="flex-row items-center py-5">
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <Text className="text-primary">← Back</Text>
          </TouchableOpacity>
          <Text variant="h2">Settings</Text>
        </View>

        {/* Verification mode */}
        <Text variant="label" className="mb-2 ml-1">Chore Verification</Text>
        <Card className="mb-5 flex-row items-center justify-between">
          <View className="flex-1 mr-4">
            <Text variant="label">{isApprovalMode ? '✅ Parent Approval' : '🟢 Self-Complete'}</Text>
            <Text variant="caption">
              {isApprovalMode ? 'You approve before balance updates' : 'Balance updates instantly on completion'}
            </Text>
          </View>
          <Switch
            value={isApprovalMode}
            onValueChange={toggleVerificationMode}
            trackColor={{ true: '#6366F1' }}
          />
        </Card>

        {/* Currency */}
        <Text variant="label" className="mb-2 ml-1">Currency</Text>
        <View className="flex-row flex-wrap mb-5">
          {CURRENCIES.map((c) => (
            <TouchableOpacity
              key={c}
              onPress={() => updateDoc(doc(db, 'families', family.id), { currency: c })}
              className={`px-4 h-10 rounded-full mr-2 mb-2 items-center justify-center border ${family.currency === c ? 'border-primary bg-indigo-50' : 'border-gray-200 bg-white'}`}
            >
              <Text variant="caption" className={family.currency === c ? 'text-primary font-semibold' : ''}>{c}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Devices */}
        <Text variant="label" className="mb-2 ml-1">Family Devices</Text>
        <Card className="mb-5">
          <Button title="Share Family Access (Join Code)" variant="secondary" onPress={handleGenerateJoinCode} className="mb-3 h-11" />
          <Text variant="label" className="mb-3 mt-1">Kid Devices</Text>
          {children.map((child) => (
            <TouchableOpacity
              key={child.id}
              onPress={() => handleGenerateKidCode(child.id)}
              className="flex-row items-center py-3 border-b border-gray-100"
            >
              <Text className="mr-2">{child.avatarEmoji}</Text>
              <Text variant="body" className="flex-1">{child.name}</Text>
              <Text variant="caption" className="text-primary">+ Add device</Text>
            </TouchableOpacity>
          ))}
        </Card>

        {/* Account */}
        <Text variant="label" className="mb-2 ml-1">Account</Text>
        <Card className="mb-8">
          <Button title="Restore Purchases" variant="secondary" onPress={handleRestorePurchases} className="mb-3 h-11" />
          <Button title="Sign Out" variant="danger" onPress={handleSignOut} className="h-11" />
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
```

**Step 2: Commit**

```bash
git add .
git commit -m "feat: add settings screen with verification mode, currency, devices, sign out"
```

---

## Task 19: Push Notifications

**Files:**
- Create: `services/notifications.ts`
- Modify: `app/_layout.tsx` (register for notifications on login)

**Step 1: Create `services/notifications.ts`**

```ts
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/services/firebase';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function registerForPushNotifications(uid: string): Promise<void> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') return;

  const token = (await Notifications.getExpoPushTokenAsync()).data;
  await updateDoc(doc(db, 'users', uid), { pushToken: token });
}

export async function scheduleDailyChoreReminder(childName: string, hour: number, minute: number): Promise<string> {
  return Notifications.scheduleNotificationAsync({
    content: {
      title: `${childName}'s chores`,
      body: "Don't forget your chores today! 📋",
    },
    trigger: { hour, minute, repeats: true },
  });
}

export async function scheduleParentDailySummary(hour = 19, minute = 0): Promise<string> {
  return Notifications.scheduleNotificationAsync({
    content: {
      title: 'Daily chore summary',
      body: 'Tap to see how everyone did today.',
    },
    trigger: { hour, minute, repeats: true },
  });
}

export async function sendLocalApprovalNotification(choreName: string, childName: string): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: `${childName} finished a chore!`,
      body: `"${choreName}" is waiting for your approval. ✅`,
    },
    trigger: null, // immediate
  });
}

export async function sendLocalCelebrationNotification(choreName: string): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Chore approved! 🎉',
      body: `"${choreName}" was approved. Your balance has been updated!`,
    },
    trigger: null,
  });
}
```

**Step 2: Add notification registration to `app/_layout.tsx`**

Add inside the `onAuthStateChanged` callback after `setAuth`:
```ts
import { registerForPushNotifications } from '@/services/notifications';
// After setAuth(...):
registerForPushNotifications(user.uid).catch(console.error);
```

**Step 3: Commit**

```bash
git add .
git commit -m "feat: add push notification service with scheduling"
```

---

## Task 20: EAS Build Configuration

**Files:**
- Create: `eas.json`
- Modify: `app.json` (add Google Sign-In config)
- Create: `.gitignore` additions

**Step 1: Create `eas.json`**

```json
{
  "cli": {
    "version": ">= 7.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "simulator": false
      }
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "buildConfiguration": "Release"
      }
    },
    "production": {
      "ios": {
        "buildConfiguration": "Release"
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "YOUR_APPLE_ID@email.com",
        "ascAppId": "YOUR_APP_STORE_CONNECT_APP_ID",
        "appleTeamId": "YOUR_APPLE_TEAM_ID"
      }
    }
  }
}
```

**Step 2: Add Google Sign-In reversed client ID to `app.json`**

In the `ios` section of `app.json`, add:
```json
"googleServicesFile": "./GoogleService-Info.plist",
"infoPlist": {
  "UIBackgroundModes": ["remote-notification"],
  "CFBundleURLTypes": [
    {
      "CFBundleURLSchemes": ["YOUR_REVERSED_CLIENT_ID_FROM_GoogleService-Info.plist"]
    }
  ]
}
```
The `REVERSED_CLIENT_ID` is in `GoogleService-Info.plist` under the `REVERSED_CLIENT_ID` key.

**Step 3: Update `.gitignore`**

```
node_modules/
.expo/
dist/
.env.local
*.orig.*
GoogleService-Info.plist
google-services.json
```

**Step 4: Run first EAS Dev Client build**

```bash
eas build --platform ios --profile development
```
This will:
1. Ask you to link to your Expo account
2. Ask for your Apple Developer credentials to create provisioning profiles
3. Build the app in EAS cloud (~15 minutes)
4. Provide a QR code to install on your iPhone via TestFlight or direct install

**Step 5: Install on iPhone and test**

Scan the QR code from EAS dashboard → install the development build on your iPhone.
Open the app → you should see the paywall screen.

**Step 6: Commit**

```bash
git add eas.json app.json .gitignore
git commit -m "feat: add EAS Build configuration for dev/preview/production"
```

---

## Task 21: SQLite Offline Cache

**Files:**
- Create: `services/database.ts`

**Step 1: Create `services/database.ts`**

```ts
import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('chorely.db');

export function initDatabase(): void {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS families (
      id TEXT PRIMARY KEY,
      data TEXT NOT NULL,
      updatedAt INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS children (
      id TEXT PRIMARY KEY,
      familyId TEXT NOT NULL,
      data TEXT NOT NULL,
      updatedAt INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS chores (
      id TEXT PRIMARY KEY,
      familyId TEXT NOT NULL,
      data TEXT NOT NULL,
      updatedAt INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS completions (
      id TEXT PRIMARY KEY,
      familyId TEXT NOT NULL,
      data TEXT NOT NULL,
      updatedAt INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS pending_writes (
      id TEXT PRIMARY KEY,
      collection TEXT NOT NULL,
      docId TEXT NOT NULL,
      operation TEXT NOT NULL,
      data TEXT,
      createdAt INTEGER NOT NULL
    );
  `);
}

export function cacheDocument(table: string, id: string, familyId: string, data: any): void {
  db.runSync(
    `INSERT OR REPLACE INTO ${table} (id, familyId, data, updatedAt) VALUES (?, ?, ?, ?)`,
    [id, familyId, JSON.stringify(data), Date.now()]
  );
}

export function getCachedCollection(table: string, familyId: string): any[] {
  const rows = db.getAllSync(
    `SELECT data FROM ${table} WHERE familyId = ?`,
    [familyId]
  );
  return rows.map((r: any) => JSON.parse(r.data));
}

export function queueWrite(collection: string, docId: string, operation: 'set' | 'update' | 'delete', data?: any): void {
  db.runSync(
    `INSERT INTO pending_writes (id, collection, docId, operation, data, createdAt) VALUES (?, ?, ?, ?, ?, ?)`,
    [
      `${Date.now()}_${Math.random()}`,
      collection,
      docId,
      operation,
      data ? JSON.stringify(data) : null,
      Date.now(),
    ]
  );
}

export function getPendingWrites(): any[] {
  return db.getAllSync('SELECT * FROM pending_writes ORDER BY createdAt ASC', []);
}

export function deletePendingWrite(id: string): void {
  db.runSync('DELETE FROM pending_writes WHERE id = ?', [id]);
}
```

**Step 2: Initialize database in `app/_layout.tsx`**

Add to imports:
```ts
import { initDatabase } from '@/services/database';
```

Add before the `return` statement in `RootLayout`:
```ts
useEffect(() => {
  initDatabase();
}, []);
```

**Step 3: Commit**

```bash
git add .
git commit -m "feat: add SQLite offline cache with pending writes queue"
```

---

## Task 22: Final Polish & "I'm a Kid" Flow

**Files:**
- Create: `app/(auth)/kid-entry.tsx`
- Modify: `app/(auth)/paywall.tsx` (add "I'm a kid" link)

**Step 1: Create `app/(auth)/kid-entry.tsx`**

```tsx
import { useState } from 'react';
import { View, TextInput, SafeAreaView, Alert, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { signInAnonymously } from 'firebase/auth';
import { auth } from '@/services/firebase';
import { redeemKidCode, linkKidDevice } from '@/services/firestore';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';

export default function KidEntry() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleRedeem() {
    if (code.length !== 6) return;
    setLoading(true);
    try {
      // Sign in anonymously (no Apple/Google needed for kid devices)
      const { user } = await signInAnonymously(auth);
      await redeemKidCode(user.uid, code);
      // onAuthStateChanged will detect role='kid' and redirect to kid view
    } catch (e: any) {
      Alert.alert('Invalid code', e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 px-8 justify-center">
        <TouchableOpacity onPress={() => router.back()} className="absolute top-16 left-8">
          <Text className="text-primary">← Back</Text>
        </TouchableOpacity>

        <Text className="text-6xl text-center mb-6">👋</Text>
        <Text variant="h1" className="text-center mb-2">Hi there!</Text>
        <Text variant="body" className="text-center text-gray-500 mb-10">
          Ask Mum or Dad for your 6-digit code
        </Text>

        <TextInput
          className="border-2 border-gray-200 rounded-2xl px-4 h-16 text-center text-3xl font-bold tracking-widest mb-6"
          placeholder="000000"
          value={code}
          onChangeText={(t) => setCode(t.replace(/\D/g, '').slice(0, 6))}
          keyboardType="number-pad"
          maxLength={6}
        />

        <Button
          title="Let me in! 🚀"
          onPress={handleRedeem}
          loading={loading}
          disabled={code.length !== 6}
        />
      </View>
    </SafeAreaView>
  );
}
```

**Step 2: Add "I'm a kid" button to `app/(auth)/paywall.tsx`**

Add before the closing `</ScrollView>` in paywall:
```tsx
<TouchableOpacity
  onPress={() => router.push('/(auth)/kid-entry')}
  className="py-4 items-center"
>
  <Text variant="caption" className="text-primary">I'm a kid — enter device code</Text>
</TouchableOpacity>
```

**Step 3: Run all tests**

```bash
npx jest --passWithNoTests
```
Expected: All tests pass.

**Step 4: Final commit**

```bash
git add .
git commit -m "feat: add kid device entry screen and complete full app implementation"
```

---

## Running the App

```bash
# First time: build EAS Dev Client
eas build --platform ios --profile development
# Install on iPhone via QR code from EAS dashboard

# Subsequent runs: start dev server
npx expo start --dev-client

# Run tests
npx jest

# Build for TestFlight (beta)
eas build --platform ios --profile preview

# Submit to App Store
eas build --platform ios --profile production
eas submit --platform ios
```

---

## App Store Checklist (before submission)

- [ ] Replace placeholder `assets/icon.png` with 1024×1024 Chorely icon
- [ ] Replace `assets/splash.png` with branded splash screen
- [ ] Add `assets/notification-icon.png` (96×96 white icon on transparent)
- [ ] Download confetti Lottie from LottieFiles → `assets/animations/celebration.json`
- [ ] Fill in `eas.json` submit section (appleId, ascAppId, appleTeamId)
- [ ] Create 3 IAP products in App Store Connect: `com.chorely.starter`, `com.chorely.family`, `com.chorely.unlimited`
- [ ] Enable Sign in with Apple capability in App Store Connect → App ID
- [ ] Take 3+ screenshots at iPhone 6.7" (1290×2796px) for App Store listing
- [ ] Fill in App Store description using Section 13 from the build plan doc
