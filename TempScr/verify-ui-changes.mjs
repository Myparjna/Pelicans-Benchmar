// 验证：排序按钮在 header、查看器内可打分、评分同步到 localStorage/卡片
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
const require = createRequire(import.meta.url);
const puppeteer = require('C:/Users/mypra/AppData/Roaming/npm/node_modules/puppeteer-core');

const BASE = process.argv[2] || 'http://127.0.0.1:4173';
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const OUT = 'C:/Users/mypra/Desktop/鹈鹕自行车测试/TempFiles';
mkdirSync(OUT, { recursive: true });

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

await page.goto(BASE, { waitUntil: 'networkidle0', timeout: 30000 });

const results = { base: BASE };

// 排序按钮在 header 内，不在 filter-bar 中
results.sortButtonInHeader = await page.$eval('#sortToggle', el => !!el);
results.sortButtonInFilterBar = await page.$$eval('.filter-bar [data-sort="rating"]', els => els.length).catch(() => 0);

// 点排序按钮，出现 sort-view
await page.click('#sortToggle');
await page.waitForSelector('.sort-view');
results.sortViewVisible = await page.$eval('.sort-view', el => !!el);

// 打开第一个站点预览
const firstSlug = await page.$eval('.site-card', el => el.dataset.slug);
await page.click(`.site-card[data-slug="${firstSlug}"] .open-btn`);
await page.waitForFunction(() => document.getElementById('viewer').getAttribute('aria-hidden') === 'false');
results.viewerOpen = true;

// 查看器内有评分控件
results.viewerRatingExists = await page.$eval('#viewerRating .rating-scale', el => !!el);

// 在查看器内给当前站点打 10 分
await page.click('#viewerRating .rating-btn[data-score="10"]');
await new Promise(r => setTimeout(r, 200));

// 检查 localStorage
results.storedAfterViewerRate = await page.evaluate(() => localStorage.getItem('peilika_ratings_v1'));

// 检查卡片上的评分同步
results.cardRated10 = await page.$eval(`.site-card[data-slug="${firstSlug}"] .rating-btn[data-score="10"]`, el => el.classList.contains('active'));

// 查看器内评分按钮高亮
results.viewerBtn10Active = await page.$eval('#viewerRating .rating-btn[data-score="10"]', el => el.classList.contains('active'));

// 截图
await page.screenshot({ path: OUT + '/viewer-rating.png', fullPage: false });

results.consoleErrors = errors;
console.log(JSON.stringify(results, null, 2));
await browser.close();
