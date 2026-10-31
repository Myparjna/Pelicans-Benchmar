import puppeteer from 'puppeteer-core';
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const browser = await puppeteer.launch({
  executablePath: CHROME, headless: 'new',
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--force-color-profile=srgb'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
await page.goto('http://127.0.0.1:3000/', { waitUntil: 'networkidle0', timeout: 30000 });
await new Promise(r => setTimeout(r, 600));
// 搜索 3.8 过滤
await page.type('#searchInput', '3.8');
await new Promise(r => setTimeout(r, 500));
await page.click('.site-card:first-child');
await new Promise(r => setTimeout(r, 1500));
const info = await page.evaluate(() => ({
  src: document.getElementById('viewerIframe').src,
  title: document.getElementById('viewerTitle').textContent,
  file: document.querySelector('.card-file') ? document.querySelector('.card-file').textContent : '',
}));
console.log('title:', info.title);
console.log('iframe src:', info.src);
console.log('指向 qwen3.8max.html:', info.src.endsWith('/sites/qwen-3-8-max.html') || info.src.includes('qwen3.8max'));
await page.screenshot({ path: 'C:/Users/mypra/Desktop/鹈鹕自行车测试/TempFiles/verification/11-qwen38-viewer.png' });
await browser.close();
console.log('OK');
