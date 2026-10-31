// 展厅验证脚本：用 CDP 驱动 Chrome，模拟真实用户操作并截图
import puppeteer from 'puppeteer-core';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const OUT = 'C:/Users/mypra/Desktop/鹈鹕自行车测试/TempFiles/verification';
mkdirSync(OUT, { recursive: true });

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function screenshot(page, name) {
  const path = join(OUT, name + '.png');
  await page.screenshot({ path, fullPage: false });
  console.log('screenshot:', path);
}

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-gpu',
    '--remote-debugging-port=9223',
    '--user-data-dir=C:/Users/mypra/Desktop/鹈鹕自行车测试/TempFiles/chrome-user-data-9223',
    '--force-color-profile=srgb',
  ],
});

let ok = true;

try {
  // 1. 桌面端打开展厅
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  await page.goto('http://127.0.0.1:3000/', { waitUntil: 'networkidle0', timeout: 30000 });
  await sleep(800);
  await screenshot(page, '01-desktop-gallery');

  // 2. 点击分类筛选
  await page.click('.filter-chip:not(.active):nth-child(2)');
  await sleep(600);
  await screenshot(page, '02-desktop-filtered');

  // 3. 点击第一张卡片打开查看器
  await page.click('.site-card:first-child');
  await sleep(1200);
  await screenshot(page, '03-desktop-viewer-open');

  // 4. 下一个
  await page.click('#btnNext');
  await sleep(1000);
  await screenshot(page, '04-desktop-viewer-next');

  // 5. 上一个
  await page.click('#btnPrev');
  await sleep(1000);
  await screenshot(page, '05-desktop-viewer-prev');

  // 6. 关闭查看器
  await page.click('#btnClose');
  await sleep(400);
  await screenshot(page, '06-desktop-viewer-close');

  // 7. 移动端
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true });
  await page.goto('http://127.0.0.1:3000/', { waitUntil: 'networkidle0', timeout: 30000 });
  await sleep(800);
  await screenshot(page, '07-mobile-gallery');

  // 8. 移动端打开查看器
  await page.click('.site-card:first-child');
  await sleep(1200);
  await screenshot(page, '08-mobile-viewer');

  // 9. 按 Esc 关闭
  await page.keyboard.press('Escape');
  await sleep(400);
  await screenshot(page, '09-mobile-viewer-close');

  console.log('\n验证完成，截图保存到', OUT);
} catch (e) {
  ok = false;
  console.error('\n验证失败:', e.message);
  console.error(e.stack);
} finally {
  await browser.close();
}

process.exit(ok ? 0 : 1);
