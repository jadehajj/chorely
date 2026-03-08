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
  // Icon centered horizontally, placed at top=1144 (center y=1344)
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
