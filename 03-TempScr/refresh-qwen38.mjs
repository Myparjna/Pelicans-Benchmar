import puppeteer from 'puppeteer-core';
import { copyFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = 'C:/Users/mypra/Desktop/鹈鹕自行车测试';
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const slug = 'qwen-3-8-max';

// 1. 复制正确文件到 sites/ 副本
copyFileSync(join(ROOT, 'qwen3.8max.html'), join(ROOT, 'sites', slug + '.html'));
console.log('已更新 sites/' + slug + '.html');

// 2. 重截缩略图
const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--force-color-profile=srgb'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 900, deviceScaleFactor: 1 });
await page.goto('file://' + join(ROOT, 'qwen3.8max.html'), { waitUntil: 'load', timeout: 30000 });
await new Promise(r => setTimeout(r, 1800));
await page.screenshot({ path: join(ROOT, 'thumbs', slug + '.png'), fullPage: true });
await browser.close();
console.log('已重截 thumbs/' + slug + '.png');
