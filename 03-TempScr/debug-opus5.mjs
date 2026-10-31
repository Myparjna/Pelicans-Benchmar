// 调查：Claude Opus 5 页面打开是否黑屏 / 报错
import puppeteer from 'puppeteer-core';
import { pathToFileURL } from 'node:url';
import { join } from 'node:path';

const ROOT = 'C:/Users/mypra/Desktop/鹈鹕自行车测试';
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});
const page = await browser.newPage();
const logs = [];
page.on('console', m => logs.push(`[${m.type()}] ${m.text()}`));
page.on('pageerror', e => logs.push('[pageerror] ' + e.message));
page.on('requestfailed', r => logs.push('[requestfailed] ' + r.url() + ' :: ' + (r.failure()?.errorText || '')));

await page.setViewport({ width: 1280, height: 900 });
const url = pathToFileURL(join(ROOT, '中转API的opus5.html')).href;
await page.goto(url, { waitUntil: 'load', timeout: 30000 });
await new Promise(r => setTimeout(r, 2500));

const state = await page.evaluate(() => {
  const cv = document.getElementById('cv');
  const px = cv ? cv.getContext('2d').getImageData(0, 0, Math.min(cv.width, 40), Math.min(cv.height, 40)).data : null;
  let nonBlack = 0, total = 0;
  if (px) {
    for (let i = 0; i < px.length; i += 4) {
      total++;
      if (px[i] + px[i + 1] + px[i + 2] > 30) nonBlack++;
    }
  }
  return {
    hasCanvas: !!cv, cvSize: cv ? cv.width + 'x' + cv.height : null,
    bodyBg: getComputedStyle(document.body).backgroundColor,
    nonBlackRatio: total ? (nonBlack / total).toFixed(3) : null,
    bodyChildren: document.body.children.length,
  };
});
const shot = join(ROOT, 'TempFiles', 'opus5-debug.png');
await page.screenshot({ path: shot });

console.log(JSON.stringify({ url, state, logs }, null, 2));
await browser.close();
