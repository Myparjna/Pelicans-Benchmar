// 验证：27 卡结构调整（删 3.6flash 重复、改名/改渠道、opus5 缩略图重截）
import puppeteer from 'puppeteer-core';

const BASE = process.argv[2] || 'http://127.0.0.1:4173/index.html';
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const OUT = 'C:/Users/mypra/Desktop/鹈鹕自行车测试/TempFiles';

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

const EXPECT = {
  'qwen-3-6-flash': null,                        // 应已删除
  'gemini-3-7': { model: 'Gemini 3.7 Flash', channel: 'Poe' },
  'deepseek-v4-flash-0424-trae': { model: 'DeepSeek V4 Flash (0424)', channel: 'Trae' },
  'seed-2-1-pro-trae': { model: 'Seed 2.1 Pro', channel: 'Trae' },
  'doubao-expert': { model: '豆包 Doubao 0813 (专家模式)', channel: '官网风格 · 专家模式' },
  'glm-5-3-wb': { model: '智谱 GLM 5.3', channel: '火山方舟' },
  'opus-5-relay': { model: 'Claude Opus 5', channel: '中转API' },
  'qianwen-3-6-flash': { model: '通义千问 Qwen 3.6 Flash', channel: '官网风格' },
};

const results = {};
for (const [slug, exp] of Object.entries(EXPECT)) {
  try {
    const info = await page.$eval(`.site-card[data-slug="${slug}"]`, el => ({
      title: el.querySelector('.card-title')?.textContent?.trim(),
      channel: el.querySelector('.channel-badge')?.textContent?.trim(),
      imgHttp: 'ok',
    }));
    info.imgHttp = await page.evaluate(async src => {
      try { const r = await fetch(src); return r.status; } catch (e) { return 'err'; }
    }, await page.$eval(`.site-card[data-slug="${slug}"] img`, i => i.getAttribute('src')));
    if (exp) {
      results[slug] = { found: true, match: info.title === exp.model && info.channel === exp.channel, ...info };
    } else {
      results[slug] = { found: true, expectDeleted: true };
    }
  } catch (e) {
    results[slug] = { found: false, expectDeleted: !!exp === false ? false : true, err: e.message };
  }
}

// 分类：字节合并后不应再有 "字节 · Seed"
const cats = await page.$$eval('.category-name', els => els.map(e => e.textContent.trim()));

// iframe 抽查：opus5 + glm-5-3
const viewer = {};
for (const slug of ['opus-5-relay', 'glm-5-3-wb']) {
  try {
    const card = await page.$(`.site-card[data-slug="${slug}"]`);
    await card.click();
    await new Promise(r => setTimeout(r, 1500));
    viewer[slug] = await page.evaluate(() => ({
      title: document.getElementById('viewerTitle')?.textContent?.trim(),
      badge: document.getElementById('viewerBadge')?.textContent?.trim(),
      iframeSrc: document.getElementById('viewerIframe')?.src || '',
    }));
    await page.evaluate(() => document.getElementById('btnClose').click());
    await new Promise(r => setTimeout(r, 300));
  } catch (e) { viewer[slug] = { error: e.message }; }
}

await page.screenshot({ path: OUT + '/verify-updates-desktop.png', fullPage: true });
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
await new Promise(r => setTimeout(r, 600));
await page.screenshot({ path: OUT + '/verify-updates-mobile.png', fullPage: true });

console.log(JSON.stringify({ base: BASE, cardCount, results, cats, viewer, errors }, null, 2));
await browser.close();

const bad = [];
if (cardCount !== 27) bad.push('cardCount=' + cardCount);
if (results['qwen-3-6-flash']?.found) bad.push('qwen-3-6-flash 仍存在');
for (const [slug, exp] of Object.entries(EXPECT)) {
  if (exp && results[slug]?.match === false) bad.push(slug + ' 信息不匹配');
}
if (cats.includes('字节 · Seed')) bad.push('字节 · Seed 分类仍存在');
if (!viewer['opus-5-relay']?.iframeSrc?.includes('opus-5-relay.html')) bad.push('opus5 iframe 异常');
if (!viewer['glm-5-3-wb']?.iframeSrc?.includes('glm-5-3-wb.html')) bad.push('glm5.3 iframe 异常');
if (errors.length) bad.push('console errors: ' + errors.join(' | '));
process.exitCode = bad.length ? 2 : 0;
console.log('CHECK:', bad.length ? 'FAIL - ' + bad.join(' ; ') : 'PASS');
