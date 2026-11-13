// CDP 补测：真实鼠标点击 Gemini 4 Hydrogen 卡片，核对查看器当前帧、标题与计数
const http = require('http');
const PORT = 9307;

const get = url => new Promise((res, rej) => {
  http.get(url, r => { let d = ''; r.on('data', c => d += c); r.on('end', () => res(JSON.parse(d))); }).on('error', rej);
});

(async () => {
  const targets = await get(`http://127.0.0.1:${PORT}/json`);
  const page = targets.find(t => t.type === 'page');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  let id = 0;
  const pending = {};
  ws.addEventListener('message', e => {
    const m = JSON.parse(e.data);
    if (m.id && pending[m.id]) { pending[m.id](m); delete pending[m.id]; }
  });
  await new Promise(r => ws.addEventListener('open', r, { once: true }));
  const send = (method, params = {}) => new Promise(res => {
    const i = ++id; pending[i] = res; ws.send(JSON.stringify({ id: i, method, params }));
  });
  const ev = async expr => {
    const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true });
    if (r.result.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails));
    return r.result.result.value;
  };
  await send('Page.enable');
  await send('Page.navigate', { url: 'http://127.0.0.1:8137/index.html' });
  await new Promise(r => setTimeout(r, 2500));

  const rect = await ev(`(() => {
    const card = document.querySelector('.site-card[data-slug="gemini-4-hydrogen"]');
    if (!card) return null;
    card.scrollIntoView({ block: 'center' });
    const r = card.getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + Math.min(80, r.height / 3) };
  })()`);
  if (!rect) throw new Error('卡片未找到');
  await new Promise(r => setTimeout(r, 400));
  const pt = await ev(`(() => {
    const card = document.querySelector('.site-card[data-slug="gemini-4-hydrogen"]');
    const r = card.getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + Math.min(80, r.height / 3) };
  })()`);
  await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: pt.x, y: pt.y, button: 'left', clickCount: 1 });
  await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: pt.x, y: pt.y, button: 'left', clickCount: 1 });
  await new Promise(r => setTimeout(r, 1200));

  const viewer = await ev(`(() => ({
    open: document.body.classList.contains('viewer-open'),
    title: document.getElementById('viewerTitle')?.textContent,
    category: document.getElementById('viewerCategory')?.textContent,
    count: document.getElementById('viewerCount')?.textContent,
    currentSrc: document.querySelector('.viewer-frame-doc.is-current')?.getAttribute('src'),
    frames: [...document.querySelectorAll('.viewer-frame-doc')].map(f => ({ src: f.getAttribute('src'), current: f.classList.contains('is-current') })),
  }))()`);

  // 下一页，确认计数与帧切换
  await ev(`document.getElementById('btnNext')?.click()`);
  await new Promise(r => setTimeout(r, 800));
  const next = await ev(`(() => ({
    title: document.getElementById('viewerTitle')?.textContent,
    count: document.getElementById('viewerCount')?.textContent,
    currentSrc: document.querySelector('.viewer-frame-doc.is-current')?.getAttribute('src'),
  }))()`);

  // Esc 关闭
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
  await new Promise(r => setTimeout(r, 400));
  const closed = await ev(`!document.body.classList.contains('viewer-open')`);

  console.log(JSON.stringify({ viewer, next, closedViaEsc: closed }, null, 2));
  ws.close();
  process.exit(0);
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
