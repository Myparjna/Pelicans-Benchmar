// 验证：去掉"打开查看"按钮与评分交互，仅静态显示分数；查看器/排序仍正常
import puppeteer from 'puppeteer-core';

const BASE = process.argv[2] || 'http://127.0.0.1:4173/index.html';
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
await new Promise(r => setTimeout(r, 900));

const check = await page.evaluate(() => {
  const cards = [...document.querySelectorAll('.site-card')];
  return {
    cardCount: cards.length,
    openBtnCount: document.querySelectorAll('.open-btn').length,
    ratingBtnCount: document.querySelectorAll('.rating-btn').length,
    ratingClearCount: document.querySelectorAll('.rating-clear').length,
    staticCount: document.querySelectorAll('.rating-static').length,
    scoreSample: (() => {
      const el = document.querySelector('.site-card[data-slug="qwen-3-8-max"] .rating-static');
      return el ? el.textContent.trim() : null;
    })(),
  };
});

// 点击卡片打开查看器
const viewer = {};
try {
  const card = await page.$('.site-card[data-slug="qwen-3-8-max"]');
  await card.click();
  await new Promise(r => setTimeout(r, 1200));
  viewer.open = await page.evaluate(() => ({
    title: document.getElementById('viewerTitle')?.textContent?.trim(),
    iframeSrc: document.getElementById('viewerIframe')?.src || '',
    viewerRatingText: document.getElementById('viewerRating')?.textContent?.trim() || '',
    viewerBtnCount: document.querySelectorAll('#viewerRating .rating-btn').length,
  }));
  await page.evaluate(() => document.getElementById('btnClose').click());
  await new Promise(r => setTimeout(r, 300));
} catch (e) { viewer.open = { error: e.message }; }

// 按评分排序仍可用
let sortOk = false;
try {
  await page.click('#sortToggle');
  await new Promise(r => setTimeout(r, 700));
  sortOk = await page.evaluate(() =>
    !!document.querySelector('.sort-view') && document.querySelectorAll('.site-card').length > 0
  );
} catch (e) { sortOk = false; }

console.log(JSON.stringify({ check, viewer, sortOk, errors }, null, 2));
await browser.close();

const bad = [];
if (check.cardCount !== 27) bad.push('cardCount=' + check.cardCount);
if (check.openBtnCount !== 0) bad.push('open-btn 仍存在');
if (check.ratingBtnCount !== 0 || check.ratingClearCount !== 0) bad.push('评分按钮仍存在');
if (check.staticCount !== 27) bad.push('静态分数个数=' + check.staticCount);
if (!check.scoreSample) bad.push('分数文本缺失');
if (!viewer.open?.iframeSrc?.includes('qwen-3-8-max.html')) bad.push('查看器异常');
if (viewer.open?.viewerBtnCount !== 0) bad.push('查看器内评分按钮仍存在');
if (!sortOk) bad.push('排序功能异常');
if (errors.length) bad.push('console errors: ' + errors.join(' | '));
process.exitCode = bad.length ? 2 : 0;
console.log('CHECK:', bad.length ? 'FAIL - ' + bad.join(' ; ') : 'PASS');
