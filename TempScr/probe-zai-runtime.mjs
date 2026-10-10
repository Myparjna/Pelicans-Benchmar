// 探针：单独打开 ZAI 副本抓所有 console + pageerror，2s 后看 cv 状态
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const puppeteer = require('C:/Users/mypra/AppData/Roaming/npm/node_modules/puppeteer-core');

const browser = await puppeteer.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: 'new',
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
});
const page = await browser.newPage();
const all = [];
page.on('console', m => { all.push(m.type().toUpperCase() + ' ' + m.text() + ' @' + JSON.stringify(m.location())); });
page.on('pageerror', e => all.push('PAGEERR ' + e.message + ' @' + e.stack));
await page.setViewport({ width: 1280, height: 900 });
try { await page.goto('http://127.0.0.1:4173/sites/glm-5-3-flash-zai.html', { waitUntil: 'networkidle2', timeout: 30000 }); } catch (e) { all.push('NAV ' + e.message); }
await new Promise(r => setTimeout(r, 2000));

// 抓关键 DOM 状态
const state = await page.evaluate(() => {
  const cv = document.getElementById('cv') || document.querySelector('canvas');
  return {
    cvTag: cv?.tagName,
    cvW: cv?.width, cvH: cv?.height,
    bodyHTMLLen: document.body?.innerHTML.length,
    hasPelican: !!document.querySelector('svg, [class*="pelican"], [id*="pelican"]'),
    hasSky: !!document.querySelector('[class*="sky"], [id*="sky"]'),
    firstSvg: document.querySelector('svg')?.outerHTML?.slice(0, 200),
  };
}).catch(e => ({ error: e.message }));

console.log('=== events ===');
for (const e of all) console.log('  ' + e);
console.log('=== state ===');
console.log(JSON.stringify(state, null, 2));
await browser.close();
