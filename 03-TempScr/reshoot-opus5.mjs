// 重截 opus-5-relay 缩略图（延长等待让 canvas 动画起来），并统计新旧缩略图像素质量
import puppeteer from 'puppeteer-core';
import { pathToFileURL } from 'node:url';
import { join } from 'node:path';

const ROOT = 'C:/Users/mypra/Desktop/鹈鹕自行车测试';
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--force-color-profile=srgb', '--hide-scrollbars'],
});

// 1) 重截 opus5
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 900, deviceScaleFactor: 1 });
await page.goto(pathToFileURL(join(ROOT, '中转API的opus5.html')).href, { waitUntil: 'load', timeout: 30000 });
await new Promise(r => setTimeout(r, 3500));
const out = join(ROOT, 'thumbs', 'opus-5-relay.png');
await page.screenshot({ path: out, fullPage: true });
console.log('重截完成:', out);
await page.close();

// 2) 像素统计：新 opus5 + qianwen-3-6-flash + 旧 opus5(Trash)
async function stats(file) {
  const p = await browser.newPage();
  const url = 'file:///' + file.replace(/\\/g, '/');
  await p.goto(url, { waitUntil: 'load', timeout: 30000 });
  const r = await p.evaluate(async () => {
    const img = document.images[0];
    await img.decode();
    const cv = document.createElement('canvas');
    cv.width = img.naturalWidth; cv.height = img.naturalHeight;
    const ctx = cv.getContext('2d');
    ctx.drawImage(img, 0, 0);
    const d = ctx.getImageData(0, 0, cv.width, cv.height).data;
    let sum = 0, colors = new Set(), nonBlack = 0, nonWhite = 0, n = 0;
    for (let i = 0; i < d.length; i += 4) {
      const r = d[i], g = d[i + 1], b = d[i + 2];
      sum += r + g + b;
      if (n % 97 === 0) colors.add((r >> 4) << 8 | (g >> 4) << 4 | (b >> 4));
      if (r + g + b > 40) nonBlack++;
      if (r + g + b < 700) nonWhite++;
      n++;
    }
    return {
      w: cv.width, h: cv.height,
      avgBrightness: (sum / (n * 3)).toFixed(0),
      distinctColors: colors.size,
      nonBlackRatio: (nonBlack / n).toFixed(2),
      nonWhiteRatio: (nonWhite / n).toFixed(2),
    };
  });
  await p.close();
  return r;
}

console.log('新 opus-5-relay.png :', JSON.stringify(await stats(join(ROOT, 'thumbs', 'opus-5-relay.png'))));
console.log('qianwen-3-6-flash.png:', JSON.stringify(await stats(join(ROOT, 'thumbs', 'qianwen-3-6-flash.png'))));
console.log('旧 opus-5-relay.png   :', JSON.stringify(await stats(join(ROOT, 'Trash', 'opus-5-relay.png'))));
await browser.close();
