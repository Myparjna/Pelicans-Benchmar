// 验证 hover 不再放大：对比 hover 前后 .site-card 的 transform 和 bounding box
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const puppeteer = require('C:/Users/mypra/AppData/Roaming/npm/node_modules/puppeteer-core');

const BASE = process.argv[2] || 'http://127.0.0.1:4173/index.html';
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
});
const page = await browser.newPage();
const errors = [];
page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)\.com/.test(m.location()?.url || '')) errors.push(m.text()); });
page.on('pageerror', e => errors.push(e.message));
await page.setViewport({ width: 1280, height: 900 });
await page.goto(BASE, { waitUntil: 'networkidle2', timeout: 30000 });
await new Promise(r => setTimeout(r, 1000));

// 测第 1 张卡
const card = await page.$('.site-card');

const before = await page.evaluate(el => {
  const cs = getComputedStyle(el);
  const r = el.getBoundingClientRect();
  return { transform: cs.transform, w: r.width, h: r.height };
}, card);

// 移到卡片上（用 puppeteer 内置 hover）
await card.hover();
await new Promise(r => setTimeout(r, 400));  // 等过渡完成

const after = await page.evaluate(el => {
  const cs = getComputedStyle(el);
  const r = el.getBoundingClientRect();
  return { transform: cs.transform, w: r.width, h: r.height };
}, card);

const deltaW = after.w - before.w;
const deltaH = after.h - before.h;
const scaled = after.transform.includes('matrix') && !after.transform.includes('1, 0, 0, 1, 0, 0');
// none 表示无 transform 或 identity
const isIdentity = after.transform === 'none' || after.transform === 'matrix(1, 0, 0, 1, 0, 0)';

console.log(JSON.stringify({ before, after, deltaW, deltaH, scaled, isIdentity, errors }, null, 2));
await browser.close();
process.exitCode = (deltaW > 1 || deltaH > 1 || scaled) ? 2 : 0;
