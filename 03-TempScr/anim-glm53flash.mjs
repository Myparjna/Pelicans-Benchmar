// 单条目录帧 + 合成 webp
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const puppeteer = require('C:/Users/mypra/AppData/Roaming/npm/node_modules/puppeteer-core');
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = 'C:/Users/mypra/Desktop/VibeCoding指南/skills测评项目/03-鹈鹕自行车测试';
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const BASE = 'http://127.0.0.1:4173/sites/';
const FFMPEG = 'C:/Users/mypra/Videos/ffmpeg8.1/bin/ffmpeg.exe';

const slug = 'glm-5-3-flash-zhipu';
const FPS = 8, SECONDS = 5, W = 640, H = 360;
const FRAMES = FPS * SECONDS;
const dir = join(ROOT, 'TempFiles', 'anim-frames', slug);
mkdirSync(dir, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--force-color-profile=srgb', '--hide-scrollbars'],
});
const page = await browser.newPage();
try {
  await page.setViewport({ width: W, height: H, deviceScaleFactor: 1 });
  await page.goto(BASE + slug + '.html', { waitUntil: 'load', timeout: 30000 });
  await new Promise(r => setTimeout(r, 1500));
  const t0 = Date.now();
  for (let i = 0; i < FRAMES; i++) {
    await page.screenshot({ path: join(dir, 'f-' + String(i).padStart(2, '0') + '.png') });
    const next = t0 + (i + 1) * (1000 / FPS);
    const wait = next - Date.now();
    if (wait > 0) await new Promise(r => setTimeout(r, wait));
  }
  writeFileSync(join(dir, 'count.txt'), String(FRAMES), 'utf8');
  console.log(`录帧 ${FRAMES} 帧 -> ${dir}`);
} catch (e) {
  console.error('录帧失败:', e.message);
  process.exit(1);
} finally {
  await page.close();
  await browser.close();
}

// 合成 webp
const out = join(ROOT, 'thumbs', slug + '.webp');
try {
  execFileSync(FFMPEG, [
    '-y', '-framerate', '8',
    '-i', join(dir, 'f-%02d.png'),
    '-loop', '0',
    '-vf', 'scale=640:-2',
    '-quality', '65', '-compression_level', '6',
    '-an', out,
  ], { stdio: 'pipe' });
  console.log('OK webp ->', out);
} catch (e) {
  console.error('ffmpeg 失败:', e.message);
  process.exit(2);
}
