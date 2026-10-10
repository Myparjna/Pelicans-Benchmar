// 全量验证：34 张卡片、新卡排序/徽标/评分、viewer 打开新卡、资源 200、无报错
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const puppeteer = require('C:/Users/mypra/AppData/Roaming/npm/node_modules/puppeteer-core');

const BASE = 'http://127.0.0.1:4173/';
const browser = await puppeteer.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: 'new',
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
});
const page = await browser.newPage();
const errors = [];
page.on('pageerror', e => errors.push('pageerror: ' + e.message));
page.on('console', m => { if (m.type() === 'error' && !/favicon/.test(m.text())) errors.push('console: ' + m.text()); });
const badResponses = [];
page.on('response', r => {
  const u = r.url();
  if (r.status() >= 400 && !/favicon/.test(u) && !/fonts\.googleapis|fonts\.gstatic/.test(u)) badResponses.push(r.status() + ' ' + u);
});

await page.setViewport({ width: 1440, height: 960 });
await page.goto(BASE, { waitUntil: 'load', timeout: 30000 });
await new Promise(r => setTimeout(r, 3500));

const cardCount = await page.$$eval('.site-card', els => els.length);
const headerSub = await page.$eval('.subtitle', el => el.textContent);
const headerDate = await page.$eval('h1', el => el.textContent);
const firstSlugs = await page.$$eval('.site-card', els => els.slice(0, 2).map(e => e.dataset.slug));
const gptCard = await page.$$eval('.site-card[data-slug="gpt-6"]', els => els.length ? {
  title: els[0].querySelector('.card-title').textContent,
  channel: els[0].querySelector('.channel-badge').textContent,
  params: els[0].querySelector('.params-badge')?.textContent ?? null,
  cutoff: els[0].querySelector('.cutoff-badge')?.textContent ?? null,
  score: els[0].querySelector('.star-score')?.textContent ?? null,
} : null);
const geminiCard = await page.$$eval('.site-card[data-slug="gemini-3-8"]', els => els.length ? {
  title: els[0].querySelector('.card-title').textContent,
  channel: els[0].querySelector('.channel-badge').textContent,
  params: els[0].querySelector('.params-badge')?.textContent ?? null,
  cutoff: els[0].querySelector('.cutoff-badge')?.textContent ?? null,
  score: els[0].querySelector('.star-score')?.textContent ?? null,
} : null);
const thumbsOk = await page.evaluate(async () => {
  const bad = [];
  for (const s of window.SITES) {
    try {
      const r = await fetch(s.thumb);
      if (r.status !== 200) bad.push(r.status + ' ' + s.thumb);
      const w = s.thumb.replace(/\.png$/, '.webp');
      const r2 = await fetch(w);
      if (r2.status !== 200) bad.push(r2.status + ' ' + w);
    } catch (e) { bad.push('ERR ' + s.thumb); }
  }
  return { bad };
});

// 打开 gpt-6 viewer
await page.click('.site-card[data-slug="gpt-6"]');
await new Promise(r => setTimeout(r, 3500));
const viewer = await page.evaluate(() => ({
  hidden: document.getElementById('viewer').getAttribute('aria-hidden'),
  title: document.getElementById('viewerTitle').textContent,
  iframeSrc: document.getElementById('viewerIframe').src,
  params: document.getElementById('viewerParams').textContent,
  cutoff: document.getElementById('viewerCutoff').textContent,
  score: document.querySelector('#viewerRating .star-score')?.textContent ?? null,
}));

console.log(JSON.stringify({ cardCount, headerSub, headerDate, firstSlugs, gptCard, geminiCard, thumbsBad: thumbsOk.bad, viewer, errors, badResponses }, null, 2));const fail =
  cardCount !== 34 ||
  firstSlugs[0] !== 'gpt-6' || !geminiCard ||
  !gptCard || gptCard.score !== '10 分' || gptCard.cutoff !== '截止 2026-04' ||
  !geminiCard || geminiCard.score !== '7 分' || geminiCard.cutoff !== '截止 2026-03' ||
  thumbsOk.bad.length > 0 ||
  viewer.hidden !== 'false' || !viewer.iframeSrc.includes('gpt-6.html') ||
  viewer.score !== '10 分' || viewer.cutoff !== '截止 2026-04' ||
  !headerSub.includes('34') || !headerDate.includes('2026-09-06') ||
  errors.length > 0 || badResponses.length > 0;
console.log(fail ? 'FAIL' : 'PASS');
process.exitCode = fail ? 2 : 0;
await browser.close();
