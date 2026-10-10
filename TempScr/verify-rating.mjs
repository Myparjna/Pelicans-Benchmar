// 验证打分 + 一键按评分排序 + localStorage 持久化 + 清除评分（系统 Chrome 真实操作）
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
const require = createRequire(import.meta.url);
const puppeteer = require('C:/Users/mypra/AppData/Roaming/npm/node_modules/puppeteer-core');

const BASE = 'http://127.0.0.1:4173';
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const OUT = 'C:/Users/mypra/Desktop/鹈鹕自行车测试/TempFiles';
mkdirSync(OUT, { recursive: true });

const results = {};
const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--force-color-profile=srgb', '--hide-scrollbars'],
});

const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 900 });
const errors = [];
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', e => errors.push('pageerror: ' + e.message));

await page.goto(BASE + '/index.html', { waitUntil: 'networkidle0', timeout: 30000 });
await page.waitForSelector('.site-card');

results.cardCount = await page.$$eval('.site-card', els => els.length);

// 1) 给第一张卡片打 9 分
const firstSlug = await page.$eval('.site-card', el => el.dataset.slug);
await page.click(`.site-card[data-slug="${firstSlug}"] .rating-btn[data-score="9"]`);
await new Promise(r => setTimeout(r, 200));
results.firstSlug = firstSlug;
results.ratedActive9 = await page.$eval(`.site-card[data-slug="${firstSlug}"] .rating-btn[data-score="9"]`, el => el.classList.contains('active'));
results.storedAfterRate9 = await page.evaluate(() => localStorage.getItem('peilika_ratings_v1'));

// 2) 给第二张卡片打 3 分（验证排序顺序）
const secondSlug = await page.$$eval('.site-card', els => els[1].dataset.slug);
await page.click(`.site-card[data-slug="${secondSlug}"] .rating-btn[data-score="3"]`);
await new Promise(r => setTimeout(r, 200));
results.secondSlug = secondSlug;

// 3) 一键按评分排序
await page.click('[data-sort="rating"]');
await page.waitForSelector('.sort-view');
await new Promise(r => setTimeout(r, 200));
results.sortViewFirstSlug = await page.$eval('.sort-view .site-card', el => el.dataset.slug);
results.sortViewFirstRank = await page.$eval('.sort-view .site-card .rank-badge', el => el.textContent.trim());
results.expectedFirst = firstSlug; // 9 分应高于 3 分
await page.screenshot({ path: OUT + '/rating-sort-desktop.png', fullPage: false });

// 4) 清除第一张（已是 9 分，排序视图下排第一）的评分
await page.click(`.sort-view .site-card[data-slug="${firstSlug}"] .rating-clear`);
await new Promise(r => setTimeout(r, 250));
results.storedAfterClear = await page.evaluate(() => localStorage.getItem('peilika_ratings_v1'));
// 清除后排序视图第一张应变成 secondSlug（3 分）
results.sortViewFirstAfterClear = await page.$eval('.sort-view .site-card', el => el.dataset.slug);
results.expectedAfterClear = secondSlug;

// 5) 切回分类视图并截移动端图
await page.click('.filter-chip[data-category="全部"]');
await page.waitForSelector('.category-section:not(.sort-view)');
await page.setViewport({ width: 390, height: 844, isMobile: true, deviceScaleFactor: 2 });
await new Promise(r => setTimeout(r, 200));
await page.screenshot({ path: OUT + '/rating-mobile.png', fullPage: false });

results.consoleErrors = errors;
console.log(JSON.stringify(results, null, 2));
await browser.close();
