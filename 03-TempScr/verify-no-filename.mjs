// 验证 .card-file 不可见但 DOM 仍存在
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const puppeteer = require('C:/Users/mypra/AppData/Roaming/npm/node_modules/puppeteer-core');

const BASE = process.argv[2] || 'http://127.0.0.1:4173/index.html';
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const OUT = 'C:/Users/mypra/Desktop/VibeCoding指南/skills测评项目/03-鹈鹕自行车测试/TempFiles';

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
});
const page = await browser.newPage();
const errors = [];
page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)\.com/.test(m.location()?.url || '')) errors.push(m.text()); });
page.on('pageerror', e => errors.push(e.message));
await page.setViewport({ width: 1280, height: 900 });
await page.goto(BASE, { waitUntil: 'networkidle2', timeout: 30000 });
await new Promise(r => setTimeout(r, 1000));

const info = await page.$$eval('.site-card', els => {
  const r = { total: els.length, hiddenCount: 0, visibleCount: 0, samples: [] };
  els.forEach(el => {
    const f = el.querySelector('.card-file');
    if (!f) return;
    const cs = getComputedStyle(f);
    if (cs.display === 'none') r.hiddenCount++;
    else r.visibleCount++;
    if (r.samples.length < 3) r.samples.push({
      slug: el.dataset.slug,
      text: f.textContent?.trim(),
      display: cs.display,
    });
  });
  return r;
});

await page.evaluate(() => document.querySelector('.site-card')?.scrollIntoView({ block: 'start' }));
await new Promise(r => setTimeout(r, 300));
await page.screenshot({ path: `${OUT}/no-filename-desktop.png` });
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
await new Promise(r => setTimeout(r, 600));
await page.screenshot({ path: `${OUT}/no-filename-mobile.png`, fullPage: true });

console.log(JSON.stringify({ base: BASE, info, errors }, null, 2));
await browser.close();
process.exitCode = (info.hiddenCount !== 32 || info.visibleCount !== 0 || errors.length > 0) ? 2 : 0;
