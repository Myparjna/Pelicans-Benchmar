// 两条新站点：运行时探针 + 静态 PNG 缩略图 + 40 帧录帧合成 webp
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const puppeteer = require('C:/Users/mypra/AppData/Roaming/npm/node_modules/puppeteer-core');
import { execFileSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = 'C:/Users/mypra/Desktop/VibeCoding指南/skills测评项目/03-鹈鹕自行车测试';
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const BASE = 'http://127.0.0.1:4173/sites/';
const FFMPEG = 'C:/Users/mypra/Videos/ffmpeg8.1/bin/ffmpeg.exe';
const SLUGS = ['gpt-6', 'gemini-3-8'];
const FPS = 8, SECONDS = 5, W = 640, H = 360;
const FRAMES = FPS * SECONDS;

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--force-color-profile=srgb', '--hide-scrollbars'],
});

let hadError = false;
for (const slug of SLUGS) {
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  page.on('requestfailed', r => {
    const u = r.url();
    if (!/fonts\.googleapis|fonts\.gstatic|favicon/.test(u)) errors.push('reqfail: ' + u);
  });
  try {
    // 静态 PNG（1280×900 fullPage）
    await page.setViewport({ width: 1280, height: 900, deviceScaleFactor: 1 });
    await page.goto(BASE + slug + '.html', { waitUntil: 'load', timeout: 30000 });
    await new Promise(r => setTimeout(r, 3500));
    const png = join(ROOT, 'thumbs', slug + '.png');
    await page.screenshot({ path: png, fullPage: true });
    console.log('PNG OK:', png);

    // 录帧 webp（640×360）
    await page.setViewport({ width: W, height: H, deviceScaleFactor: 1 });
    await page.reload({ waitUntil: 'load' });
    await new Promise(r => setTimeout(r, 1500));
    const dir = join(ROOT, 'TempFiles', 'anim-frames', slug);
    mkdirSync(dir, { recursive: true });
    const t0 = Date.now();
    for (let i = 0; i < FRAMES; i++) {
      await page.screenshot({ path: join(dir, 'f-' + String(i).padStart(2, '0') + '.png') });
      const wait = t0 + (i + 1) * (1000 / FPS) - Date.now();
      if (wait > 0) await new Promise(r => setTimeout(r, wait));
    }
    const webp = join(ROOT, 'thumbs', slug + '.webp');
    execFileSync(FFMPEG, ['-y', '-framerate', '8', '-i', join(dir, 'f-%02d.png'),
      '-loop', '0', '-vf', 'scale=640:-2', '-quality', '65', '-compression_level', '6', '-an', webp],
      { stdio: 'pipe' });
    console.log('WEBP OK:', webp);
  } catch (e) {
    errors.push('fatal: ' + e.message);
  }
  // 过滤外网字体噪音后的报错
  const real = errors.filter(e => !/net::ERR_(NAME_NOT_RESOLVED|TIMED_OUT).*(googleapis|gstatic)/i.test(e));
  if (real.length) { hadError = true; console.log(`[${slug}] 报错:\n  ` + real.join('\n  ')); }
  else console.log(`[${slug}] 无运行时错误`);
  await page.close();
}
await browser.close();
process.exit(hadError ? 2 : 0);
