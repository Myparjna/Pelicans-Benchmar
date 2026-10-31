// 截 header 区
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
await page.setViewport({ width: 1280, height: 200 });
await page.goto(BASE, { waitUntil: 'networkidle2', timeout: 30000 });
await new Promise(r => setTimeout(r, 1000));
await page.screenshot({ path: `${OUT}/export-btn-header.png` });

// 触发后状态截图
await page.click('#exportRatings');
await new Promise(r => setTimeout(r, 300));
await page.screenshot({ path: `${OUT}/export-btn-clicked.png` });
await browser.close();
console.log('OK');
