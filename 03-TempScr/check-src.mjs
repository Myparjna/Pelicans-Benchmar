import puppeteer from 'puppeteer-core';
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--force-color-profile=srgb'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
await page.goto('http://127.0.0.1:3000/', { waitUntil: 'networkidle0', timeout: 30000 });
await new Promise(r => setTimeout(r, 800));
await page.click('.site-card:first-child');
await new Promise(r => setTimeout(r, 1500));
const info = await page.evaluate(() => {
  const f = document.getElementById('viewerIframe');
  return { src: f.src, title: document.getElementById('viewerTitle').textContent };
});
console.log('iframe src:', info.src);
console.log('title:', info.title);
console.log('uses sites/ copy:', info.src.includes('/sites/'));
await page.screenshot({ path: 'C:/Users/mypra/Desktop/鹈鹕自行车测试/TempFiles/verification/10-viewer-sites-copy.png' });
// 再翻一页
await page.click('#btnNext');
await new Promise(r => setTimeout(r, 1500));
const info2 = await page.evaluate(() => ({ src: document.getElementById('viewerIframe').src }));
console.log('next iframe src:', info2.src);
await browser.close();
console.log('OK');
