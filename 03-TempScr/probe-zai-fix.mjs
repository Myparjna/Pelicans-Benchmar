// 验证补丁后 ZAI 副本无 JS 语法错（过滤 google fonts 网络错误）
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const puppeteer = require('C:/Users/mypra/AppData/Roaming/npm/node_modules/puppeteer-core');

const URLS = [
  'http://127.0.0.1:4173/sites/glm-5-3-flash-zai.html',
  'http://127.0.0.1:4173/sites/qwen-3-8-flash-api.html',
];

const browser = await puppeteer.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: 'new',
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
});
for (const u of URLS) {
  const page = await browser.newPage();
  const errs = [];
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.gstatic/.test(m.text())) errs.push('CONSOLE ' + m.text()); });
  page.on('pageerror', e => errs.push('PAGEERR ' + e.message));
  page.on('requestfailed', r => {
    if (/fonts\.gstatic/.test(r.url())) return;
    errs.push('REQ-FAIL ' + r.url() + ' ' + r.failure()?.errorText);
  });
  await page.setViewport({ width: 1280, height: 900 });
  try { await page.goto(u, { waitUntil: 'load', timeout: 30000 }); await new Promise(r => setTimeout(r, 1500)); } catch (e) { errs.push('NAV ' + e.message); }
  console.log('==', u, '==');
  console.log(errs.join('\n') || '(无错误)');
  await page.close();
}
await browser.close();
