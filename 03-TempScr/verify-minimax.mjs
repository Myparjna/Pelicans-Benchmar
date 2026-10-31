// 验证 MiniMax M3 条目已替换为 官网风格 新源
import puppeteer from 'puppeteer-core';
const BASE = process.argv[2] || 'https://peilika.pages.dev';
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';

const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'] });
const page = await browser.newPage();
const errors = [];
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', e => errors.push(e.message));
await page.setViewport({ width: 1280, height: 900 });
await page.goto(BASE, { waitUntil: 'networkidle2', timeout: 30000 });
await new Promise(r => setTimeout(r, 800));

const cardCount = await page.$$eval('.site-card', els => els.length);
let mm = null, hasMm = false, thumbHttp = 'n/a', iframeOk = false;
try {
  mm = await page.$eval('.site-card[data-slug="minimax-m3-wb"]', el => ({
    title: el.querySelector('.card-title')?.textContent?.trim(),
    channel: el.querySelector('.channel-badge')?.textContent?.trim(),
    imgSrc: el.querySelector('.thumb-wrap img')?.getAttribute('src'),
  }));
  hasMm = true;
} catch (e) { mm = { error: e.message }; }

if (mm?.imgSrc) {
  thumbHttp = await page.evaluate(async (src) => { try { const r = await fetch(src, { method: 'HEAD' }); return r.status; } catch (e) { return 'fetch-failed'; } }, mm.imgSrc);
}
if (hasMm) {
  const el = await page.$('.site-card[data-slug="minimax-m3-wb"]');
  await el.click();
  await new Promise(r => setTimeout(r, 1200));
  iframeOk = await page.evaluate(() => { const f = document.getElementById('viewerIframe'); return !!f && f.src.includes('minimax-m3-wb.html'); });
  const vt = await page.$eval('#viewerTitle', e => e.textContent.trim()).catch(() => '');
  console.log('viewerTitle:', vt);
}
console.log(JSON.stringify({ base: BASE, cardCount, hasMm, mm, thumbHttp, iframeOk, errors }, null, 2));
await browser.close();
if (cardCount !== 24 || !hasMm || mm?.channel !== '官网风格' || !iframeOk || errors.length) process.exitCode = 2;
