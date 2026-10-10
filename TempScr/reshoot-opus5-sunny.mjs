// 重截 opus-5-relay 缩略图：打开修复后的副本 → 点击切到晴天 → 稳定后截图 + 像素统计
import puppeteer from 'puppeteer-core';
import { pathToFileURL } from 'node:url';
import { join } from 'node:path';

const ROOT = 'C:/Users/mypra/Desktop/鹈鹕自行车测试';
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--force-color-profile=srgb', '--hide-scrollbars'],
});
const page = await browser.newPage();
const errors = [];
page.on('pageerror', e => errors.push(e.message));

await page.setViewport({ width: 1280, height: 900, deviceScaleFactor: 1 });
await page.goto(pathToFileURL(join(ROOT, 'sites', 'opus-5-relay.html')).href, { waitUntil: 'load', timeout: 30000 });

// 点击切到晴天（最多 4 次；hud 显示 "☀️ 晴天"）
for (let i = 0; i < 4; i++) {
  const label = await page.evaluate(() => document.getElementById('hud')?.textContent || '');
  if (label.includes('晴')) break;
  await page.evaluate(() => document.getElementById('cv').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })));
  await new Promise(r => setTimeout(r, 600));
}
await new Promise(r => setTimeout(r, 3000)); // 等 FADE 过渡 + 动画稳定

const label = await page.evaluate(() => document.getElementById('hud')?.textContent || '');
const out = join(ROOT, 'thumbs', 'opus-5-relay.png');
await page.screenshot({ path: out, fullPage: true });

// 像素统计（直接分析截图文件）
const p2 = await browser.newPage();
await p2.goto('file:///' + out.replace(/\\/g, '/'), { waitUntil: 'load' });
const stats = await p2.evaluate(() => {
  const img = document.images[0];
  const cv = document.createElement('canvas');
  cv.width = img.naturalWidth; cv.height = img.naturalHeight;
  const ctx = cv.getContext('2d');
  ctx.drawImage(img, 0, 0);
  const d = ctx.getImageData(0, 0, cv.width, cv.height).data;
  let sum = 0, colors = new Set(), nonBlack = 0, n = 0;
  for (let i = 0; i < d.length; i += 4) {
    const r = d[i], g = d[i + 1], b = d[i + 2];
    sum += r + g + b;
    if (n % 97 === 0) colors.add((r >> 4) << 8 | (g >> 4) << 4 | (b >> 4));
    if (r + g + b > 40) nonBlack++;
    n++;
  }
  return {
    w: cv.width, h: cv.height,
    avgBrightness: (sum / (n * 3)).toFixed(0),
    distinctColors: colors.size,
    nonBlackRatio: (nonBlack / n).toFixed(2),
  };
});
await p2.close();

console.log(JSON.stringify({ hudLabel: label, thumb: out, stats, pageErrors: errors }, null, 2));
await browser.close();
