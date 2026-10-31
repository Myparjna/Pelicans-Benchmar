const fs = require('fs');
const path = require('path');

const outputDir = 'C:/Users/mypra/Desktop/VibeCoding指南/skills测评项目/03-鹈鹕自行车测试/02-TempFiles';
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

(async () => {
  const pages = await (await fetch('http://127.0.0.1:9300/json/list')).json();
  const page = pages.find(item => item.type === 'page' && item.title === '鹈鹕的骑行日记');
  if (!page) throw new Error('未找到动画页面');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.addEventListener('open', resolve, { once: true });
    ws.addEventListener('error', reject, { once: true });
  });

  let id = 0;
  const pending = new Map();
  const errors = [];
  ws.addEventListener('message', event => {
    const message = JSON.parse(event.data);
    if (message.id) {
      const task = pending.get(message.id);
      if (task) {
        pending.delete(message.id);
        message.error ? task.reject(new Error(JSON.stringify(message.error))) : task.resolve(message.result);
      }
    }
    if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.text);
    if (message.method === 'Log.entryAdded' && message.params.entry.level === 'error') errors.push(message.params.entry.text);
  });
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const nextId = ++id;
    pending.set(nextId, { resolve, reject });
    ws.send(JSON.stringify({ id: nextId, method, params }));
  });
  const evaluate = async expression => {
    const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
    return result.result.value;
  };
  const screenshot = async name => {
    const result = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
    fs.writeFileSync(path.join(outputDir, name), Buffer.from(result.data, 'base64'));
  };
  const inspect = () => evaluate(`(() => {
    const scene = document.getElementById('scene').getBoundingClientRect();
    const pause = document.getElementById('pauseButton').getBoundingClientRect();
    const header = document.querySelector('.topbar').getBoundingClientRect();
    const weather = document.querySelector('.weather-card').getBoundingClientRect();
    const title = document.querySelector('.heading').getBoundingClientRect();
    return {
      weather: document.getElementById('weatherName').textContent,
      paused: document.getElementById('pauseButton').getAttribute('aria-pressed'),
      viewport: [innerWidth, innerHeight],
      canvas: [document.getElementById('canvas').width, document.getElementById('canvas').height],
      scene: [Math.round(scene.width), Math.round(scene.height)],
      horizontalOverflow: document.documentElement.scrollWidth > innerWidth,
      verticalOverflow: document.documentElement.scrollHeight > innerHeight,
      pauseVisible: pause.width > 0 && pause.height > 0 && pause.top >= scene.top && pause.bottom <= scene.bottom,
      headerOverlap: !(title.right <= weather.left || weather.right <= title.left || title.bottom <= weather.top || weather.bottom <= title.top),
      headerInsideViewport: header.left >= 0 && header.right <= innerWidth
    };
  })()`);

  await send('Page.enable');
  await send('Runtime.enable');
  await send('Log.enable');

  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  await send('Page.reload', { ignoreCache: true });
  await wait(700);
  const desktopSunny = await inspect();
  await screenshot('1031-1442-鹈鹕动画-电脑晴天.png');
  await wait(5100);
  const desktopCloudy = await inspect();
  await wait(5100);
  const desktopRainy = await inspect();
  await screenshot('1031-1442-鹈鹕动画-电脑雨天.png');

  await evaluate(`document.getElementById('pauseButton').click()`);
  const pauseStart = await evaluate(`document.getElementById('cycleProgress').style.transform`);
  await wait(700);
  const pauseEnd = await evaluate(`document.getElementById('cycleProgress').style.transform`);
  const desktopPaused = await inspect();
  await evaluate(`document.getElementById('pauseButton').click()`);

  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true, screenWidth: 390, screenHeight: 844 });
  await send('Page.reload', { ignoreCache: true });
  await wait(700);
  const mobileSunny = await inspect();
  await screenshot('1031-1442-鹈鹕动画-手机晴天.png');
  await wait(5100);
  const mobileCloudy = await inspect();
  await screenshot('1031-1442-鹈鹕动画-手机阴天.png');
  await wait(5100);
  const mobileRainy = await inspect();

  console.log(JSON.stringify({
    desktopSunny,
    desktopCloudy,
    desktopRainy,
    pauseWorks: desktopPaused.paused === 'true' && pauseStart === pauseEnd,
    mobileSunny,
    mobileCloudy,
    mobileRainy,
    consoleErrors: errors
  }, null, 2));
  ws.close();
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
