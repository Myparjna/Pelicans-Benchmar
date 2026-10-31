// 单独为新增的单个站点截图（不触碰其它站点与 sites-data.js）
import puppeteer from 'puppeteer-core';
import { pathToFileURL } from 'node:url';
import { join } from 'node:path';

const ROOT = 'C:/Users/mypra/Desktop/鹈鹕自行车测试';
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';

const file = process.argv[2];   // 原始文件名
const slug = process.argv[3];   // 缩略图/站点 slug

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
  await new Promise(r => setTimeout(r, 1600)); // 等字体/动画
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
