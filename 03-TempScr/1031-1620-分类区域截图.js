// 滚动到指定卡片并截取视口图（确保缩略图已加载）
const PORT = 9303;
const { spawn } = require('child_process');
const fs = require('fs');
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const URL_UNDER_TEST = 'http://127.0.0.1:8137/index.html';
const PROFILE = 'C:\\Users\\mypra\\Desktop\\VibeCoding指南\\skills测评项目\\03-鹈鹕自行车测试\\02-TempFiles\\chrome-profile-展厅全页截图-9303';
const OUT_DIR = 'C:\\Users\\mypra\\Desktop\\VibeCoding指南\\skills测评项目\\03-鹈鹕自行车测试\\02-TempFiles\\';
let ws, msgId = 0;
const pending = new Map();

function send(method, params = {}) {
  return new Promise((res, rej) => {
    const id = ++msgId;
    pending.set(id, { res, rej });
    ws.send(JSON.stringify({ id, method, params }));
  });
}

async function connect() {
  let wsUrl = null;
  let chrome = null;
  for (let i = 0; i < 8; i++) {
    try {
      const r = await fetch(`http://127.0.0.1:${PORT}/json/list`);
      const t = await r.json();
      const p = t.find((x) => x.type === 'page' && x.url.includes('8137'));
      if (p) { wsUrl = p.webSocketDebuggerUrl; break; }
    } catch (e) { /* 未启动 */ }
    await new Promise((r) => setTimeout(r, 500));
  }
  if (!wsUrl) {
    chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--no-first-run', '--window-size=1440,1000', `--remote-debugging-port=${PORT}`, `--user-data-dir=${PROFILE}`, URL_UNDER_TEST], { stdio: 'ignore' });
    for (let i = 0; i < 40; i++) {
      await new Promise((r) => setTimeout(r, 500));
      try {
        const r = await fetch(`http://127.0.0.1:${PORT}/json/list`);
        const t = await r.json();
        const p = t.find((x) => x.type === 'page' && x.url.includes('8137'));
        if (p) { wsUrl = p.webSocketDebuggerUrl; break; }
      } catch (e) { /* 等待 */ }
    }
  }
  ws = new WebSocket(wsUrl);
  await new Promise((r) => (ws.onopen = r));
  ws.onmessage = (ev) => {
    const m = JSON.parse(ev.data);
    if (m.id && pending.has(m.id)) {
      const { res, rej } = pending.get(m.id);
      pending.delete(m.id);
      m.error ? rej(new Error(JSON.stringify(m.error))) : res(m.result);
    }
  };
  await send('Runtime.enable');
  await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  await new Promise((r) => setTimeout(r, 2200));
  return chrome;
}

(async () => {
  const chrome = await connect();
  const targets = [
    { slug: 'gpt-6-1-terra', file: '1031-1610-Terra卡片区域.png' },
  ];
  for (const t of targets) {
    await send('Runtime.evaluate', {
      expression: `(() => {
        const c = document.querySelector('.site-card[data-slug="${t.slug}"]');
        if (!c) return 'missing';
        c.scrollIntoView({ block: 'center' });
        return 'ok';
      })()`,
      returnByValue: true,
    });
    await new Promise((r) => setTimeout(r, 1800));
    const shot = await send('Page.captureScreenshot', { format: 'png', fromSurface: true });
    fs.writeFileSync(OUT_DIR + t.file, Buffer.from(shot.data, 'base64'));
    console.log('已截:', t.file);
  }
  if (chrome) { try { chrome.kill(); } catch (e) { /* 忽略 */ } }
  process.exit(0);
})().catch((e) => { console.error('失败:', e.message); process.exit(1); });
