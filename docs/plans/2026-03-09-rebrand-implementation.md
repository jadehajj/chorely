# Chorely Rebrand Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the indigo/purple brand with coral red (`#FF6B6B`), generate a new app icon and splash screen matching the approved brand asset doc.

**Architecture:** Three independent layers — (1) Tailwind color tokens cascade to all 12 component files that use `text-primary`/`bg-primary` automatically; (2) five files with hardcoded hex need manual find-replace; (3) a one-off Node script using `sharp` generates the two PNG assets and is then deleted.

**Tech Stack:** sharp (dev dep, removed after generation), Node ESM script, Tailwind/NativeWind, Expo prebuild

---

## Task 1: Install sharp

**Files:**
- Modify: `package.json` (devDependencies)

**Step 1: Install**

```bash
export NVM_DIR="$HOME/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
cd /Users/jahmm/Documents/Projects/App_Test/Chorely
npm install --save-dev sharp
```

Expected: `added 1 package` (or similar), no errors.

**Step 2: Verify**

```bash
node -e "import('sharp').then(s => console.log('sharp ok:', s.default.versions.sharp))"
```

Expected output: `sharp ok: 0.33.x` (any version)

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: install sharp for asset generation"
```

---

## Task 2: Write the asset generation script

**Files:**
- Create: `scripts/generate-assets.mjs`

**Step 1: Create scripts directory and write the file**

Content of `scripts/generate-assets.mjs`:

```js
/**
 * Generates assets/icon.png (1024×1024) and assets/splash.png (1242×2688).
 * Run once: node scripts/generate-assets.mjs
 * Requires: npm install --save-dev sharp
 */

import sharp from 'sharp';
import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const CORAL   = '#FF6B6B';
const YELLOW  = '#FFD93D';
const SLATE   = '#334155';
const WHITE   = '#FFFFFF';

// ─── Icon SVG (1024×1024, square — iOS applies corner mask itself) ───────────

const ICON_SVG = `
<svg width="1024" height="1024" xmlns="http://www.w3.org/2000/svg">
  <!-- Coral background — no rx, iOS clips to rounded square automatically -->
  <rect width="1024" height="1024" fill="${CORAL}"/>

  <!-- White checkmark (stroke-width 80, caps round) -->
  <polyline
    points="164,493 369,697 820,245"
    stroke="${WHITE}"
    stroke-width="80"
    stroke-linecap="round"
    stroke-linejoin="round"
    fill="none"
  />

  <!-- Star badge: yellow circle at top-right -->
  <circle cx="820" cy="204" r="110" fill="${YELLOW}"/>

  <!-- 4-point star inside badge (scaled from brand SVG) -->
  <path
    d="M820,144 L837,187 L880,204 L837,221 L820,264 L803,221 L760,204 L803,187 Z"
    fill="${WHITE}"
  />
</svg>`.trim();

// ─── Splash SVG (1242×2688, icon centered, no text) ─────────────────────────

const SPLASH_SVG = `
<svg width="1242" height="2688" xmlns="http://www.w3.org/2000/svg">
  <rect width="1242" height="2688" fill="${WHITE}"/>
</svg>`.trim();

async function main() {
  console.log('Generating assets/icon.png …');
  const iconBuf = await sharp(Buffer.from(ICON_SVG))
    .resize(1024, 1024)
    .png()
    .toBuffer();
  writeFileSync(resolve(ROOT, 'assets/icon.png'), iconBuf);
  console.log('  ✓ assets/icon.png (1024×1024)');

  console.log('Generating assets/adaptive-icon.png (no badge) …');
  const ADAPTIVE_SVG = ICON_SVG.replace(
    /<!-- Star badge[\s\S]*?<!-- 4-point star[\s\S]*?Z"\s*fill="[^"]*"\s*\/>/,
    ''
  );
  const adaptiveBuf = await sharp(Buffer.from(ADAPTIVE_SVG))
    .resize(1024, 1024)
    .png()
    .toBuffer();
  writeFileSync(resolve(ROOT, 'assets/adaptive-icon.png'), adaptiveBuf);
  console.log('  ✓ assets/adaptive-icon.png (1024×1024)');

  console.log('Generating assets/splash.png …');
  // Resize icon to 400×400 for splash composite
  const iconSmall = await sharp(iconBuf).resize(400, 400).toBuffer();
  // Icon centered horizontally, placed at y=1044 (center ~1244)
  const splashBuf = await sharp(Buffer.from(SPLASH_SVG))
    .composite([{ input: iconSmall, top: 1144, left: 421 }])
    .resize(1242, 2688)
    .png()
    .toBuffer();
  writeFileSync(resolve(ROOT, 'assets/splash.png'), splashBuf);
  console.log('  ✓ assets/splash.png (1242×2688)');

  console.log('\nDone. Run `npx expo prebuild --clean` to bake into native projects.');
}

main().catch((e) => { console.error(e); process.exit(1); });
```

**Step 2: Commit script**

```bash
git add scripts/generate-assets.mjs
git commit -m "chore: add asset generation script (sharp)"
```

---

## Task 3: Run the script and verify assets

**Step 1: Run**

```bash
export NVM_DIR="$HOME/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
cd /Users/jahmm/Documents/Projects/App_Test/Chorely
node scripts/generate-assets.mjs
```

Expected output:
```
Generating assets/icon.png …
  ✓ assets/icon.png (1024×1024)
Generating assets/adaptive-icon.png (no badge) …
  ✓ assets/adaptive-icon.png (1024×1024)
Generating assets/splash.png …
  ✓ assets/splash.png (1242×2688)

Done. Run `npx expo prebuild --clean` to bake into native projects.
```

**Step 2: Verify dimensions**

```bash
file assets/icon.png assets/adaptive-icon.png assets/splash.png
```

Expected: each line shows correct PNG dimensions.

**Step 3: Visual check** — Read each generated PNG file using the Read tool and confirm:
- `icon.png`: coral background, white checkmark, yellow star top-right
- `adaptive-icon.png`: coral background, white checkmark, no badge
- `splash.png`: white background, small coral icon centered

**Step 4: Commit assets**

```bash
git add assets/icon.png assets/adaptive-icon.png assets/splash.png
git commit -m "feat: new brand icon and splash (coral #FF6B6B)"
```

---

## Task 4: Update color tokens

**Files:**
- Modify: `tailwind.config.js`

**Step 1: Replace the `colors` block**

Replace the entire `colors` section in `theme.extend` with:

```js
colors: {
  primary: '#FF6B6B',
  'primary-dark': '#E85555',
  success: '#4CAF50',
  warning: '#FFD93D',
  danger: '#EF4444',
  surface: '#F9FAFB',
  'surface-dark': '#1F2937',
  slate: '#334155',
  reward: '#FFD93D',
},
```

**Step 2: Verify the file looks correct**

```bash
cat tailwind.config.js
```

**Step 3: Commit**

```bash
git add tailwind.config.js
git commit -m "feat: update brand color tokens to coral #FF6B6B"
```

---

## Task 5: Fix hardcoded hex — Button.tsx

**Files:**
- Modify: `components/ui/Button.tsx:38`

**Step 1: Find the line**

```bash
grep -n "#6366F1\|#4F46E5" components/ui/Button.tsx
```

Expected: line 38 — `color={variant === 'primary' ? 'white' : '#6366F1'}`

**Step 2: Edit**

Change:
```tsx
<ActivityIndicator color={variant === 'primary' ? 'white' : '#6366F1'} />
```
To:
```tsx
<ActivityIndicator color={variant === 'primary' ? 'white' : '#FF6B6B'} />
```

**Step 3: Commit**

```bash
git add components/ui/Button.tsx
git commit -m "fix: update hardcoded primary color in Button ActivityIndicator"
```

---

## Task 6: Fix hardcoded hex — kid view

**Files:**
- Modify: `app/(kid)/view.tsx:106`

**Step 1: Edit**

Change:
```tsx
<ActivityIndicator size="large" color="#6366F1" />
```
To:
```tsx
<ActivityIndicator size="large" color="#FF6B6B" />
```

**Step 2: Commit**

```bash
git add "app/(kid)/view.tsx"
git commit -m "fix: update hardcoded primary color in kid view ActivityIndicator"
```

---

## Task 7: Fix hardcoded hex — chore-builder

**Files:**
- Modify: `app/(shared)/chore-builder.tsx:135`

**Step 1: Edit**

Change:
```tsx
trackColor={{ true: '#6366F1' }}
```
To:
```tsx
trackColor={{ true: '#FF6B6B' }}
```

**Step 2: Commit**

```bash
git add "app/(shared)/chore-builder.tsx"
git commit -m "fix: update hardcoded primary color in chore-builder Switch"
```

---

## Task 8: Fix hardcoded hex — history and settings

**Files:**
- Modify: `app/(shared)/history/[childId].tsx:252`
- Modify: `app/(parent)/settings.tsx:178`

**Step 1: Edit history**

Change:
```tsx
<ActivityIndicator size="large" color="#6366F1" />
```
To:
```tsx
<ActivityIndicator size="large" color="#FF6B6B" />
```

**Step 2: Edit settings**

Change:
```tsx
trackColor={{ false: '#d1d5db', true: '#6366F1' }}
```
To:
```tsx
trackColor={{ false: '#d1d5db', true: '#FF6B6B' }}
```

**Step 3: Commit**

```bash
git add "app/(shared)/history/[childId].tsx" "app/(parent)/settings.tsx"
git commit -m "fix: update hardcoded primary color in history and settings"
```

---

## Task 9: Run expo prebuild to bake icon into native projects

**Step 1: Run prebuild**

```bash
export NVM_DIR="$HOME/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
export PATH="$HOME/.rbenv/bin:$PATH" && eval "$(rbenv init -)"
export LANG=en_US.UTF-8 && export LC_ALL=en_US.UTF-8
cd /Users/jahmm/Documents/Projects/App_Test/Chorely
npx expo prebuild --clean --platform ios 2>&1 | tail -10
```

Expected: ends with `✔ Finished ios prebuild` (or similar success message, no errors about icons).

**Step 2: Commit updated native assets**

```bash
git add ios/
git commit -m "chore: expo prebuild --clean with new brand icon"
```

---

## Task 10: Build and verify in simulator

**Step 1: Build**

```bash
export NVM_DIR="$HOME/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
export PATH="$HOME/.rbenv/bin:$PATH" && eval "$(rbenv init -)"
export LANG=en_US.UTF-8 && export LC_ALL=en_US.UTF-8
cd /Users/jahmm/Documents/Projects/App_Test/Chorely

xcodebuild -workspace ios/Chorely.xcworkspace \
  -scheme Chorely \
  -configuration Debug \
  -sdk iphonesimulator \
  -destination 'platform=iOS Simulator,name=iPhone 17 Pro' \
  CODE_SIGN_IDENTITY="" CODE_SIGNING_REQUIRED=NO CODE_SIGNING_ALLOWED=NO \
  build 2>&1 | tail -3
```

Expected: `** BUILD SUCCEEDED **`

**Step 2: Install and launch**

```bash
xcrun simctl install "C0374F27-17EE-4C6D-A549-F48E9EFAC468" \
  ~/Library/Developer/Xcode/DerivedData/Chorely-egvvsifvmhcbfacilayxhylexjkk/Build/Products/Debug-iphonesimulator/Chorely.app

xcrun simctl launch "C0374F27-17EE-4C6D-A549-F48E9EFAC468" com.jadehajj.chorely
sleep 6
xcrun simctl io "C0374F27-17EE-4C6D-A549-F48E9EFAC468" screenshot /tmp/rebrand_check.png
```

**Step 3: Visual check** — Read `/tmp/rebrand_check.png` and confirm coral red primary color throughout UI (buttons, toggles, ActivityIndicators).

---

## Task 11: Cleanup

**Step 1: Uninstall sharp (no longer needed at runtime)**

```bash
export NVM_DIR="$HOME/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
cd /Users/jahmm/Documents/Projects/App_Test/Chorely
npm uninstall sharp
```

**Step 2: Commit cleanup**

```bash
git add package.json package-lock.json
git commit -m "chore: remove sharp after asset generation"
```

---

## Done ✓

After Task 11, all primary brand colors are `#FF6B6B`, the app icon shows the coral checkmark with yellow star badge, and the splash shows the coral icon on white. The per-child accent colors (`#7C6CF8`, `#F87C6C`) are unchanged.
