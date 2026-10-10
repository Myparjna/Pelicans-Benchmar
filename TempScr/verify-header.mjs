// 验证 header 日期 + 副标 32
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const puppeteer = require('C:/Users/mypra/AppData/Roaming/npm/node_modules/puppeteer-core');

const BASE = process.argv[2] || 'http://127.0.0.1:4173/index.html';
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 200 });
await page.goto(BASE, { waitUntil: 'networkidle2', timeout: 30000 });
await new Promise(r => setTimeout(r, 800));
const data = await page.evaluate(() => ({
  h1: document.querySelector('h1')?.textContent?.trim(),
  sub: document.querySelector('.subtitle')?.textContent?.trim(),
}));
console.log(JSON.stringify(data, null, 2));
await browser.close();
const ok = data.h1?.includes('2026-08-31') && data.sub?.includes('32');
process.exitCode = ok ? 0 : 2;
