import puppeteer from 'puppeteer-core';

const BASE = process.argv[2] || 'http://127.0.0.1:4173';
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const EXPECT = {
  'qwen-3-8-max': 10,
  'gpt-5-6-codex': 9,
  'deepseek-v4-pro-api-0813': 9,
  'kimi-k3-wb': 9,
  'opus-5-relay': 9
};

const sleep = ms => new Promise(r => setTimeout(r, ms));
const log = (...a) => console.log(...a);
let fail = 0;
function check(cond, msg) { if (cond) log('PASS', msg); else { log('FAIL', msg); fail++; } }

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--disable-setuid-sandbox']
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
const errors = [];
page.on('console', m => { if (m.type() === 'error' && !m.text().includes('favicon')) errors.push(m.text()); });
page.on('pageerror', e => errors.push(String(e)));

await page.goto(BASE + '/index.html', { waitUntil: 'networkidle2' });
// 清空本地评分，确保走默认分基线
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: 'networkidle2' });
await sleep(400);

log('--- 默认分读取 ---');
for (const [slug, exp] of Object.entries(EXPECT)) {
  const txt = await page.$eval(`.rating[data-slug="${slug}"] .rating-score`, el => el.textContent.trim());
  const ok = txt === `${exp} 分`;
  check(ok, `${slug} 评分="${txt}" (期望 ${exp} 分)`);
}

log('--- 卡片数 ---');
const count = await page.$$eval('.site-card', els => els.length);
check(count === 24, `卡片数=${count} (期望 24)`);

log('--- 排序视图 ---');
await page.click('#sortToggle');
await sleep(400);
const topSlug = await page.$eval('.site-grid .site-card:first-child', el => el.dataset.slug);
check(topSlug === 'qwen-3-8-max', `排序后 No.1=${topSlug} (期望 qwen-3-8-max)`);
// 取前 6 名 slug，确认 5 个默认分条目都在前列且排在未评分之前
const top6 = await page.$$eval('.site-grid .site-card', els => els.slice(0, 6).map(e => e.dataset.slug));
const allDefaultPresent = Object.keys(EXPECT).every(s => top6.includes(s));
check(allDefaultPresent, `前 6 名包含全部默认分条目: ${top6.join(', ')}`);

log('--- 用户手动覆盖优先 ---');
// 给一个默认分条目改分，应覆盖默认
await page.click(`.rating[data-slug="kimi-k3-wb"] .rating-btn[data-score="6"]`);
await sleep(200);
const kimiTxt = await page.$eval(`.rating[data-slug="kimi-k3-wb"] .rating-score`, el => el.textContent.trim());
check(kimiTxt === '6 分', `kimi 手动改后=${kimiTxt} (期望 6 分)`);

log('--- 控制台错误 ---');
check(errors.length === 0, `无 console 报错 (${errors.length})` + (errors.length ? ' :: ' + errors.join(' | ') : ''));

await browser.close();
log(`\n==== 结果: ${fail === 0 ? '全部通过' : fail + ' 项失败'} ====`);
process.exit(fail === 0 ? 0 : 1);
