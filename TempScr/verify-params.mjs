// 验证参数量徽标：每张卡片有 .params-badge，viewer 打开后 #viewerParams 也有值
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

// 1) 卡片统计
const cardCount = await page.$$eval('.site-card', els => els.length);
const cardStats = await page.$$eval('.site-card', els => {
  const r = { total: els.length, withParams: 0, samples: [] };
  els.forEach(el => {
    const p = el.querySelector('.params-badge')?.textContent?.trim();
    if (p) r.withParams++;
    if (r.samples.length < 5) r.samples.push({
      slug: el.dataset.slug,
      title: el.querySelector('.card-title')?.textContent?.trim(),
      params: p || '(无)',
    });
  });
  return r;
});

// 2) viewer 验证：随机点 3 个卡片看 #viewerParams
const sample = await page.$$eval('.site-card', els => els.slice(0, 3).map(e => e.dataset.slug));
const viewerSeen = {};
for (const slug of sample) {
  const card = await page.$(`.site-card[data-slug="${slug}"]`);
  await card.click();
  await new Promise(r => setTimeout(r, 1200));
  viewerSeen[slug] = await page.evaluate(() => ({
    open: document.body.classList.contains('viewer-open'),
    title: document.getElementById('viewerTitle')?.textContent?.trim(),
    badge: document.getElementById('viewerBadge')?.textContent?.trim(),
    params: document.getElementById('viewerParams')?.textContent?.trim(),
    paramsVisible: document.getElementById('viewerParams')?.style.display !== 'none',
  }));
  await page.evaluate(() => document.getElementById('btnClose').click());
  await new Promise(r => setTimeout(r, 400));
}

// 3) 截图：桌面 + 移动端（关注卡片上徽标）
await page.screenshot({ path: `${OUT}/params-desktop.png`, fullPage: true });
// 滚到第一张卡截一张近景
await page.evaluate(() => {
  const el = document.querySelector('.site-card');
  if (el) el.scrollIntoView({ block: 'start' });
});
await new Promise(r => setTimeout(r, 400));
await page.screenshot({ path: `${OUT}/params-cards-near.png` });

// 打开一张卡 viewer 截图
const first = await page.$('.site-card');
await first.click();
await new Promise(r => setTimeout(r, 1500));
await page.screenshot({ path: `${OUT}/params-viewer.png` });
await page.evaluate(() => document.getElementById('btnClose').click());
await new Promise(r => setTimeout(r, 400));

// 移动端
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
await new Promise(r => setTimeout(r, 600));
await page.screenshot({ path: `${OUT}/params-mobile.png`, fullPage: true });

console.log(JSON.stringify({ base: BASE, cardCount, cardStats, viewerSeen, errors, badResponses }, null, 2));
await browser.close();
const fail = cardCount !== 32
  || cardStats.withParams !== 32
  || sample.some(s => !viewerSeen[s]?.params)
  || errors.length > 0
  || badResponses.length > 0;
process.exitCode = fail ? 2 : 0;
