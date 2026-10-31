// 校验 Space Bunny 已并入 MiniMax 组，分类与卡片渲染正确
const PORT = 9305;
const { spawn } = require('child_process');
const fs = require('fs');
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const URL_UNDER_TEST = 'http://127.0.0.1:8137/index.html';
const PROFILE = 'C:\\Users\\mypra\\Desktop\\VibeCoding指南\\skills测评项目\\03-鹈鹕自行车测试\\02-TempFiles\\chrome-profile-展厅分类校验-9305';
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

  const expr = `(async () => {
    const names = [...document.querySelectorAll('.category-name')].map((n) => n.textContent.trim());
    const miniMaxSection = [...document.querySelectorAll('.category-section, .band-group')].find((s) => s.querySelector('.category-name')?.textContent.trim() === 'MiniMax');
    let miniMaxModels = [];
    if (miniMaxSection) {
      const root = miniMaxSection.classList.contains('band-group') ? miniMaxSection : miniMaxSection;
      miniMaxModels = [...root.querySelectorAll('.site-card')].map((c) => c.querySelector('.card-title, h3')?.textContent?.trim()).filter(Boolean);
      const scoped = miniMaxSection.classList.contains('band-group')
        ? miniMaxSection
        : miniMaxSection;
      miniMaxModels = [...scoped.querySelectorAll('.site-card')].map((c) => (c.querySelector('.card-title, .model-name, h3')?.textContent || '').trim());
    }
    const bunny = document.querySelector('.site-card[data-slug="spacebunny"]');
    let bunnyInfo = null;
    if (bunny) {
      bunny.scrollIntoView({ block: 'center' });
      await new Promise((r) => setTimeout(r, 900));
      const img = bunny.querySelector('img');
      bunnyInfo = {
        model: (bunny.querySelector('.card-title, h3')?.textContent || '').trim(),
        loaded: !!(img && img.complete && img.naturalWidth > 0),
        section: bunny.closest('.band-group, .category-section')?.querySelector('.category-name')?.textContent.trim() || null,
      };
    }
    return { total: document.querySelectorAll('.site-card').length, categories: names, hasSpaceBunny: names.includes('Space Bunny'), miniMaxModels: miniMaxModels, bunny: bunnyInfo };
  })()`;
  const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
  console.log(JSON.stringify(r.result.value));

  await send('Runtime.evaluate', { expression: `document.querySelector('.site-card[data-slug="spacebunny"]').scrollIntoView({block:'center'})` });
  await new Promise((r2) => setTimeout(r2, 1500));
  const shot = await send('Page.captureScreenshot', { format: 'png', fromSurface: true });
  fs.writeFileSync('C:\\Users\\mypra\\Desktop\\VibeCoding指南\\skills测评项目\\03-鹈鹕自行车测试\\02-TempFiles\\1031-1640-MiniMax分组.png', Buffer.from(shot.data, 'base64'));
  console.log('截图已保存');

  try { chrome.kill(); } catch (e) { /* 忽略 */ }
  process.exit(0);
})().catch((e) => { console.error('失败:', e.message); process.exit(1); });
