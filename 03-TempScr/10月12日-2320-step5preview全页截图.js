// CDP 校验：Step-5 Preview 新条目渲染位置、卡片数与缩略图加载，并截取全页图
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9303;
const URL_UNDER_TEST = 'http://127.0.0.1:8137/index.html';
const { spawn } = require('child_process');

let ws;
let msgId = 0;
const pending = new Map();

function send(method, params = {}, sessionId) {
  return new Promise((resolve, reject) => {
    const id = ++msgId;
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params, sessionId }));
  });
}

async function ensureChrome() {
  for (let i = 0; i < 10; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/list`);
      const tabs = await res.json();
      const page = tabs.find((t) => t.type === 'page' && t.url.startsWith('http://127.0.0.1:8137'));
      if (page) return { wsUrl: page.webSocketDebuggerUrl, chrome: null };
    } catch (e) { /* 未启动 */ }
    await new Promise((r) => setTimeout(r, 500));
  }
  const chrome = spawn(CHROME, [
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    `--remote-debugging-port=${PORT}`,
    '--user-data-dir=C:\\Users\\mypra\\Desktop\\VibeCoding指南\\skills测评项目\\03-鹈鹕自行车测试\\02-TempFiles\\chrome-profile-展厅全页截图-9303',
    URL_UNDER_TEST,
  ], { detached: false, stdio: 'ignore' });
  for (let i = 0; i < 60; i++) {
    await new Promise((r) => setTimeout(r, 500));
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/list`);
      const tabs = await res.json();
      const page = tabs.find((t) => t.type === 'page' && t.url.startsWith('http://127.0.0.1:8137'));
      if (page) return { wsUrl: page.webSocketDebuggerUrl, chrome };
    } catch (e) { /* 等待启动 */ }
  }
  throw new Error('CDP 端口未就绪');
}

async function evaluate(expr) {
  const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
  if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails.exception));
  return r.result.value;
}

(async () => {
  const { wsUrl, chrome } = await ensureChrome();
  ws = new WebSocket(wsUrl);
  await new Promise((r) => (ws.onopen = r));
  ws.onmessage = (ev) => {
    const m = JSON.parse(ev.data);
    if (m.id && pending.has(m.id)) {
      const { resolve, reject } = pending.get(m.id);
      pending.delete(m.id);
      m.error ? reject(new Error(JSON.stringify(m.error))) : resolve(m.result);
    }
  };
  await send('Runtime.enable');
  await send('Page.enable');
  await new Promise((r) => setTimeout(r, 2500));

  // 1) 卡片总数与新条目位置（先滚到底部触发懒加载）
  const layout = await evaluate(`(async () => {
    window.scrollTo(0, document.body.scrollHeight);
    await new Promise((r) => setTimeout(r, 1200));
    window.scrollTo(0, 0);
    await new Promise((r) => setTimeout(r, 800));
    const cards = [...document.querySelectorAll('.site-card')];
    const target = cards.findIndex((c) => c.dataset.slug === 'step5preview-1012');
    const t = cards[target];
    const img = t ? t.querySelector('img') : null;
    const band = t ? t.closest('.band-group') : null;
    const title = band ? band.querySelector('.category-name')?.textContent?.trim() : null;
    const groupNames = band ? [...band.parentElement.querySelectorAll('.band-group .category-name')].map((n) => n.textContent.trim()) : null;
    return {
      total: cards.length,
      targetIndex: target,
      isLastCard: target === cards.length - 1,
      bandTitle: title,
      bandGroups: groupNames,
      imgLoaded: img ? (img.complete && img.naturalWidth > 0) : null,
      imgSrc: img ? img.getAttribute('src') : null,
    };
  })()`);
  console.log('布局校验:', JSON.stringify(layout));

  // 2) 全页截图（captureBeyondViewport）
  const metrics = await send('Page.getLayoutMetrics');
  const w = Math.ceil(metrics.cssContentSize.width);
  const h = Math.ceil(metrics.cssContentSize.height);
  console.log('页面尺寸:', w, 'x', h);
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await new Promise((r) => setTimeout(r, 500));
  const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, fromSurface: true });
  require('fs').writeFileSync(
    'C:\\Users\\mypra\\Desktop\\VibeCoding指南\\skills测评项目\\03-鹈鹕自行车测试\\02-TempFiles\\10月12日-2320-step5preview全页CDP.png',
    Buffer.from(shot.data, 'base64')
  );
  console.log('全页截图已保存');

  if (chrome) {
    try { chrome.kill(); } catch (e) { /* 忽略 */ }
  }
  process.exit(0);
})().catch((e) => {
  console.error('校验失败:', e.message);
  process.exit(1);
});
