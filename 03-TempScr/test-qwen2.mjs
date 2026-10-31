import puppeteer from 'puppeteer-core';
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--force-color-profile=srgb', '--disable-background-timer-throttling', '--disable-renderer-backgrounding'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 900, deviceScaleFactor: 1 });
await page.goto('file:///C:/Users/mypra/Desktop/鹈鹕自行车测试/qwen3.6flash官网.html', { waitUntil: 'load', timeout: 30000 });
await new Promise(r => setTimeout(r, 2000));
// check visibilityState
const state = await page.evaluate(() => ({ hidden: document.hidden, state: document.visibilityState }));
console.log('visibility:', state);
// try to manually call render a few times
for (let i = 0; i < 3; i++) {
  await page.evaluate(() => { if (typeof render === 'function') render(performance.now()); });
  await new Promise(r => setTimeout(r, 500));
}
await page.screenshot({ path: 'C:/Users/mypra/Desktop/鹈鹕自行车测试/TempFiles/qwen-test-manual.png', fullPage: true });
console.log('done manual');
await browser.close();
