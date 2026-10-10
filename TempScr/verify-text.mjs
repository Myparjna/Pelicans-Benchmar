import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const puppeteer = require('C:/Users/mypra/AppData/Roaming/npm/node_modules/puppeteer-core');
const BASE = process.argv[2] || 'https://peilika.pages.dev';
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox','--disable-setuid-sandbox','--disable-gpu'] });
const page = await browser.newPage();
await page.goto(BASE, { waitUntil: 'networkidle0', timeout: 30000 });
const result = {
  title: await page.title(),
  h1: await page.$eval('h1', el => el.textContent.trim()),
};
console.log(JSON.stringify(result, null, 2));
await browser.close();
