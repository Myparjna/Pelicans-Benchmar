// step-5-preview 鹈鹕动画视口验证脚本：桌面横屏与手机竖屏，覆盖三种天气状态
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);
const puppeteer = require('puppeteer-core');

const ROOT = 'C:/Users/mypra/Desktop/VibeCoding指南/skills测评项目/03-鹈鹕自行车测试';
const OUT = join(ROOT, '02-TempFiles');
mkdirSync(OUT, { recursive: true });

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const URL = pathToFileURL(join(ROOT, 'step-5-preview-10月5日-鹈鹕白天骑自行车动画.html')).href;

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--force-color-profile=srgb', '--hide-scrollbars'],
});

const jobs = [
  { name: 'pc-1440x900', width: 1440, height: 900, deviceScaleFactor: 1 },
  { name: 'mobile-390x844', width: 390, height: 844, deviceScaleFactor: 2, isMobile: true },
];

for (const job of jobs) {
  const page = await browser.newPage();
  try {
    await page.setViewport({
      width: job.width,
      height: job.height,
      deviceScaleFactor: job.deviceScaleFactor,
      isMobile: !!job.isMobile,
      hasTouch: !!job.isMobile,
    });
    await page.goto(URL, { waitUntil: 'load', timeout: 30000 });
    await new Promise(r => setTimeout(r, 1500));
    await page.screenshot({ path: join(OUT, `step5preview-${job.name}-sunny.png`) });
    await new Promise(r => setTimeout(r, 5500));
    await page.screenshot({ path: join(OUT, `step5preview-${job.name}-cloudy.png`) });
    await new Promise(r => setTimeout(r, 5500));
    await page.screenshot({ path: join(OUT, `step5preview-${job.name}-rainy.png`) });

    const info = await page.evaluate(() => {
      const stage = document.getElementById('stage');
      const rect = stage.getBoundingClientRect();
      return {
        weather: document.getElementById('wName').textContent,
        stageClass: stage.className,
        stageRect: { w: Math.round(rect.width), h: Math.round(rect.height) },
        docScrollW: document.documentElement.scrollWidth,
        innerW: window.innerWidth,
        innerH: window.innerHeight,
      };
    });
    console.log(job.name, JSON.stringify(info));
  } catch (e) {
    console.error('FAIL', job.name, e.message);
  } finally {
    await page.close();
  }
}

await browser.close();
console.log('完成');
