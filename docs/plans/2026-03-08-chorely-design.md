# Chorely — Design Document
**Date:** 2026-03-08
**Status:** Approved
**Bundle ID:** `com.chorely.app`
**App Name:** Chorely — Chores & Pocket Money

---

## 1. Overview

Chorely is a kids chore and pocket money tracker for families. One-time purchase (3 tiers), iCloud-style real-time sync via Firebase, Sign in with Apple + Google. No bank account, no subscription, no backend server beyond Firebase.

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| Framework | React Native + Expo (managed workflow) |
| Navigation | Expo Router (file-based) |
| State | Zustand |
| Auth | Firebase Auth (Apple + Google) |
| Database | Firebase Firestore (real-time sync) |
| File storage | Firebase Storage (chore photos) |
| Local cache | expo-sqlite (offline-first) |
| IAP | react-native-iap (3 non-consumable tiers) |
| Notifications | expo-notifications + APNs |
| Animations | React Native Reanimated + Lottie |
| Styling | NativeWind (Tailwind for React Native) |
| Build | EAS Build + EAS Dev Client |

---

## 3. Project Structure

```
chorely/
  app/
    (auth)/
      paywall.tsx         # Tier selection, first launch
      sign-in.tsx         # Apple + Google sign-in
      onboarding.tsx      # 4-step wizard
    (parent)/
      dashboard.tsx       # All children overview
      child/[id].tsx      # Child detail
      settings.tsx        # App settings
    (kid)/
      view.tsx            # Kid-locked interface
    (shared)/
      chore-builder.tsx   # Create/edit chores
      approval-queue.tsx  # Pending completions
      history/[childId].tsx  # Transaction ledger
  components/             # Reusable UI components
  stores/                 # Zustand stores
    auth.ts
    family.ts
    chores.ts
    completions.ts
  services/               # Firebase, IAP, notification logic
    firebase.ts
    iap.ts
    notifications.ts
    sync.ts
  hooks/                  # Custom hooks
  utils/
    formatReward.ts       # Central reward display utility
  constants/
    theme.ts
    tiers.ts
```

---

## 4. Firestore Data Model

```
families/{familyId}
  name: string
  joinCode: string              # e.g. "CHORELY-4829" (24hr expiry)
  verificationMode: "self" | "approval"
  currency: string              # "AUD", "USD", "GBP", etc.
  tierProductId: string         # "com.chorely.starter" | ".family" | ".unlimited"
  parentIds: string[]           # Firebase Auth UIDs
  createdAt: timestamp

families/{familyId}/children/{childId}
  name: string
  avatarEmoji: string
  colorTheme: string            # hex
  rewardMode: "money" | "emoji"
  rewardEmoji: string           # only if rewardMode = "emoji"
  balance: number
  linkedDeviceId: string | null

families/{familyId}/chores/{choreId}
  name: string
  iconEmoji: string
  schedule: "daily" | "weekly" | "once" | string[]  # string[] = specific days
  value: number
  assignedChildId: string
  requiresApproval: boolean
  isActive: boolean

families/{familyId}/completions/{completionId}
  choreId: string
  childId: string
  status: "pending" | "approved" | "rejected"
  photoUrl: string | null
  submittedAt: timestamp
  reviewedAt: timestamp | null
  rejectionReason: string | null

families/{familyId}/transactions/{transactionId}
  childId: string
  type: "earned" | "deducted" | "manual" | "goal_reached"
  amount: number
  description: string
  completionId: string | null
  createdAt: timestamp

families/{familyId}/goals/{goalId}
  childId: string
  name: string
  targetAmount: number
  createdAt: timestamp

users/{userId}                  # top-level, one per Auth UID
  familyId: string
  role: "parent" | "kid"
  linkedChildId: string | null
```

**Firestore security rules:**
- Parents: full read/write on their `families/{familyId}` subtree
- Kid devices: read own child doc + write completions only
- `users/{userId}`: readable/writable only by that UID

---

## 5. Screen Flow & Navigation

### Route groups

```
(auth)/    → paywall, sign-in, onboarding
(parent)/  → dashboard, child/[id], settings
(kid)/     → view
(shared)/  → chore-builder, approval-queue, history/[childId]
```

### First launch flow
```
App open
  → Has existing account? → (parent) dashboard
  → New user:
      paywall → purchase → sign-in → onboarding (4 steps) → dashboard 🎉
```

### Onboarding wizard (4 steps)
1. Add first child + choose reward type (Money or Emoji)
2. Add first chore with suggested defaults
3. Choose verification mode (Self-Complete or Parent Approval)
4. Set family name

### Kid device flow
```
App open → "I'm a kid" → enter 6-digit code
  → Permanently locked to (kid)/view for that child
```

### Parent ↔ Kid switching (shared device)
Parent dashboard → "Switch to Kid View" per child → PIN-protected return.

---

## 6. Auth & Multi-Device

### Sign-in
- Firebase Auth handles Apple + Google
- Store Firebase UID only — never email
- New sign-in → create `users/{uid}` → route to paywall
- Returning sign-in → read `users/{uid}` → route to dashboard

### Second parent joining
```
Parent 1: Settings → "Share Family Access"
  → joinCode generated (24hr expiry), stored on family doc

Parent 2: signs in → "Join a Family" → enters code
  → UID added to parentIds[] → sees full family via Firestore listener
```

### Kid device linking
```
Parent: Settings → "Add Kid Device" → select child → 6-digit code (10min expiry)
  → code stored temporarily in Firestore

Kid device: "I'm a kid" → enter code
  → users/{deviceUid} created: role: "kid", linkedChildId set
  → app locked to Kid View
  → code deleted from Firestore
```

### Offline behaviour
- SQLite mirrors Firestore data locally
- Writes go to SQLite first → instant UI → Firestore syncs in background
- Completions queue locally when offline, sync on reconnect
- Firestore's built-in offline persistence handles device-level caching

### Tier enforcement
- `tierProductId` on family doc
- Child limit enforced client-side: Starter (1), Family (3), Unlimited (∞)
- IAP purchase via `react-native-iap` → updates family doc

---

## 7. Verification Modes

### Self-Complete
```
Child taps Done → optional photo → completion (status: "approved")
  → transaction created → balance updated
  → celebration animation
  → parent gets end-of-day summary notification
```

### Parent Approval
```
Child taps Done → optional photo → completion (status: "pending")
  → kid sees "Waiting for Mum/Dad" pulsing badge
  → parent gets immediate push notification

  Approve → balance updated → celebration on kid device
  Reject  → kid notified with reason → chore returns to todo
```

Per-chore `requiresApproval` overrides household setting.

---

## 8. Reward System

### Money Mode
- Balance: `number` (e.g. `12.50`)
- UI: currency symbol from family `currency`
- Chore value: decimal stepper with `$` prefix
- Goal: `"Saving for LEGO — $12.50 of $45.00"`

### Emoji Mode
- Balance: `number` integer (e.g. `23`)
- UI: child's `rewardEmoji` alongside count
- Chore value: integer stepper with emoji prefix
- Goal: `"Movie night — 23 of 50 ⭐"`
- Emoji selection: native iOS emoji picker

### Central utility
`utils/formatReward.ts` — single `formatReward(child, amount)` function used everywhere for display.

Both modes support manual adjustments (add/deduct) from Child Detail.

---

## 9. Notifications

| Trigger | Recipient | Type |
|---|---|---|
| Child submits chore (approval mode) | Parent | Immediate push |
| Parent approves chore | Child device | Immediate push |
| Parent rejects chore | Child device | Immediate push + reason |
| Daily chore reminder | Child device | Scheduled (parent-set time) |
| Daily summary | Parent | Scheduled (evening) |

All scheduling via `expo-notifications`. No Firebase Cloud Messaging needed.

---

## 10. UI Design Direction

- **Style:** Clean, modern, warm — Things 3 / Bear App aesthetic
- **Font:** SF Pro (system) — feels native, no custom font needed
- **Color:** Neutral base; color through child avatars and balance figures
- **Spacing:** Generous; 44pt minimum tap targets (Apple HIG)
- **Kid View:** 80pt+ tap targets, huge balance number, single Done button
- **Dark mode:** Supported via `useColorScheme`
- **Celebration:** Lottie confetti, full-screen overlay, 2 seconds

---

## 11. IAP Tiers

| Product ID | Price | Limits |
|---|---|---|
| `com.chorely.starter` | $4.99 | 2 parents, 1 child |
| `com.chorely.family` | $6.99 | 2 parents, up to 3 children |
| `com.chorely.unlimited` | $9.99 | 2 parents, unlimited children |

- All tiers: full feature set, iCloud-equivalent sync, Sign in with Apple/Google
- Family tier badged "Most Popular" on paywall
- Restore Purchases button required by Apple

---

## 12. Firebase Configuration

- **Project:** `chorely`
- **Bundle ID:** `com.chorely.app`
- **Auth providers:** Apple, Google
- **Firestore:** production mode, region `us-central1` (or `australia-southeast1`)
- **Storage:** enabled for chore photo uploads
- **Config file:** `GoogleService-Info.plist` (iOS)
