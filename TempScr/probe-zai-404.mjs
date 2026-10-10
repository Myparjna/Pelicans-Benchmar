// 抓 ZAI 副本的 4xx 资源列表
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const puppeteer = require('C:/Users/mypra/AppData/Roaming/npm/node_modules/puppeteer-core');

const browser = await puppeteer.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: 'new',
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
});
const page = await browser.newPage();
const bad = [];
page.on('response', r => { if (r.status() >= 400) bad.push(r.status() + ' ' + r.url()); });
await page.setViewport({ width: 1280, height: 900 });
try {
  await page.goto('http://127.0.0.1:4173/sites/glm-5-3-flash-zai.html', { waitUntil: 'networkidle2', timeout: 30000 });
} catch (e) { console.log('NAV', e.message); }
await new Promise(r => setTimeout(r, 1500));
console.log('bad responses:');
for (const b of bad) console.log('  ' + b);
await browser.close();
