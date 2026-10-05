const { chromium } = require('C:/Users/mypra/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
(async () => {
  const root = path.resolve(__dirname, '..');
  const output = path.join(root, '02-TempFiles', 'gpt6.1sol-validation');
  fs.mkdirSync(output, { recursive: true });
  const browser = await chromium.launchPersistentContext(path.join(root, '02-TempFiles', 'chrome-profile-gpt6.1sol-validation-9303'), {
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: true,
    args: ['--remote-debugging-port=9303'],
    viewport: { width: 1440, height: 900 }
  });
  const errors = [];
  const results = [];
  try {
    const page = await browser.newPage();
    page.on('pageerror', error => errors.push(error.message));
    const requests = [];
    page.on('request', request => requests.push(request.url()));
    await page.goto('http://127.0.0.1:8766/gpt6.1sol.html');
    await page.waitForFunction(() => Number(document.querySelector('canvas').dataset.elapsed) > .1);
    await page.getByRole('button', { name: '暂停动画', exact: true }).click();
    await page.screenshot({ path: path.join(output, 'desktop-sunny.png') });
    assert.equal(await page.locator('canvas').getAttribute('data-weather'), '晴天');
    const before = Number(await page.locator('canvas').getAttribute('data-elapsed'));
    await page.waitForTimeout(300);
    assert.equal(Number(await page.locator('canvas').getAttribute('data-elapsed')), before);
    results.push('暂停按钮冻结骑行与天气时间');
    await page.getByRole('button', { name: '继续动画', exact: true }).click();
    for (const [time, state] of [[5.1, '阴天'], [10.1, '雨天'], [15.1, '晴天']]) {
      await page.waitForFunction(t => Number(document.querySelector('canvas').dataset.elapsed) >= t, time);
      assert.equal(await page.locator('canvas').getAttribute('data-weather'), state);
      if (state === '雨天') {
        await page.waitForTimeout(1200);
        await page.screenshot({ path: path.join(output, 'desktop-rain.png') });
      }
      results.push(`${time} 秒天气：${state}`);
    }
    await page.getByRole('button', { name: '阴天', exact: true }).click();
    assert.equal(await page.locator('canvas').getAttribute('data-weather'), '阴天');
    results.push('天气选择按钮生效');
    for (const [width, height, name] of [[390, 844, 'mobile'], [360, 640, 'mobile-small'], [844, 390, 'mobile-landscape'], [1920, 1080, 'desktop-large']]) {
      await page.setViewportSize({ width, height });
      await page.getByRole('button', { name: '晴天', exact: true }).click();
      await page.waitForTimeout(1400);
      const layout = await page.evaluate(() => {
        const canvas = document.querySelector('canvas');
        const intro = document.querySelector('.intro').getBoundingClientRect();
        const footer = document.querySelector('footer').getBoundingClientRect();
        return { width: innerWidth, height: innerHeight, scrollWidth: document.documentElement.scrollWidth, canvasWidth: canvas.clientWidth, introBottom: intro.bottom, footerTop: footer.top };
      });
      assert.equal(layout.width, layout.scrollWidth);
      assert.equal(layout.canvasWidth, width);
      assert.ok(layout.introBottom < layout.footerTop);
      await page.screenshot({ path: path.join(output, `${name}-sunny.png`) });
      results.push(`${width}×${height} 布局通过`);
    }
    assert.deepEqual(errors, []);
    assert.ok(requests.every(url => url.startsWith('http://127.0.0.1:8766/')));
    const offline = await browser.newPage();
    await offline.goto('file:///' + path.join(root, 'gpt6.1sol.html').replaceAll('\\', '/'));
    await offline.waitForFunction(() => Number(document.querySelector('canvas').dataset.elapsed) > .1);
    assert.equal(await offline.locator('canvas').getAttribute('data-weather'), '晴天');
    results.push('本地文件直接打开通过；外部资源请求为零；浏览器脚本错误为零');
    fs.writeFileSync(path.join(output, 'results.json'), JSON.stringify({ results, errors }, null, 2));
    console.log(JSON.stringify({ results, errors }, null, 2));
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
