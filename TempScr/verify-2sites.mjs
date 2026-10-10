// 本地验证：新增的两条（qwen-3-8-flash-api / glm-5-3-flash-zai）
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const puppeteer = require('C:/Users/mypra/AppData/Roaming/npm/node_modules/puppeteer-core');

const BASE = process.argv[2] || 'http://127.0.0.1:4173/index.html';
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const OUT = 'C:/Users/mypra/Desktop/VibeCoding指南/skills测评项目/03-鹈鹕自行车测试/TempFiles';
const SLUGS = ['qwen-3-8-flash-api', 'glm-5-3-flash-zai'];

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
  // 过滤 iframe 内 google fonts 网络错误（源文件设计如此，展厅不受影响）
  const loc = m.location();
  if (loc && /fonts\.(googleapis|gstatic)\.com/.test(loc.url || '')) return;
  errors.push('CONSOLE ' + m.text());
});
page.on('pageerror', e => errors.push('PAGEERR ' + e.message));
page.on('requestfailed', r => {
  const u = r.url();
  if (/favicon\.ico$/.test(u)) return;
  if (/fonts\.(googleapis|gstatic)\.com/.test(u)) return;  // 源文件引用的外网字体
  errors.push('REQ-FAIL ' + u + ' ' + r.failure()?.errorText);
});
page.on('response', r => {
  const u = r.url();
  if (/favicon\.ico$/.test(u)) return;
  if (/fonts\.(googleapis|gstatic)\.com/.test(u)) return;  // 源文件引用的外网字体，展厅不影响
  if (r.status() >= 400) badResponses.push(r.status() + ' ' + u);
});

await page.setViewport({ width: 1280, height: 900 });
await page.goto(BASE, { waitUntil: 'networkidle2', timeout: 30000 });
await new Promise(r => setTimeout(r, 900));

const cardCount = await page.$$eval('.site-card', els => els.length);
const info = {};
for (const slug of SLUGS) {
  try {
    info[slug] = await page.$eval(`.site-card[data-slug="${slug}"]`, el => ({
      title: el.querySelector('.card-title')?.textContent?.trim(),
      channel: el.querySelector('.channel-badge')?.textContent?.trim(),
      file: el.querySelector('.card-file')?.textContent?.trim(),
      imgSrc: el.querySelector('.thumb-wrap img')?.getAttribute('src'),
    }));
    info[slug].imgHttp = await page.evaluate(async (src) => {
      try { const r = await fetch(src); return r.status; } catch (e) { return 'fetch-failed:' + e.message; }
    }, info[slug].imgSrc).catch(e => 'eval-err:' + e.message);
  } catch (e) { info[slug] = { error: e.message }; }
}

const viewer = {};
for (const slug of SLUGS) {
  try {
    const card = await page.$(`.site-card[data-slug="${slug}"]`);
    await card.click();
    await new Promise(r => setTimeout(r, 3500));  // 等 iframe 加载 + 动画绘制
    viewer[slug] = await page.evaluate(() => ({
      open: document.body.classList.contains('viewer-open'),
      title: document.getElementById('viewerTitle')?.textContent?.trim(),
      badge: document.getElementById('viewerBadge')?.textContent?.trim(),
      iframeSrc: document.getElementById('viewerIframe')?.src || '',
    }));
    await page.screenshot({ path: `${OUT}/verify-2sites-${slug}-viewer.png` });
    await page.evaluate(() => document.getElementById('btnClose').click());
    await new Promise(r => setTimeout(r, 300));
  } catch (e) { viewer[slug] = { error: e.message }; }
}

// 桌面整页
await page.screenshot({ path: `${OUT}/verify-2sites-desktop.png`, fullPage: true });

// 移动端
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
await new Promise(r => setTimeout(r, 600));
await page.screenshot({ path: `${OUT}/verify-2sites-mobile.png`, fullPage: true });

console.log(JSON.stringify({ base: BASE, cardCount, info, viewer, errors, badResponses }, null, 2));

await browser.close();
const fail = cardCount !== 32
  || SLUGS.some(s => !info[s]?.title || info[s]?.imgHttp !== 200)
  || SLUGS.some(s => !viewer[s]?.iframeSrc?.includes(s + '.html'))
  || errors.length > 0
  || badResponses.length > 0;
process.exitCode = fail ? 2 : 0;
