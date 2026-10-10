// 验证：渠道名统一（官网/官网·专家模式）与分类内最新在前排序
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

const cardCount = await page.$$eval('.site-card', els => els.length);

// 各分类下卡片顺序
const catOrder = await page.evaluate(() => {
  const out = {};
  for (const sec of document.querySelectorAll('.category-section')) {
    const name = sec.querySelector('.category-name')?.textContent?.trim();
    if (!name) continue;
    out[name] = [...sec.querySelectorAll('.site-card .card-title')].map(e => e.textContent.trim());
  }
  return out;
});

// 渠道文本抽查
const chk = {};
for (const slug of ['qwen-3-8-max', 'doubao-expert', 'qianwen-3-6-flash', 'glm-5-3-wb', 'grok-4-6', 'gemini-3-7']) {
  try {
    chk[slug] = await page.$eval(`.site-card[data-slug="${slug}"] .channel-badge`, e => e.textContent.trim());
  } catch (e) { chk[slug] = '(缺失)'; }
}

console.log(JSON.stringify({ cardCount, chk, catOrder, errors }, null, 2));
await browser.close();

const bad = [];
if (cardCount !== 27) bad.push('cardCount=' + cardCount);
if (chk['qwen-3-8-max'] !== '官网') bad.push('官网渠道徽标错误: ' + chk['qwen-3-8-max']);
if (chk['doubao-expert'] !== '官网 · 专家模式') bad.push('专家模式渠道错误: ' + chk['doubao-expert']);
if (chk['grok-4-6'] !== '真·官网') bad.push('grok 真·官网错误');
if (chk['glm-5-3-wb'] !== '火山方舟') bad.push('glm 火山方舟错误');
const q = catOrder['阿里 · 通义千问'] || [];
if (q.join('|') !== '通义千问 Qwen 3.8 Max|通义千问 Qwen 3.7 Plus|通义千问 Qwen 3.8 27B|通义千问 Qwen 3.6 27B|通义千问 Qwen 3.6 Flash') bad.push('qwen 顺序错误: ' + q.join('|'));
const g = catOrder['Google · Gemini'] || [];
if (g.join('|') !== 'Gemini 3.7 Flash|Gemini 3.6 Flash|Gemini 3.1 Pro') bad.push('gemini 顺序错误: ' + g.join('|'));
const d = catOrder['DeepSeek'] || [];
if (!d[0].startsWith('DeepSeek V4 Pro') || !d[4].startsWith('DeepSeek V4 Flash')) bad.push('deepseek pro/flash 顺序错误');
const gl = catOrder['智谱 · GLM'] || [];
if (gl[0] !== '智谱 GLM 5.3') bad.push('glm 顺序错误: ' + gl.join('|'));
if (errors.length) bad.push('console errors: ' + errors.join(' | '));
process.exitCode = bad.length ? 2 : 0;
console.log('CHECK:', bad.length ? 'FAIL - ' + bad.join(' ; ') : 'PASS');
