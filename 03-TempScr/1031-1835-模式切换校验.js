// CDP 校验：2D / 3D 模式切换后卡片、缩略图、提示词与计数是否正确
const PORT = 9306;
const { spawn } = require('child_process');
const fs = require('fs');
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const URL_UNDER_TEST = 'http://127.0.0.1:8137/index.html';
const PROFILE = 'C:\\Users\\mypra\\Desktop\\VibeCoding指南\\skills测评项目\\03-鹈鹕自行车测试\\02-TempFiles\\chrome-profile-展厅模式校验-9306';
let ws, msgId = 0;
const pending = new Map();

function send(method, params = {}) {
  return new Promise((res, rej) => {
    const id = ++msgId;
    pending.set(id, { res, rej });
    ws.send(JSON.stringify({ id, method, params }));
  });
}

(async () => {
  fs.rmSync(PROFILE, { recursive: true, force: true });
  const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--no-first-run', '--window-size=1440,1000', `--remote-debugging-port=${PORT}`, `--user-data-dir=${PROFILE}`, URL_UNDER_TEST], { stdio: 'ignore' });
  let wsUrl = null;
  for (let i = 0; i < 50; i++) {
    await new Promise((r) => setTimeout(r, 500));
    try {
      const r = await fetch(`http://127.0.0.1:${PORT}/json/list`);
      const t = await r.json();
      const p = t.find((x) => x.type === 'page' && x.url.includes('8137'));
      if (p) { wsUrl = p.webSocketDebuggerUrl; break; }
    } catch (e) { /* 等待 */ }
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
  await new Promise((r) => setTimeout(r, 2500));

  const snapshot = `(async () => {
    const cards = [...document.querySelectorAll('.site-card')];
    for (const c of cards) { c.scrollIntoView({ block: 'center' }); }
    window.scrollTo(0, 0);
    await new Promise((r) => setTimeout(r, 1200));
    const imgs = cards.map((c) => { const i = c.querySelector('img'); return !!(i && i.complete && i.naturalWidth > 0); });
    return {
      cards: cards.length,
      imgsLoaded: imgs.filter(Boolean).length,
      subtitle: document.querySelector('.subtitle').textContent.trim(),
      promptHead: document.getElementById('promptLine').textContent.slice(0, 14),
      categories: [...document.querySelectorAll('.category-name')].map((n) => n.textContent.trim()),
      activeMode: document.querySelector('.mode-btn.is-active')?.dataset.mode,
      firstModel: cards[0]?.querySelector('.card-title, h3')?.textContent?.trim(),
      totalCountText: document.getElementById('totalCount')?.textContent?.trim(),
    };
  })()`;

  const before = await send('Runtime.evaluate', { expression: snapshot, awaitPromise: true, returnByValue: true });
  console.log('2D 默认:', JSON.stringify(before.result.value));

  const clicked = await send('Runtime.evaluate', {
    expression: `(() => { const b = document.querySelector('.mode-btn[data-mode="3d"]'); if (!b) return 'no-btn'; b.click(); return 'clicked'; })()`,
    returnByValue: true,
  });
  console.log('点击 3D:', clicked.result.value);
  await new Promise((r) => setTimeout(r, 2500));

  const after = await send('Runtime.evaluate', { expression: snapshot, awaitPromise: true, returnByValue: true });
  console.log('3D 模式:', JSON.stringify(after.result.value));

  const shot = await send('Page.captureScreenshot', { format: 'png', fromSurface: true });
  fs.writeFileSync('C:\\Users\\mypra\\Desktop\\VibeCoding指南\\skills测评项目\\03-鹈鹕自行车测试\\02-TempFiles\\1031-1835-3D模式展厅.png', Buffer.from(shot.data, 'base64'));
  console.log('截图已保存');

  // 打开 3D 查看器
  const openRes = await send('Runtime.evaluate', {
    expression: `(() => { const c = document.querySelector('.site-card'); if (!c) return 'no-card'; c.click(); return 'opened'; })()`,
    returnByValue: true,
  });
  await new Promise((r) => setTimeout(r, 1800));
  const viewer = await send('Runtime.evaluate', {
    expression: `({ title: document.getElementById('viewerTitle')?.textContent?.trim(), src: document.getElementById('viewerIframe')?.getAttribute('src'), count: document.getElementById('viewerCount')?.textContent?.trim() })`,
    returnByValue: true,
  });
  console.log('查看器:', openRes.result.value, JSON.stringify(viewer.result.value));

  try { chrome.kill(); } catch (e) { /* 忽略 */ }
  process.exit(0);
})().catch((e) => { console.error('失败:', e.message); process.exit(1); });
