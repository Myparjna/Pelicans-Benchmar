// CDP 校验：Gemini 4 Hydrogen 收录（50 条 2D、10 分、缩略图、查看器、3D 切换回归）
const http = require('http');
const PORT = 9307;
const BASE = 'http://127.0.0.1:8137/index.html';

const get = url => new Promise((res, rej) => {
  http.get(url, r => { let d = ''; r.on('data', c => d += c); r.on('end', () => res(JSON.parse(d))); }).on('error', rej);
});

(async () => {
  const targets = await get(`http://127.0.0.1:${PORT}/json`);
  const page = targets.find(t => t.type === 'page');
  const ws = new WebSocket(page.webSocketDebuggerUrl, { maxPayload: 100 * 1024 * 1024 });
  let id = 0;
  const pending = {};
  const consoleErrors = [];
  ws.addEventListener('message', e => {
    const m = JSON.parse(e.data);
    if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') {
      consoleErrors.push(m.params.args.map(a => a.value || a.description).join(' '));
    }
    if (m.method === 'Runtime.exceptionThrown') {
      consoleErrors.push(m.params.exceptionDetails.text);
    }
    if (m.id && pending[m.id]) { pending[m.id](m); delete pending[m.id]; }
  });
  await new Promise(r => ws.addEventListener('open', r, { once: true }));
  const send = (method, params = {}) => new Promise(res => {
    const i = ++id; pending[i] = res; ws.send(JSON.stringify({ id: i, method, params }));
  });
  const ev = async expr => {
    const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
    if (r.result.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails));
    return r.result.result.value;
  };
  await send('Runtime.enable');
  await send('Page.enable');
  await send('Page.navigate', { url: BASE });
  await new Promise(r => setTimeout(r, 2500));

  const basic = await ev(`(() => {
    const slugs = [...new Set([...document.querySelectorAll('[data-slug]')].map(c => c.dataset.slug).filter(Boolean))];
    return {
      uniqueCards: slugs.length,
      subtitle: document.querySelector('.subtitle')?.textContent.trim(),
      date: document.querySelector('h1')?.textContent.trim(),
      title: document.title,
      geminiSlugs: slugs.filter(s => s.startsWith('gemini-')),
    };
  })()`);

  // 滚动到目标卡片触发懒加载
  await ev(`(() => {
    const c = [...document.querySelectorAll('[data-slug="gemini-4-hydrogen"]')][0];
    if (c) c.scrollIntoView({ block: 'center' });
  })()`);
  await new Promise(r => setTimeout(r, 1200));

  const card = await ev(`(() => {
    const c = [...document.querySelectorAll('[data-slug="gemini-4-hydrogen"]')][0];
    if (!c) return null;
    const img = c.querySelector('img');
    return {
      text: c.textContent.replace(/\\s+/g, ' ').trim().slice(0, 120),
      score: c.querySelector('.star-rating, .rating')?.textContent.trim() || '',
      imgLoaded: !!(img && img.complete && img.naturalWidth > 0),
      imgW: img ? img.naturalWidth : 0,
      imgH: img ? img.naturalHeight : 0,
    };
  })()`);

  // 打开查看器，核对 iframe 与计数
  await ev(`(() => {
    const c = [...document.querySelectorAll('[data-slug="gemini-4-hydrogen"]')][0];
    if (c) c.click();
  })()`);
  await new Promise(r => setTimeout(r, 1200));
  const viewer = await ev(`(() => {
    const f = document.getElementById('viewerIframe');
    return {
      visible: !!f && !!(f.closest('.viewer')?.classList.contains('is-open') || document.body.classList.contains('viewer-open')),
      src: f ? f.getAttribute('src') : '',
      counter: document.querySelector('.viewer-counter, #viewerCounter, .viewer-index')?.textContent.trim() || '',
    };
  })()`);
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
  await new Promise(r => setTimeout(r, 400));

  // 3D 模式切换回归
  await ev(`document.querySelector('.mode-btn[data-mode="3d"]')?.click()`);
  await new Promise(r => setTimeout(r, 1200));
  const mode3d = await ev(`(() => ({
    active: document.querySelector('.mode-btn.is-active')?.dataset.mode,
    cards: new Set([...document.querySelectorAll('[data-slug]')].map(c => c.dataset.slug).filter(Boolean)).size,
    subtitle: document.querySelector('.subtitle')?.textContent.trim(),
  }))()`);

  console.log(JSON.stringify({ basic, card, viewer, mode3d, consoleErrors }, null, 2));
  ws.close();
  process.exit(0);
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
