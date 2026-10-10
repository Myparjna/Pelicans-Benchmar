// 直接打开两个新源文件，定位哪个有 JS 语法错
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const puppeteer = require('C:/Users/mypra/AppData/Roaming/npm/node_modules/puppeteer-core');
import { pathToFileURL } from 'node:url';
import { join } from 'node:path';

const ROOT = 'C:/Users/mypra/Desktop/VibeCoding指南/skills测评项目/03-鹈鹕自行车测试';
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const files = ['qwen3.8flashAPI.html', 'ZAIglm5.3flash.html'];

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
});
for (const f of files) {
  const page = await browser.newPage();
  const errs = [];
  page.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text()); });
  page.on('pageerror', e => errs.push('PAGEERR ' + e.message));
  await page.setViewport({ width: 1280, height: 900 });
  const url = pathToFileURL(join(ROOT, f)).href;
  try {
    await page.goto(url, { waitUntil: 'load', timeout: 30000 });
    await new Promise(r => setTimeout(r, 1500));
  } catch (e) { errs.push('NAV ' + e.message); }
  console.log('==', f, '==');
  console.log(errs.join('\n') || '(无错误)');
  await page.close();
}
await browser.close();
