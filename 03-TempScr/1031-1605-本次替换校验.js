// CDP 校验：Kimi K3.1 Pro 新增、GPT-6 Sol 与 GLM 5.3 Flash 替换、GLM 重复条目已移除
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9303;
const URL_UNDER_TEST = 'http://127.0.0.1:8137/index.html';
const { spawn } = require('child_process');
const fs = require('fs');

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
    } catch (e) { /* 等待 */ }
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

  const result = await evaluate(`(async () => {
    window.scrollTo(0, document.body.scrollHeight);
    await new Promise((r) => setTimeout(r, 1500));
    window.scrollTo(0, 0);
    await new Promise((r) => setTimeout(r, 1200));
    const cards = [...document.querySelectorAll('.site-card')];
    const bySlug = (s) => cards.find((c) => c.dataset.slug === s);
    const info = (s) => {
      const c = bySlug(s);
      if (!c) return null;
      const img = c.querySelector('img');
      const band = c.closest('.band-group');
      return {
        model: c.querySelector('.card-model, h3, .model-name')?.textContent?.trim(),
        imgLoaded: img ? img.complete && img.naturalWidth > 0 : null,
        inBand: band ? band.querySelector('.category-name')?.textContent?.trim() : null,
      };
    };
    const kimiCards = cards.filter((c) => c.closest('.category-section, .band-group')?.querySelector('.category-name')?.textContent?.includes('Kimi'));
    return {
      total: cards.length,
      zaiExists: !!bySlug('glm-5-3-flash-zai'),
      kimiFirst: kimiCards[0]?.dataset.slug,
      kimiCount: kimiCards.length,
      kimi31: info('kimi-k3-1-pro'),
      gptSol: info('gpt-6-sol'),
      glmFlash: info('glm-5-3-flash-zhipu'),
      glmFlashCount: cards.filter((c) => c.dataset.slug.startsWith('glm-5-3-flash')).length,
      counterText: document.querySelector('.subtitle')?.textContent?.trim(),
    };
  })()`);
  console.log('校验:', JSON.stringify(result, null, 0));

  const metrics = await send('Page.getLayoutMetrics');
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await new Promise((r) => setTimeout(r, 600));
  const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, fromSurface: true });
  fs.writeFileSync(
    'C:\\Users\\mypra\\Desktop\\VibeCoding指南\\skills测评项目\\03-鹈鹕自行车测试\\02-TempFiles\\1031-1608-替换后全页.png',
    Buffer.from(shot.data, 'base64')
  );
  console.log('全页截图已保存, 高度:', Math.ceil(metrics.cssContentSize.height));

  if (chrome) { try { chrome.kill(); } catch (e) { /* 忽略 */ } }
  process.exit(0);
})().catch((e) => {
  console.error('校验失败:', e.message);
  process.exit(1);
});
