// 线上验证：刚部署的预览 URL（检查新 3 条卡片 + viewer）
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const puppeteer = require('C:/Users/mypra/AppData/Roaming/npm/node_modules/puppeteer-core');

const BASE = process.argv[2] || 'https://2bcb8803.peilika.pages.dev';
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const OUT = 'C:/Users/mypra/Desktop/VibeCoding指南/skills测评项目/03-鹈鹕自行车测试/TempFiles';
const NEW = ['glm-5-3-flash-zhipu', 'qwen-3-8-flash-api', 'glm-5-3-flash-zai'];

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
  errors.push('REQ-FAIL ' + u + ' ' + r.failure()?.errorText);
});
page.on('response', r => {
  const u = r.url();
  if (/favicon\.ico$/.test(u)) return;
  if (/fonts\.(googleapis|gstatic)\.com/.test(u)) return;
  if (r.status() >= 400) badResponses.push(r.status() + ' ' + u);
});

await page.setViewport({ width: 1280, height: 900 });
await page.goto(BASE, { waitUntil: 'networkidle2', timeout: 60000 });
await new Promise(r => setTimeout(r, 1500));

const cardCount = await page.$$eval('.site-card', els => els.length);
const info = {};
for (const slug of NEW) {
  try {
    info[slug] = await page.$eval(`.site-card[data-slug="${slug}"]`, el => ({
      title: el.querySelector('.card-title')?.textContent?.trim(),
      channel: el.querySelector('.channel-badge')?.textContent?.trim(),
      imgSrc: el.querySelector('.thumb-wrap img')?.getAttribute('src'),
    }));
    info[slug].imgHttp = await page.evaluate(async (src) => {
      try { const r = await fetch(src); return r.status; } catch (e) { return 'fetch-failed:' + e.message; }
    }, info[slug].imgSrc).catch(e => 'eval-err:' + e.message);
  } catch (e) { info[slug] = { error: e.message }; }
}

for (const slug of NEW) {
  const card = await page.$(`.site-card[data-slug="${slug}"]`);
  if (!card) continue;
  await card.click();
  await new Promise(r => setTimeout(r, 4000));
  await page.screenshot({ path: `${OUT}/deploy-${slug}-viewer.png` });
  await page.evaluate(() => document.getElementById('btnClose').click());
  await new Promise(r => setTimeout(r, 400));
}

await page.screenshot({ path: `${OUT}/deploy-desktop.png`, fullPage: true });
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
await new Promise(r => setTimeout(r, 600));
await page.screenshot({ path: `${OUT}/deploy-mobile.png`, fullPage: true });

console.log(JSON.stringify({ base: BASE, cardCount, info, errors, badResponses }, null, 2));
await browser.close();
const fail = cardCount !== 32
  || NEW.some(s => !info[s]?.title || info[s]?.imgHttp !== 200)
  || errors.length > 0
  || badResponses.length > 0;
process.exitCode = fail ? 2 : 0;
