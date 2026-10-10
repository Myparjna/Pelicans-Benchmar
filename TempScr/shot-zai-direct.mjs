// 直接打开 ZAI 副本，3s 后截图
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const puppeteer = require('C:/Users/mypra/AppData/Roaming/npm/node_modules/puppeteer-core');

const browser = await puppeteer.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: 'new',
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 900 });
await page.goto('http://127.0.0.1:4173/sites/glm-5-3-flash-zai.html', { waitUntil: 'load', timeout: 30000 });
await new Promise(r => setTimeout(r, 3000));
await page.screenshot({ path: 'C:/Users/mypra/Desktop/VibeCoding指南/skills测评项目/03-鹈鹕自行车测试/TempFiles/probe-zai-direct.png' });
await browser.close();
console.log('OK');
