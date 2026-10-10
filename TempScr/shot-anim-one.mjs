// 为指定 slug 列表录制 5 秒动画帧（8fps × 40 帧）
import puppeteer from 'puppeteer-core';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = 'C:/Users/mypra/Desktop/鹈鹕自行车测试';
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const BASE = 'http://127.0.0.1:4173/sites/';
const SLUGS = process.argv.slice(2);

const FPS = 8, SECONDS = 5, W = 640, H = 360;
const FRAMES = FPS * SECONDS;

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--force-color-profile=srgb', '--hide-scrollbars'],
});

for (const slug of SLUGS) {
  const dir = join(ROOT, 'TempFiles', 'anim-frames', slug);
  mkdirSync(dir, { recursive: true });
  const page = await browser.newPage();
  try {
    await page.setViewport({ width: W, height: H, deviceScaleFactor: 1 });
    await page.goto(BASE + slug + '.html', { waitUntil: 'load', timeout: 30000 });
    await new Promise(r => setTimeout(r, 1500));
    const t0 = Date.now();
    for (let i = 0; i < FRAMES; i++) {
      await page.screenshot({ path: join(dir, 'f-' + String(i).padStart(2, '0') + '.png') });
      const wait = t0 + (i + 1) * (1000 / FPS) - Date.now();
      if (wait > 0) await new Promise(r => setTimeout(r, wait));
    }
    writeFileSync(join(dir, 'count.txt'), String(FRAMES), 'utf8');
    console.log(`${slug}: OK ${FRAMES} 帧`);
  } catch (e) {
    console.log(`${slug}: FAIL ${e.message}`);
  } finally {
    await page.close();
  }
}
await browser.close();
