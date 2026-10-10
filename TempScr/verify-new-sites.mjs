// 本地验证：新增 4 条目（gemini-3-7 / qwen-3-8-27b / grok-4-6 / glm-5-3-wb）是否就位、缩略图可加载、iframe 可打开、无 console 报错
import puppeteer from 'puppeteer-core';

const BASE = process.argv[2] || 'http://127.0.0.1:4173/index.html';
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const OUT = 'C:/Users/mypra/Desktop/鹈鹕自行车测试/TempFiles';

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
await new Promise(r => setTimeout(r, 900));

const NEW = ['gemini-3-7', 'qwen-3-8-27b', 'grok-4-6', 'glm-5-3-wb'];
const cardCount = await page.$$eval('.site-card', els => els.length);

const info = {};
for (const slug of NEW) {
  try {
    info[slug] = await page.$eval(`.site-card[data-slug="${slug}"]`, el => ({
      title: el.querySelector('.card-title')?.textContent?.trim(),
      channel: el.querySelector('.channel-badge')?.textContent?.trim(),
      file: el.querySelector('.card-file')?.textContent?.trim(),
      imgSrc: el.querySelector('.thumb-wrap img')?.getAttribute('src'),
      imgLoaded: el.querySelector('.thumb-wrap img')?.complete,
    }));
  } catch (e) { info[slug] = { error: e.message }; }
}

// 缩略图 HTTP 可加载性
for (const slug of NEW) {
  if (info[slug]?.imgSrc) {
    info[slug].imgHttp = await page.evaluate(async (src) => {
      try { const r = await fetch(src); return r.status; } catch (e) { return 'fetch-failed'; }
    }, info[slug].imgSrc);
  }
}

// 分类分组出现情况
const cats = await page.$$eval('.category-name', els => els.map(e => e.textContent.trim()));

// 点击打开查看器
let viewer = {};
for (const slug of NEW) {
  try {
    const card = await page.$(`.site-card[data-slug="${slug}"]`);
    await card.click();
    await new Promise(r => setTimeout(r, 1300));
    viewer[slug] = await page.evaluate(() => ({
      title: document.getElementById('viewerTitle')?.textContent?.trim(),
      badge: document.getElementById('viewerBadge')?.textContent?.trim(),
      iframeSrc: document.getElementById('viewerIframe')?.src || '',
    }));
    // 关闭
    await page.evaluate(() => document.getElementById('btnClose').click());
    await new Promise(r => setTimeout(r, 300));
  } catch (e) { viewer[slug] = { error: e.message }; }
}

// 桌面 + 移动端截图
await page.screenshot({ path: OUT + '/verify-new-desktop.png', fullPage: true });
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
await new Promise(r => setTimeout(r, 600));
await page.screenshot({ path: OUT + '/verify-new-mobile.png', fullPage: true });

console.log(JSON.stringify({ base: BASE, cardCount, info, cats, viewer, errors }, null, 2));

await browser.close();
const fail = cardCount !== 28
  || NEW.some(s => !info[s]?.title || info[s]?.imgHttp !== 200)
  || NEW.some(s => !viewer[s]?.iframeSrc?.includes(s + '.html'))
  || errors.length > 0;
process.exitCode = fail ? 2 : 0;
