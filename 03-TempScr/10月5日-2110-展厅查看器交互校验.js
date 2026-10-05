// CDP 校验：查看器内打分后关闭是否同步保存、相邻页预加载、关闭按钮配色
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9303;
const URL_UNDER_TEST = 'http://127.0.0.1:8137/index.html';
const { spawn } = require('child_process');
const path = require('path');

const profile = 'C:\\Users\\mypra\\Desktop\\VibeCoding指南\\skills测评项目\\03-鹈鹕自行车测试\\02-TempFiles\\chrome-profile-展厅评分校验-9300';

// 复用已启动的调试实例，避免端口冲突
const chrome = { kill() {} };

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

async function waitWS() {
  for (let i = 0; i < 60; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/list`);
      const tabs = await res.json();
      const page = tabs.find((t) => t.type === 'page' && t.url.startsWith('http://127.0.0.1:8137'));
      if (page && page.webSocketDebuggerUrl) return page.webSocketDebuggerUrl;
    } catch (e) { /* 等待启动 */ }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error('CDP 端口未就绪');
}

async function evaluate(expr) {
  const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
  if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails.exception));
  return r.result.value;
}

(async () => {
  const wsUrl = await waitWS();
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
  await new Promise((r) => setTimeout(r, 1500));

  // 1) 打开一个未评分站点（spacebunny）
  const opened = await evaluate(`(() => {
    const card = document.querySelector('.site-card[data-slug="spacebunny"]');
    if (!card) return 'no-card';
    card.click();
    return 'opened';
  })()`);
  console.log('打开查看器:', opened);

  await new Promise((r) => setTimeout(r, 800));

  // 2) 在查看器里打分（点击第 4 颗星中部 => 8 分）
  const scored = await evaluate(`(() => {
    const wrap = document.querySelector('#viewerRating .star-rating');
    if (!wrap) return 'no-stars';
    const stars = wrap.querySelector('.stars');
    const rect = stars.getBoundingClientRect();
    const targetX = rect.left + rect.width * (3.5 / 5);
    stars.dispatchEvent(new PointerEvent('pointerdown', { clientX: targetX, clientY: rect.top + rect.height / 2, bubbles: true }));
    const stored = JSON.parse(localStorage.getItem('peilika_ratings_v1') || '{}');
    return { score: stored['spacebunny'], text: wrap.querySelector('.star-score').textContent.trim() };
  })()`);
  console.log('打分后：查看器显示', scored.text, '| localStorage =', scored.score);

  // 3) 查看器内星星仍可交互（重渲染未丢失绑定）
  const rebind = await evaluate(`(() => {
    const wrap = document.querySelector('#viewerRating .star-rating');
    const stars = wrap.querySelector('.stars');
    const rect = stars.getBoundingClientRect();
    stars.dispatchEvent(new PointerEvent('pointerdown', { clientX: rect.left + rect.width * (4.5 / 5), clientY: rect.top + rect.height / 2, bubbles: true }));
    return JSON.parse(localStorage.getItem('peilika_ratings_v1') || '{}')['spacebunny'];
  })()`);
  console.log('再次打分（验证绑定未丢）:', rebind, '分');

  // 4) 预加载检查：三份 iframe 的归属与 src
  const framesBefore = await evaluate(`(() => {
    return [...document.querySelectorAll('.viewer-frame-doc')].map(f => ({
      id: f.id, idx: f.dataset.currentIndex || '-', src: (f.dataset.src || '').split('/').pop(), current: f.classList.contains('is-current'),
    }));
  })()`);
  console.log('预加载状态:', JSON.stringify(framesBefore));

  // 5) 切到下一页，检查是否命中预加载帧（src 未变即命中）
  await evaluate(`document.getElementById('btnNext').click()`);
  await new Promise((r) => setTimeout(r, 500));
  const afterNext = await evaluate(`(() => {
    const cur = [...document.querySelectorAll('.viewer-frame-doc')].find(f => f.classList.contains('is-current'));
    return { count: document.getElementById('viewerCount').textContent, curId: cur.id, curSrc: (cur.dataset.src || '').split('/').pop() };
  })()`);
  console.log('切换到下一个:', JSON.stringify(afterNext));

  // 6) 关闭，检查展厅卡片是否同步
  await evaluate(`document.getElementById('btnClose').click()`);
  await new Promise((r) => setTimeout(r, 400));
  const cardAfterClose = await evaluate(`(() => {
    const card = document.querySelector('.site-card[data-slug="spacebunny"]');
    const wrap = card.querySelector('.star-rating');
    const stored = JSON.parse(localStorage.getItem('peilika_ratings_v1') || '{}')['spacebunny'];
    return { text: wrap.querySelector('.star-score').textContent.trim(), stored, disappeared: document.getElementById('viewer').getAttribute('aria-hidden') };
  })()`);
  console.log('关闭后卡片:', JSON.stringify(cardAfterClose));

  // 7) 卡片评分仍可再次交互
  const cardRebind = await evaluate(`(() => {
    const wrap = document.querySelector('.site-card[data-slug="spacebunny"] .star-rating');
    const stars = wrap.querySelector('.stars');
    const rect = stars.getBoundingClientRect();
    stars.dispatchEvent(new PointerEvent('pointerdown', { clientX: rect.left + rect.width * (2.5 / 5), clientY: rect.top + rect.height / 2, bubbles: true }));
    const after = document.querySelector('.site-card[data-slug="spacebunny"] .star-score').textContent.trim();
    return { after, stored: JSON.parse(localStorage.getItem('peilika_ratings_v1') || '{}')['spacebunny'], viewerClosed: document.getElementById('viewer').getAttribute('aria-hidden') };
  })()`);
  console.log('卡片再打分:', JSON.stringify(cardRebind));

  // 8) 关闭按钮配色
  const closeStyle = await evaluate(`(() => {
    const el = document.getElementById('btnClose');
    const cs = getComputedStyle(el);
    return { color: cs.color, background: cs.backgroundColor, border: cs.borderColor };
  })()`);
  console.log('关闭按钮配色:', JSON.stringify(closeStyle));

  ws.close();
  chrome.kill();
  process.exit(0);
})().catch((e) => { console.error('校验失败:', e.message); chrome.kill(); process.exit(1); });
