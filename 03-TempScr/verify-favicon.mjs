import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const puppeteer = require('C:/Users/mypra/AppData/Roaming/npm/node_modules/puppeteer-core');

const BASE = process.argv[2] || 'https://peilika.pages.dev';
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
});
const page = await browser.newPage();
const errors = [];
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', e => errors.push('pageerror: ' + e.message));
page.on('requestfailed', r => errors.push('requestfailed: ' + r.url() + ' ' + (r.failure() && r.failure().errorText)));

await page.goto(BASE, { waitUntil: 'networkidle0', timeout: 30000 });
await page.waitForSelector('.brand-icon');

const result = { base: BASE };
result.faviconHref = await page.$eval('link[rel="icon"]', el => el.href).catch(() => null);
result.brandTag = await page.$eval('.brand-icon', el => el.tagName.toLowerCase());
result.brandSrc = await page.$eval('.brand-icon', el => el.currentSrc || el.src).catch(() => null);
result.brandLoaded = await page.$eval('.brand-icon', el => el.complete && el.naturalWidth > 0).catch(() => false);
result.faviconStatus = await page.evaluate(async () => {
  const link = document.querySelector('link[rel="icon"]');
  if (!link) return 'no-link';
  try {
    const r = await fetch(link.href, { method: 'HEAD' });
    return r.status;
  } catch (e) { return 'fetch-error'; }
});
result.consoleErrors = errors;
console.log(JSON.stringify(result, null, 2));
await browser.close();
