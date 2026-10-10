// 验证：星星评分组件（满星/半星/镂空），点击可改分并持久化
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

const snap = await page.evaluate(() => {
  const out = {};
  out.cardCount = document.querySelectorAll('.site-card').length;
  out.starCount = document.querySelectorAll('.star-rating .star').length / 27;
  // 默认分渲染：qwen-3-8-max=10(全满) gpt-5-6-codex=9(第5颗半星)
  const fills = (slug) => [...document.querySelectorAll(`.site-card[data-slug="${slug}"] .stars .fill`)]
    .map(el => parseFloat(el.style.width));
  out.qwenFills = fills('qwen-3-8-max');
  out.qwenText = document.querySelector('.site-card[data-slug="qwen-3-8-max"] .star-score').textContent.trim();
  out.gptFills = fills('gpt-5-6-codex');
  out.gptText = document.querySelector('.site-card[data-slug="gpt-5-6-codex"] .star-score').textContent.trim();
  // 未评分卡(seed-2-1-pro-trae 无默认分)应全镂空
  out.emptyFills = fills('seed-2-1-pro-trae');
  out.emptyText = document.querySelector('.site-card[data-slug="seed-2-1-pro-trae"] .star-score').textContent.trim();
  return out;
});

// 点击 qwen-3-8-max 星星中点(2.5星=5分)
await page.evaluate(() => {
  const stars = document.querySelector('.site-card[data-slug="qwen-3-8-max"] .stars');
  const rect = stars.getBoundingClientRect();
  stars.dispatchEvent(new PointerEvent('pointerdown', {
    clientX: rect.left + rect.width * 0.5, bubbles: true, cancelable: true,
  }));
});
await new Promise(r => setTimeout(r, 400));
const afterClick = await page.evaluate(() => ({
  text: document.querySelector('.site-card[data-slug="qwen-3-8-max"] .star-score').textContent.trim(),
  fills: [...document.querySelectorAll('.site-card[data-slug="qwen-3-8-max"] .stars .fill')].map(el => parseFloat(el.style.width)),
}));

// 刷新验证持久化
await page.reload({ waitUntil: 'networkidle2' });
await new Promise(r => setTimeout(r, 800));
const afterReload = await page.evaluate(() => ({
  text: document.querySelector('.site-card[data-slug="qwen-3-8-max"] .star-score').textContent.trim(),
}));

// 查看器星星
let viewer = {};
try {
  await page.evaluate(() => document.querySelector('.site-card[data-slug="gpt-5-6-codex"]').click());
  await new Promise(r => setTimeout(r, 1200));
  viewer = await page.evaluate(() => ({
    title: document.getElementById('viewerTitle')?.textContent?.trim(),
    starInViewer: !!document.querySelector('#viewerRating .star-rating'),
    viewerText: document.getElementById('viewerRating')?.textContent?.trim() || '',
  }));
} catch (e) { viewer = { error: e.message }; }

// 排序仍可用
let sortOk = false;
try {
  await page.evaluate(() => document.getElementById('btnClose').click());
  await new Promise(r => setTimeout(r, 300));
  await page.evaluate(() => document.getElementById('sortToggle').click());
  await new Promise(r => setTimeout(r, 600));
  sortOk = await page.evaluate(() => !!document.querySelector('.sort-view'));
} catch (e) { sortOk = false; }

console.log(JSON.stringify({ snap, afterClick, afterReload, viewer, sortOk, errors }, null, 2));
await browser.close();

const bad = [];
if (snap.cardCount !== 27) bad.push('cardCount=' + snap.cardCount);
if (snap.starCount !== 5) bad.push('每卡星星数=' + snap.starCount);
if (snap.qwenFills.some(v => v !== 100)) bad.push('10分卡非全满星');
if (snap.qwenText !== '10 分') bad.push('qwen 分数文本: ' + snap.qwenText);
if (snap.gptFills[4] !== 50) bad.push('9分卡第5颗应半星: ' + snap.gptFills);
if (snap.gptText !== '9 分') bad.push('gpt 分数文本: ' + snap.gptText);
if (snap.emptyFills.some(v => v !== 0)) bad.push('未评分卡应全镂空');
if (snap.emptyText !== '未评分') bad.push('未评分文本: ' + snap.emptyText);
if (afterClick.text !== '5 分') bad.push('点击改分失败: ' + afterClick.text);
if (afterReload.text !== '5 分') bad.push('刷新后未持久化: ' + afterReload.text);
if (!viewer.starInViewer) bad.push('查看器内无星星');
if (!sortOk) bad.push('排序异常');
if (errors.length) bad.push('console errors: ' + errors.join(' | '));
process.exitCode = bad.length ? 2 : 0;
console.log('CHECK:', bad.length ? 'FAIL - ' + bad.join(' ; ') : 'PASS');
