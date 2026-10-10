// 本地验证：新增条目 glm-5-3-flash-zhipu（智谱官网 GLM 5.3 Flash）
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const puppeteer = require('C:/Users/mypra/AppData/Roaming/npm/node_modules/puppeteer-core');

const BASE = process.argv[2] || 'http://127.0.0.1:4173/index.html';
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const OUT = 'C:/Users/mypra/Desktop/VibeCoding指南/skills测评项目/03-鹈鹕自行车测试/TempFiles';
const SLUG = 'glm-5-3-flash-zhipu';

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
});
const page = await browser.newPage();
const errors = [];
const badResponses = [];
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', e => errors.push(e.message));
page.on('requestfailed', r => {
  const u = r.url();
  if (!/favicon\.ico$/.test(u)) errors.push('REQ-FAIL ' + u + ' ' + r.failure()?.errorText);
});
page.on('response', r => {
  const u = r.url();
  if (/favicon\.ico$/.test(u)) return;
  if (r.status() >= 400) badResponses.push(r.status() + ' ' + u);
});

await page.setViewport({ width: 1280, height: 900 });
await page.goto(BASE, { waitUntil: 'networkidle2', timeout: 30000 });
await new Promise(r => setTimeout(r, 900));

const cardCount = await page.$$eval('.site-card', els => els.length);
const info = await page.$eval(`.site-card[data-slug="${SLUG}"]`, el => ({
  title: el.querySelector('.card-title')?.textContent?.trim(),
  channel: el.querySelector('.channel-badge')?.textContent?.trim(),
  file: el.querySelector('.card-file')?.textContent?.trim(),
  imgSrc: el.querySelector('.thumb-wrap img')?.getAttribute('src'),
  imgLoaded: el.querySelector('.thumb-wrap img')?.complete,
})).catch(e => ({ error: e.message }));

const imgHttp = await page.evaluate(async (src) => {
  try { const r = await fetch(src); return r.status; } catch (e) { return 'fetch-failed:' + e.message; }
}, info.imgSrc).catch(e => 'eval-err:' + e.message);
console.error('DEBUG imgHttp=' + JSON.stringify(imgHttp) + ' info.imgSrc=' + JSON.stringify(info.imgSrc));

// 点开查看器
const card = await page.$(`.site-card[data-slug="${SLUG}"]`);
await card.click();
await new Promise(r => setTimeout(r, 1500));
const viewer = await page.evaluate(() => ({
  open: document.body.classList.contains('viewer-open'),
  title: document.getElementById('viewerTitle')?.textContent?.trim(),
  badge: document.getElementById('viewerBadge')?.textContent?.trim(),
  iframeSrc: document.getElementById('viewerIframe')?.src || '',
}));
await page.screenshot({ path: `${OUT}/verify-glm53flash-viewer.png` });
await page.evaluate(() => document.getElementById('btnClose').click());
await new Promise(r => setTimeout(r, 300));

// 桌面整页
await page.screenshot({ path: `${OUT}/verify-glm53flash-desktop.png`, fullPage: true });

// 滚到卡片处截一张
await page.evaluate((slug) => {
  const el = document.querySelector(`.site-card[data-slug="${slug}"]`);
  if (el) el.scrollIntoView({ block: 'center' });
}, SLUG);
await new Promise(r => setTimeout(r, 400));
await page.screenshot({ path: `${OUT}/verify-glm53flash-card.png` });

// 移动端
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
await new Promise(r => setTimeout(r, 600));
await page.screenshot({ path: `${OUT}/verify-glm53flash-mobile.png`, fullPage: true });

console.log(JSON.stringify({ base: BASE, cardCount, info, imgHttp, viewer, errors, badResponses }, null, 2));

await browser.close();
const fail = cardCount !== 30
  || !info.title
  || imgHttp !== 200
  || !viewer.iframeSrc?.includes(SLUG + '.html')
  || errors.length > 0;
console.error('DEBUG fail=', fail, '| cardCount=', cardCount, '| title=', JSON.stringify(info?.title), '| imgHttp=', imgHttp, '| iframe=', viewer?.iframeSrc, '| errors=', errors.length, '| bad=', badResponses.length);
process.exitCode = fail ? 2 : 0;
