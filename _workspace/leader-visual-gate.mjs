import { chromium } from '@playwright/test';

const BASE = 'http://localhost:3111';
const SHOT = '/Users/jurepi/Work/Jurepi-Company/Jurepi.kr-transparent-background/_workspace/shots';
import { mkdirSync } from 'fs';
mkdirSync(SHOT, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1024, height: 900 } });
const consoleErrors = [];
page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });

// Generate a white-bg PNG with a red square via a scratch canvas
await page.goto(`${BASE}/ko/tools/transparent-background`, { waitUntil: 'networkidle' });
const pngB64 = await page.evaluate(() => {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 256;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, 256, 256);
  ctx.fillStyle = '#e11d48'; ctx.fillRect(64, 64, 128, 128);
  return c.toDataURL('image/png').split(',')[1];
});
const buf = Buffer.from(pngB64, 'base64');

await page.screenshot({ path: `${SHOT}/01-ko-initial.png`, fullPage: false });

// Upload
await page.locator('input[type="file"]').setInputFiles({ name: 'white-red.png', mimeType: 'image/png', buffer: buf });
await page.waitForTimeout(800);
await page.screenshot({ path: `${SHOT}/02-ko-after-upload.png`, fullPage: false });

// Preview canvas alpha check: corner pixel should be transparent (alpha 0), center opaque
const alphaCheck = await page.evaluate(() => {
  const canvases = Array.from(document.querySelectorAll('canvas'));
  if (!canvases.length) return { error: 'no canvas' };
  const c = canvases[canvases.length - 1];
  const ctx = c.getContext('2d');
  const corner = ctx.getImageData(2, 2, 1, 1).data;
  const center = ctx.getImageData(Math.floor(c.width / 2), Math.floor(c.height / 2), 1, 1).data;
  return { w: c.width, h: c.height, cornerAlpha: corner[3], centerAlpha: center[3], centerRGB: [center[0], center[1], center[2]] };
});
console.log('ALPHA_CHECK:', JSON.stringify(alphaCheck));

// Download button enabled + download fires
const dlBtn = page.getByRole('button', { name: /PNG 다운로드/ });
console.log('DL_ENABLED:', await dlBtn.isEnabled());
const dlPromise = page.waitForEvent('download', { timeout: 5000 }).catch(() => null);
await dlBtn.click();
const dl = await dlPromise;
console.log('DOWNLOAD:', dl ? dl.suggestedFilename() : 'NONE');
await page.screenshot({ path: `${SHOT}/03-ko-done.png`, fullPage: false });

// Full page scroll for SEO sections
await page.screenshot({ path: `${SHOT}/04-ko-fullpage.png`, fullPage: true });

// 320px viewport overflow check
await page.setViewportSize({ width: 320, height: 800 });
await page.waitForTimeout(300);
const overflow = await page.evaluate(() => document.documentElement.scrollWidth);
console.log('SCROLL_WIDTH_320:', overflow);
await page.screenshot({ path: `${SHOT}/05-ko-320.png`, fullPage: true });

// EN locale
await page.setViewportSize({ width: 1024, height: 900 });
await page.goto(`${BASE}/en/tools/transparent-background`, { waitUntil: 'networkidle' });
await page.locator('input[type="file"]').setInputFiles({ name: 'white-red.png', mimeType: 'image/png', buffer: buf });
await page.waitForTimeout(800);
await page.screenshot({ path: `${SHOT}/06-en-after-upload.png`, fullPage: true });

// Korean leakage in EN main
const koLeak = await page.evaluate(() => {
  const main = document.querySelector('main');
  const text = main ? main.textContent : '';
  const m = text.match(/[가-힣]+/g);
  return m ? m.slice(0, 10) : [];
});
console.log('KO_LEAK_EN:', JSON.stringify(koLeak));

console.log('CONSOLE_ERRORS:', JSON.stringify(consoleErrors));
await browser.close();
