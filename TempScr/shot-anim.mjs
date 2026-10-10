// 录制 27 个站点各 5 秒动画帧（8fps × 40 帧，640x360 PNG）到 TempFiles/anim-frames/<slug>/
import puppeteer from 'puppeteer-core';
import { readFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = 'C:/Users/mypra/Desktop/鹈鹕自行车测试';
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const BASE = 'http://127.0.0.1:4173/sites/';

const src = readFileSync(join(ROOT, 'sites-data.js'), 'utf8');
const sites = JSON.parse(src.slice(src.indexOf('['), src.lastIndexOf(']') + 1));

const FPS = 8, SECONDS = 5, W = 640, H = 360;
const FRAMES = FPS * SECONDS;

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--force-color-profile=srgb', '--hide-scrollbars'],
});

const results = [];
for (const s of sites) {
  const dir = join(ROOT, 'TempFiles', 'anim-frames', s.slug);
  if (existsSync(dir)) {
    const n = (() => { try { return readFileSync(join(dir, 'count.txt'), 'utf8').trim(); } catch { return '?'; } })();
    if (n == FRAMES) { results.push(`${s.slug}: 已存在跳过`); continue; }
  }
  mkdirSync(dir, { recursive: true });
  const page = await browser.newPage();
  try {
    await page.setViewport({ width: W, height: H, deviceScaleFactor: 1 });
    await page.goto(BASE + s.slug + '.html', { waitUntil: 'load', timeout: 30000 });
    await new Promise(r => setTimeout(r, 1500)); // 等动画/字体就绪
    const t0 = Date.now();
    for (let i = 0; i < FRAMES; i++) {
      await page.screenshot({ path: join(dir, 'f-' + String(i).padStart(2, '0') + '.png') });
      // 按 8fps 节奏推进（截图耗时也算在帧间隔内）
      const next = t0 + (i + 1) * (1000 / FPS);
      const wait = next - Date.now();
      if (wait > 0) await new Promise(r => setTimeout(r, wait));
    }
    writeCount(dir);
    results.push(`${s.slug}: OK ${FRAMES} 帧`);
  } catch (e) {
    results.push(`${s.slug}: FAIL ${e.message}`);
  } finally {
    await page.close();
  }
}
function writeCount(dir) {
  const { writeFileSync } = require('node:fs');
  writeFileSync(join(dir, 'count.txt'), String(FRAMES), 'utf8');
}

console.log(results.join('\n'));
console.log(`完成 ${results.filter(r => r.includes('OK') || r.includes('跳过')).length}/${sites.length}`);
await browser.close();
