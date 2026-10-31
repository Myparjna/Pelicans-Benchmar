// 滚动到目标卡片，复查缩略图懒加载结果
const PORT = 9303;
const { spawn } = require('child_process');
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const URL_UNDER_TEST = 'http://127.0.0.1:8137/index.html';
const PROFILE = 'C:\\Users\\mypra\\Desktop\\VibeCoding指南\\skills测评项目\\03-鹈鹕自行车测试\\02-TempFiles\\chrome-profile-展厅全页截图-9303';
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
    chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--no-first-run', `--remote-debugging-port=${PORT}`, `--user-data-dir=${PROFILE}`, URL_UNDER_TEST], { stdio: 'ignore' });
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
  await new Promise((r) => setTimeout(r, 2000));

  const expr = `(async () => {
    const out = [];
    for (const slug of ['kimi-k3-1-pro','glm-5-3-flash-zhipu','gpt-6-sol']) {
      const c = document.querySelector('.site-card[data-slug="' + slug + '"]');
      if (!c) { out.push({ slug: slug, missing: true }); continue; }
      c.scrollIntoView({ block: 'center' });
      await new Promise((r) => setTimeout(r, 1200));
      const img = c.querySelector('img');
      if (img && !img.complete) {
        await new Promise((r) => { img.onload = r; img.onerror = r; setTimeout(r, 2500); });
      }
      out.push({ slug: slug, loaded: !!(img && img.complete && img.naturalWidth > 0), w: img ? img.naturalWidth : 0, h: img ? img.naturalHeight : 0, src: img ? img.getAttribute('src') : null });
    }
    return out;
  })()`;

  const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
  console.log(JSON.stringify(r.result.value));
  if (chrome) { try { chrome.kill(); } catch (e) { /* 忽略 */ } }
  process.exit(0);
})().catch((e) => { console.error('失败:', e.message); process.exit(1); });
