# Chorely Rebrand Design — 2026-03-09

## Summary

Full brand refresh from indigo/purple to coral red, matching the approved brand
asset document. Includes color token update, hardcoded hex fixes, new app icon,
and new splash screen. Per-child accent colours (user-personalised) are unchanged.

## Approved approach: B — Tokens + Icon + Splash

---

## 1. Color Tokens (`tailwind.config.js`)

| Token         | Old       | New       | Notes                    |
|---------------|-----------|-----------|--------------------------|
| `primary`     | `#6366F1` | `#FF6B6B` | Brand coral red          |
| `primary-dark`| `#4F46E5` | `#E85555` | Darker coral for pressed |
| `success`     | `#22C55E` | `#4CAF50` | Brand green              |
| `warning`     | `#F59E0B` | `#FFD93D` | Brand reward yellow      |
| `danger`      | `#EF4444` | `#EF4444` | Unchanged                |
| `surface`     | `#F9FAFB` | `#F9FAFB` | Unchanged                |
| `surface-dark`| `#1F2937` | `#1F2937` | Unchanged                |
| `slate`       | *(new)*   | `#334155` | Brand text dark          |
| `reward`      | *(new)*   | `#FFD93D` | Alias for reward accents |

---

## 2. Hardcoded Hex Fixes

Six source files contain inline `#6366F1` / `#4F46E5` color values that bypass
the tailwind token system. Each will be updated to use `#FF6B6B` (or the
`primary` tailwind class where applicable).

Files:
- `components/ui/Button.tsx`
- `app/(kid)/view.tsx` — ActivityIndicator `color` prop
- `app/(shared)/chore-builder.tsx`
- `app/(shared)/history/[childId].tsx`
- `app/(parent)/settings.tsx`
- `app/index.tsx` — demo seed data (ActivityIndicator only; child colours unchanged)

---

## 3. App Icon (`assets/icon.png` — 1024×1024 px)

Generated via a Node.js script (`scripts/generate-assets.mjs`) using `sharp`:

**Composition:**
- Background: coral `#FF6B6B` filled rounded rectangle, corner radius ~205px (20%)
- Checkmark: white polyline scaled to icon, `stroke-width` proportional to 60px
  at 1024px, `stroke-linecap` round, `stroke-linejoin` round
  Points (scaled): `(820,245) → (369,697) → (164,493)`
- Star badge: yellow `#FFD93D` circle (r=120px) at top-right (cx=820, cy=204),
  white 8-point star path inside

The same script generates `assets/adaptive-icon.png` (same composition, no badge).

---

## 4. Splash Screen (`assets/splash.png` — 1242×2688 px)

**Composition:**
- Background: white `#FFFFFF`
- Centered vertically and horizontally:
  - Coral rounded-square icon (300×300) — same as app icon but smaller, no badge
  - Below icon: "Chorely" in `#334155`, bold, ~80px; trailing "." in `#FF6B6B`

---

## 5. `app.json`

No changes required. `splash.backgroundColor` is already `#ffffff`.

---

## Out of Scope

- Per-child `colorTheme` values (`#7C6CF8`, `#F87C6C`) — intentionally unchanged,
  these are user-personalised accent colours
- Dark mode token wiring (deferred to a future session)
- Privacy policy page

---

## Implementation Order

1. Install `sharp` as a dev dependency
2. Write `scripts/generate-assets.mjs` — generates icon + splash
3. Run script → overwrite `assets/icon.png`, `assets/splash.png`,
   `assets/adaptive-icon.png`
4. Update `tailwind.config.js` color tokens
5. Fix hardcoded hex in 6 source files
6. Run `expo prebuild --clean` to regenerate native assets
7. Build + verify in simulator
8. Commit

