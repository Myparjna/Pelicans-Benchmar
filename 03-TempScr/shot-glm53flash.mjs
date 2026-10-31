// 单独为 glm-5-3-flash-zhipu 截图（不触碰其它站点）
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const puppeteer = require('C:/Users/mypra/AppData/Roaming/npm/node_modules/puppeteer-core');
import { pathToFileURL } from 'node:url';
import { join } from 'node:path';

const ROOT = 'C:/Users/mypra/Desktop/VibeCoding指南/skills测评项目/03-鹈鹕自行车测试';
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';

const file = '智谱官网glm5.3flash.html';
const slug = 'glm-5-3-flash-zhipu';

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--force-color-profile=srgb', '--hide-scrollbars'],
});

const page = await browser.newPage();
try {
  await page.setViewport({ width: 1280, height: 900, deviceScaleFactor: 1 });
  const url = pathToFileURL(join(ROOT, file)).href;
  await page.goto(url, { waitUntil: 'load', timeout: 30000 });
  await new Promise(r => setTimeout(r, 1600));
  const out = join(ROOT, 'thumbs', slug + '.png');
  await page.screenshot({ path: out, fullPage: true });
  console.log('OK  ', slug, '->', out);
} catch (e) {
  console.error('FAIL', slug, file, '|', e.message);
  process.exitCode = 1;
} finally {
  await page.close();
}
await browser.close();
