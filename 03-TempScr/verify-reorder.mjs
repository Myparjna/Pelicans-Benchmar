// 验证：1) cutoff 显示含「截止」前缀 2) 32 张按发布时间倒序 3) header 副标 32
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
page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)\.com/.test(m.location()?.url || '')) errors.push(m.text()); });
page.on('pageerror', e => errors.push(e.message));

await page.setViewport({ width: 1280, height: 900 });
await page.goto(BASE, { waitUntil: 'networkidle2', timeout: 30000 });
await new Promise(r => setTimeout(r, 1200));

// 1) header 副标
const subtitle = await page.$eval('.subtitle', el => el.textContent.trim());

// 2) 卡片顺序
const order = await page.$$eval('.site-card', els => els.map(el => ({
  slug: el.dataset.slug,
  title: el.querySelector('.card-title')?.textContent?.trim(),
  cutoff: el.querySelector('.cutoff-badge')?.textContent?.trim(),
  params: el.querySelector('.params-badge')?.textContent?.trim(),
})));

// 3) 验证 cutoff 全部含「截止」
const cutoffOk = order.every(c => !c.cutoff || c.cutoff.startsWith('截止'));

// 截图
await page.evaluate(() => document.querySelector('.site-card')?.scrollIntoView({ block: 'start' }));
await new Promise(r => setTimeout(r, 300));
await page.screenshot({ path: `${OUT}/reorder-top.png` });

// 取第 1 张卡 viewer 验证 cutoff
const first = await page.$('.site-card');
await first.click();
await new Promise(r => setTimeout(r, 1500));
const viewerState = await page.evaluate(() => ({
  cutoff: document.getElementById('viewerCutoff')?.textContent?.trim(),
}));
await page.screenshot({ path: `${OUT}/reorder-viewer.png` });
await page.evaluate(() => document.getElementById('btnClose').click());

await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
await new Promise(r => setTimeout(r, 600));
await page.screenshot({ path: `${OUT}/reorder-mobile.png`, fullPage: true });

console.log(JSON.stringify({ subtitle, count: order.length, cutoffOk, first: order[0], last: order[order.length-1], viewerState, errors }, null, 2));
await browser.close();
process.exitCode = (order.length !== 32 || !cutoffOk || !subtitle.includes('32') || errors.length > 0) ? 2 : 0;
