// 验证导出评分 JSON：拦截 a.click 的 download，捕获 JSON 内容
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
const cdp = await page.target().createCDPSession();
await cdp.send('Browser.setDownloadBehavior', {
  behavior: 'allow',
  downloadPath: OUT,
});

const errors = [];
page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)\.com/.test(m.location()?.url || '')) errors.push(m.text()); });
page.on('pageerror', e => errors.push(e.message));

await page.setViewport({ width: 1280, height: 900 });
await page.goto(BASE, { waitUntil: 'networkidle2', timeout: 30000 });
await new Promise(r => setTimeout(r, 1000));

// 1) 按钮存在
const btnExists = await page.$('#exportRatings') !== null;

// 2) 先用 localStorage 模拟修改一些评分，让导出包含用户自定义
await page.evaluate(() => {
  const base = JSON.parse(localStorage.getItem('peilika_ratings_v1') || '{}');
  base['qwen-3-8-max'] = 8;  // 用户手动覆盖（默认 10）
  base['doubao-expert'] = 7;  // 用户手动评分（默认无）
  localStorage.setItem('peilika_ratings_v1', JSON.stringify(base));
  // 触发一次重读
  location.reload();
});
await new Promise(r => setTimeout(r, 1500));

// 3) 抓 Blob URL
const blobUrlPromise = page.waitForFunction(() => {
  const btn = document.getElementById('exportRatings');
  if (btn) btn.click();
  return true;
}, { timeout: 3000 });

// 改用 evaluate 直接调导出函数
const exported = await page.evaluate(() => {
  // 用导出函数返回的 JSON 字符串
  return new Promise((resolve) => {
    const origCreate = URL.createObjectURL;
    let captured = null;
    URL.createObjectURL = function(blob) {
      blob.text().then(t => { captured = t; });
      const url = origCreate.call(this, blob);
      // 触发点击下载流程
      const a = document.createElement('a');
      a.href = url;
      a.download = 'peilika-ratings-test.json';
      a.click();
      setTimeout(() => {
        URL.createObjectURL = origCreate;
        URL.revokeObjectURL(url);
        resolve(captured);
      }, 800);
      return url;
    };
    document.getElementById('exportRatings').click();
  });
});

let parsed = null;
try { parsed = JSON.parse(exported); } catch (e) {}
console.log(JSON.stringify({
  btnExists,
  filename: 'peilika-ratings-' + new Date().toISOString().slice(0, 10) + '.json',
  rawJson: exported?.slice(0, 800),
  parsed,
  errors,
}, null, 2));
await browser.close();
process.exitCode = (!btnExists || !parsed || parsed.schema !== 'peilika-ratings/v1' || errors.length > 0) ? 2 : 0;
