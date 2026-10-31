import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const puppeteer = require('C:/Users/mypra/AppData/Roaming/npm/node_modules/puppeteer-core');
const BASE = process.argv[2] || 'https://peilika.pages.dev';
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox','--disable-setuid-sandbox','--disable-gpu'] });
const page = await browser.newPage();
const errors = [];
page.on('pageerror', e => errors.push('pageerror: ' + e.message));
await page.goto(BASE, { waitUntil: 'networkidle0', timeout: 30000 });
await page.waitForSelector('.site-card');
const result = {
  cardCount: await page.$$eval('.site-card', els => els.length),
  hasGrokStandard: await page.$$eval('.site-card[data-slug="grok-4-5"]', els => els.length),
  hasGrokReal: await page.$$eval('.site-card[data-slug="grok-4-5-real"]', els => els.length),
  consoleErrors: errors,
};
console.log(JSON.stringify(result, null, 2));
await browser.close();
