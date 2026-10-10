// 验证 cutoff 徽标：每张卡片有 .cutoff-badge，viewer 也显示
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
const badResponses = [];
page.on('console', m => {
  if (m.type() !== 'error') return;
  const loc = m.location();
  if (loc && /fonts\.(googleapis|gstatic)\.com/.test(loc.url || '')) return;
  errors.push('CONSOLE ' + m.text());
});
page.on('pageerror', e => errors.push('PAGEERR ' + e.message));
page.on('requestfailed', r => {
  const u = r.url();
  if (/favicon\.ico$/.test(u)) return;
  if (/fonts\.(googleapis|gstatic)\.com/.test(u)) return;
  errors.push('REQ-FAIL ' + u);
});
page.on('response', r => {
  const u = r.url();
  if (/favicon\.ico$/.test(u)) return;
  if (/fonts\.(googleapis|gstatic)\.com/.test(u)) return;
  if (r.status() >= 400) badResponses.push(r.status() + ' ' + u);
});

await page.setViewport({ width: 1280, height: 900 });
await page.goto(BASE, { waitUntil: 'networkidle2', timeout: 30000 });
await new Promise(r => setTimeout(r, 1200));

const cardCount = await page.$$eval('.site-card', els => els.length);
const stats = await page.$$eval('.site-card', els => {
  const r = { total: els.length, withParams: 0, withCutoff: 0, samples: [] };
  els.forEach(el => {
    const p = el.querySelector('.params-badge')?.textContent?.trim();
    const c = el.querySelector('.cutoff-badge')?.textContent?.trim();
    if (p) r.withParams++;
    if (c) r.withCutoff++;
    if (r.samples.length < 6) r.samples.push({
      slug: el.dataset.slug,
      title: el.querySelector('.card-title')?.textContent?.trim(),
      params: p || '(无)',
      cutoff: c || '(无)',
    });
  });
  return r;
});

const sample = await page.$$eval('.site-card', els => els.slice(0, 3).map(e => e.dataset.slug));
const viewerSeen = {};
for (const slug of sample) {
  const card = await page.$(`.site-card[data-slug="${slug}"]`);
  await card.click();
  await new Promise(r => setTimeout(r, 1200));
  viewerSeen[slug] = await page.evaluate(() => ({
    open: document.body.classList.contains('viewer-open'),
    title: document.getElementById('viewerTitle')?.textContent?.trim(),
    params: document.getElementById('viewerParams')?.textContent?.trim(),
    cutoff: document.getElementById('viewerCutoff')?.textContent?.trim(),
    cutoffVisible: document.getElementById('viewerCutoff')?.style.display !== 'none',
  }));
  await page.evaluate(() => document.getElementById('btnClose').click());
  await new Promise(r => setTimeout(r, 400));
}

await page.screenshot({ path: `${OUT}/cutoff-desktop.png`, fullPage: true });
await page.evaluate(() => document.querySelector('.site-card')?.scrollIntoView({ block: 'start' }));
await new Promise(r => setTimeout(r, 300));
await page.screenshot({ path: `${OUT}/cutoff-cards-near.png` });
const first = await page.$('.site-card');
await first.click();
await new Promise(r => setTimeout(r, 1500));
await page.screenshot({ path: `${OUT}/cutoff-viewer.png` });
await page.evaluate(() => document.getElementById('btnClose').click());
await new Promise(r => setTimeout(r, 400));
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
await new Promise(r => setTimeout(r, 600));
await page.screenshot({ path: `${OUT}/cutoff-mobile.png`, fullPage: true });

console.log(JSON.stringify({ base: BASE, cardCount, stats, viewerSeen, errors, badResponses }, null, 2));
await browser.close();
const fail = cardCount !== 32
  || stats.withParams !== 32 || stats.withCutoff !== 32
  || sample.some(s => !viewerSeen[s]?.cutoff)
  || errors.length > 0 || badResponses.length > 0;
process.exitCode = fail ? 2 : 0;
