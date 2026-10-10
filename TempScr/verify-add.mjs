// 线上验证：新增的 opus-5-relay 条目是否就位且可正常预览
import puppeteer from 'puppeteer-core';

const BASE = process.argv[2] || 'https://peilika.pages.dev';
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
});
const page = await browser.newPage();
const errors = [];
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', e => errors.push(e.message));

await page.setViewport({ width: 1280, height: 900 });
await page.goto(BASE, { waitUntil: 'networkidle2', timeout: 30000 });
await new Promise(r => setTimeout(r, 800));

const cardCount = await page.$$eval('.site-card', els => els.length);

let opusInfo = null, thumbHttp = 'n/a', categoryOk = false, iframeOk = false, hasOpus = false;
try {
  opusInfo = await page.$eval('.site-card[data-slug="opus-5-relay"]', el => ({
    title: el.querySelector('.card-title')?.textContent?.trim(),
    channel: el.querySelector('.channel-badge')?.textContent?.trim(),
    imgSrc: el.querySelector('.thumb-wrap img')?.getAttribute('src'),
  }));
  hasOpus = true;
} catch (e) { opusInfo = { error: e.message }; }

if (opusInfo?.imgSrc) {
  thumbHttp = await page.evaluate(async (src) => {
    try { const r = await fetch(src, { method: 'HEAD' }); return r.status; }
    catch (e) { return 'fetch-failed'; }
  }, opusInfo.imgSrc);
}

categoryOk = await page.evaluate(() =>
  [...document.querySelectorAll('.category-name')].some(n => n.textContent.includes('Anthropic · Claude'))
);

if (hasOpus) {
  const opus = await page.$('.site-card[data-slug="opus-5-relay"]');
  await opus.click();
  await new Promise(r => setTimeout(r, 1200));
  iframeOk = await page.evaluate(() => {
    const f = document.getElementById('viewerIframe');
    return !!f && f.src.includes('opus-5-relay.html');
  });
  const viewerTitle = await page.$eval('#viewerTitle', el => el.textContent.trim()).catch(() => '');
  console.log('viewerTitle:', viewerTitle);
}

console.log(JSON.stringify({
  base: BASE, cardCount, hasOpus, opusInfo, thumbHttp, categoryOk, iframeOk, errors
}, null, 2));

await browser.close();
if (cardCount !== 24 || !hasOpus || !categoryOk || !iframeOk || errors.length) process.exitCode = 2;
