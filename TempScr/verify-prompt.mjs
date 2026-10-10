// 验证：提示词条位于页头标题右侧（header 内），两行、点击复制、移动端换行
import puppeteer from 'puppeteer-core';

const BASE = process.argv[2] || 'http://127.0.0.1:4173/index.html';
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
});
await browser.defaultBrowserContext().overridePermissions(BASE.split('/').slice(0, 3).join('/'), ['clipboard-read', 'clipboard-write']);
const page = await browser.newPage();
const errors = [];
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', e => errors.push(e.message));

await page.setViewport({ width: 1280, height: 900 });
await page.goto(BASE, { waitUntil: 'networkidle2', timeout: 30000 });
await new Promise(r => setTimeout(r, 900));

const info = await page.evaluate(() => {
  const box = document.getElementById('promptBox');
  const header = document.querySelector('.site-header');
  const brand = document.querySelector('.brand');
  const actions = document.querySelector('.header-actions');
  const br = box.getBoundingClientRect(), hr = header.getBoundingClientRect(),
        brandR = brand.getBoundingClientRect(), ar = actions.getBoundingClientRect();
  return {
    exists: !!box,
    inHeader: header.contains(box),
    rightOfBrand: br.left >= brandR.right - 2,
    beforeActions: br.right <= ar.left + 2,
    lineCount: box.querySelectorAll('.prompt-line').length,
    lines: [...box.querySelectorAll('.prompt-line')].map(p => p.textContent.trim()),
    hasCopyText: !!box.querySelector('#promptCopyText'),
    iconClass: box.querySelector('#promptCopyIcon')?.className || '',
    boxWidth: Math.round(br.width),
  };
});

await page.evaluate(() => document.getElementById('promptBox').click());
await new Promise(r => setTimeout(r, 400));
const afterClick = await page.evaluate(() => ({
  copiedClass: document.getElementById('promptBox').classList.contains('copied'),
  iconClass: document.getElementById('promptCopyIcon')?.className || '',
}));
await new Promise(r => setTimeout(r, 1800));
const afterRestore = await page.evaluate(() => document.getElementById('promptCopyIcon')?.className || '');
const clipboardText = await page.evaluate(() => navigator.clipboard.readText()).catch(() => '(读取失败)');

// 移动端：prompt-box 全宽、在 brand 下方
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
await new Promise(r => setTimeout(r, 500));
const mobile = await page.evaluate(() => {
  const box = document.getElementById('promptBox');
  const brand = document.querySelector('.brand');
  const br = box.getBoundingClientRect(), brandR = brand.getBoundingClientRect();
  return { fits: br.width <= innerWidth, belowBrand: br.top >= brandR.bottom - 2, width: Math.round(br.width) };
});

console.log(JSON.stringify({ info, afterClick, afterRestore, clipboardText, mobile, errors }, null, 2));
await browser.close();

const EXP = '生成一个鹈鹕白天骑自行车的网页动画，单个html文件给我，要求能自适应网页宽度，兼容手机竖屏与电脑横屏显示。每过5秒进行晴天-阴天-雨天-晴天的天气自动切换。不使用任何skills。';
const bad = [];
if (!info.exists || !info.inHeader) bad.push('不在 header 内');
if (!info.rightOfBrand) bad.push('不在标题右侧');
if (!info.beforeActions) bad.push('不在搜索/排序之前');
if (info.lineCount !== 1 || info.lines[0] !== EXP) bad.push('文本不一致');
if (info.hasCopyText) bad.push('仍有文字提示');
if (!info.iconClass.includes('ti-copy')) bad.push('无复制图标');
if (!afterClick.copiedClass || !afterClick.iconClass.includes('ti-check')) bad.push('复制反馈异常');
if (!afterRestore.includes('ti-copy')) bad.push('图标未恢复');
if (clipboardText !== EXP) bad.push('剪贴板内容不一致');
if (!mobile.fits || !mobile.belowBrand) bad.push('移动端布局异常');
if (errors.length) bad.push('console errors: ' + errors.join(' | '));
process.exitCode = bad.length ? 2 : 0;
console.log('CHECK:', bad.length ? 'FAIL - ' + bad.join(' ; ') : 'PASS');
