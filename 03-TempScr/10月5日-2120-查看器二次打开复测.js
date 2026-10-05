// CDP 复测：关闭后再次打开不同卡片，帧分配是否正确、评分是否保持
const PORT = 9303;
let ws, msgId = 0;
const pending = new Map();

function send(method, params = {}, sessionId) {
  return new Promise((resolve, reject) => {
    const id = ++msgId;
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params, sessionId }));
  });
}

(async () => {
  const tabs = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
  const page = tabs.find((t) => t.type === 'page' && t.url.startsWith('http://127.0.0.1:8137'));
  ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((r) => (ws.onopen = r));
  ws.onmessage = (ev) => {
    const m = JSON.parse(ev.data);
    if (m.id && pending.has(m.id)) {
      const { resolve, reject } = pending.get(m.id);
      pending.delete(m.id);
      m.error ? reject(new Error(JSON.stringify(m.error))) : resolve(m.result);
    }
  };
  const evaluate = async (expr) => {
    const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
    if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails.exception));
    return r.result.value;
  };
  await send('Page.enable');
  await send('Page.reload', { ignoreCache: false });
  await new Promise((r) => setTimeout(r, 2500));
  await send('Runtime.enable');

  await evaluate(`document.querySelector('.site-card[data-slug="hy4-preview"]').click()`);
  await new Promise((r) => setTimeout(r, 900));
  console.log('首次打开帧分配:', JSON.stringify(await evaluate(`[...document.querySelectorAll('.viewer-frame-doc')].map(f=>({id:f.id,idx:f.dataset.currentIndex||'-',src:(f.dataset.src||'').split('/').pop(),cur:f.classList.contains('is-current')}))`)));

  await evaluate(`document.getElementById('btnClose').click()`);
  await new Promise((r) => setTimeout(r, 300));
  console.log('关闭后帧状态:', JSON.stringify(await evaluate(`[...document.querySelectorAll('.viewer-frame-doc')].map(f=>({id:f.id,idx:f.dataset.currentIndex||'-',src:(f.dataset.src||'-'),cur:f.classList.contains('is-current')}))`)));

  await evaluate(`document.querySelector('.site-card[data-slug="grok-4-7"]').click()`);
  await new Promise((r) => setTimeout(r, 900));
  console.log('二次打开帧分配:', JSON.stringify(await evaluate(`[...document.querySelectorAll('.viewer-frame-doc')].map(f=>({id:f.id,idx:f.dataset.currentIndex||'-',src:(f.dataset.src||'').split('/').pop(),cur:f.classList.contains('is-current')}))`)));
  console.log('查看器标题:', await evaluate(`document.getElementById('viewerTitle').textContent`));

  // 连续翻 3 页检查是否每次都命中预加载帧
  for (let i = 0; i < 3; i++) {
    const before = await evaluate(`(() => { const nf=[...document.querySelectorAll('.viewer-frame-doc')].find(f=>f.dataset.currentIndex===String(Math.min(window.SITES? 0:0,0))); return 1; })()`);
    await evaluate(`document.getElementById('btnNext').click()`);
    await new Promise((r) => setTimeout(r, 600));
    console.log('第' + (i + 1) + '次下一页 ->', JSON.stringify(await evaluate(`(() => { const cur=[...document.querySelectorAll('.viewer-frame-doc')].find(f=>f.classList.contains('is-current')); return { count: document.getElementById('viewerCount').textContent, title: document.getElementById('viewerTitle').textContent, src: (cur.dataset.src||'').split('/').pop() }; })()`)));
  }

  await evaluate(`document.getElementById('btnClose').click()`);
  const stored = await evaluate(`(() => { const s = JSON.parse(localStorage.getItem('peilika_ratings_v1')||'{}'); return { spacebunny: s['spacebunny'], hy4: s['hy4-preview'] }; })()`);
  console.log('本地评分记录:', JSON.stringify(stored));

  ws.close();
  process.exit(0);
})().catch((e) => { console.error('复测失败:', e.message); process.exit(1); });
