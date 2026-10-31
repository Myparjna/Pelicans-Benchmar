import puppeteer from 'puppeteer-core';
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-gpu',
    '--force-color-profile=srgb',
    '--disable-background-timer-throttling',
    '--disable-renderer-backgrounding',
    '--disable-features=IsolateOrigins,site-per-process',
    '--force-device-scale-factor=1',
  ],
});
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 900, deviceScaleFactor: 1 });
await page.goto('file:///C:/Users/mypra/Desktop/鹈鹕自行车测试/qwen3.6flash官网.html', { waitUntil: 'load', timeout: 30000 });
await new Promise(r => setTimeout(r, 5000));
await page.screenshot({ path: 'C:/Users/mypra/Desktop/鹈鹕自行车测试/TempFiles/qwen-test-5s.png', fullPage: true });
// Try to trigger a click/focus maybe? Some animations only run after user gesture? No.
await page.evaluate(() => { window.scrollTo(0,0); });
await new Promise(r => setTimeout(r, 2000));
await page.screenshot({ path: 'C:/Users/mypra/Desktop/鹈鹕自行车测试/TempFiles/qwen-test-7s.png', fullPage: true });
console.log('done');
await browser.close();
