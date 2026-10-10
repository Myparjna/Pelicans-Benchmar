// 验证新加入的 GPT-5.6 Luna Codex 条目（独立 userDataDir，避免与其他 agent 冲突）
import puppeteer from 'puppeteer-core';
import { mkdirSync } from 'node:fs';
const BASE = process.argv[2] || 'https://peilika.pages.dev';
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const SLUG = 'gpt-5-6-luna-codex';
const USERDATA = 'C:/Users/mypra/Desktop/鹈鹕自行车测试/TempFiles/.cdp-luna';
mkdirSync(USERDATA, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  userDataDir: USERDATA,
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--remote-debugging-port=0']
});
const page = await browser.newPage();
const errors = [];
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', e => errors.push(e.message));
await page.setViewport({ width: 1280, height: 900 });
await page.goto(BASE, { waitUntil: 'networkidle2', timeout: 30000 });
await new Promise(r => setTimeout(r, 800));

const cardCount = await page.$$eval('.site-card', els => els.length);
let info = null, hasCard = false, thumbHttp = 'n/a', iframeOk = false;
try {
  info = await page.$eval(`.site-card[data-slug="${SLUG}"]`, el => ({
    title: el.querySelector('.card-title')?.textContent?.trim(),
    channel: el.querySelector('.channel-badge')?.textContent?.trim(),
    category: el.querySelector('.category-badge')?.textContent?.trim(),
    imgSrc: el.querySelector('.thumb-wrap img')?.getAttribute('src'),
  }));
  hasCard = true;
} catch (e) { info = { error: e.message }; }

if (info?.imgSrc) {
  thumbHttp = await page.evaluate(async (src) => { try { const r = await fetch(src, { method: 'HEAD' }); return r.status; } catch (e) { return 'fetch-failed'; } }, info.imgSrc);
}
if (hasCard) {
  const el = await page.$(`.site-card[data-slug="${SLUG}"]`);
  await el.click();
  await new Promise(r => setTimeout(r, 1200));
  iframeOk = await page.evaluate((slug) => { const f = document.getElementById('viewerIframe'); return !!f && f.src.includes(slug + '.html'); }, SLUG);
  const vt = await page.$eval('#viewerTitle', e => e.textContent.trim()).catch(() => '');
  console.log('viewerTitle:', vt);
}
const ok = cardCount === 25 && hasCard && info?.channel === 'Luna Codex' && thumbHttp === 200 && iframeOk && errors.length === 0;
console.log(JSON.stringify({ base: BASE, cardCount, hasCard, info, thumbHttp, iframeOk, errors }, null, 2));
console.log('RESULT:', ok ? 'PASS' : 'FAIL');
await browser.close();
if (!ok) process.exitCode = 2;
