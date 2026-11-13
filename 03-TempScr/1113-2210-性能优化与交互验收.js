// CDP 验收：提示词替换、排序/导出下架、GitHub 图标右上角、渐进式懒加载与核心交互回归
const http = require('http');
const PORT = 9307;
const BASE = process.env.TEST_URL || 'http://127.0.0.1:8137/index.html';
const NEW_PROMPT_TAIL = '也不派任何subagent进行codereviwer。单个文件+时间命名好给我。告诉我绝对路径。';

const get = url => new Promise((res, rej) => {
  http.get(url, r => { let d = ''; r.on('data', c => d += c); r.on('end', () => res(JSON.parse(d))); }).on('error', rej);
});
const wait = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const targets = await get(`http://127.0.0.1:${PORT}/json`);
  const page = targets.find(t => t.type === 'page');
  const ws = new WebSocket(page.webSocketDebuggerUrl, { maxPayload: 100 * 1024 * 1024 });
  let id = 0;
  const pending = {};
  const consoleErrors = [];
  const requestUrls = new Map();
  const failedRequests = [];
  ws.addEventListener('message', e => {
    const m = JSON.parse(e.data);
    if (m.method === 'Network.requestWillBeSent') requestUrls.set(m.params.requestId, m.params.request.url);
    if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') {
      consoleErrors.push(m.params.args.map(a => a.value || a.description).join(' '));
    }
    if (m.method === 'Runtime.exceptionThrown') consoleErrors.push(m.params.exceptionDetails.text);
    if (m.method === 'Network.loadingFailed') failedRequests.push({ url: requestUrls.get(m.params.requestId) || '(unknown)', error: m.params.errorText, canceled: m.params.canceled });
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
  const click = async (x, y) => {
    await send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
    await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 });
  };
  const centerOf = async sel => ev(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (!e) return null; const r = e.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2, rect: { x: r.x, y: r.y, w: r.width, h: r.height } }; })()`);

  await send('Runtime.enable');
  await send('Page.enable');
  await send('Network.enable');
  await send('Network.setCacheDisabled', { cacheDisabled: true }); // 复用 userDataDir 时强制绕过磁盘缓存
  await send('Page.addScriptToEvaluateOnNewDocument', {
    source: `window.__longTasks = []; try { new PerformanceObserver(list => { for (const e of list.getEntries()) window.__longTasks.push({ ms: Math.round(e.duration), start: Math.round(e.startTime), attr: (e.attribution || []).map(a => a.name + '/' + a.containerType) }); }).observe({ type: 'longtask', buffered: true }); } catch (e) {}`,
  });
  await send('Page.navigate', { url: BASE });
  for (let i = 0; i < 60; i++) {
    const n = await ev(`document.querySelectorAll('.site-card').length`).catch(() => 0);
    if (n >= 50) break;
    await wait(200);
  }
  await wait(400);

  const home = await ev(`(() => {
    const cards = [...document.querySelectorAll('.site-card')];
    const imgs = [...document.querySelectorAll('.thumb-static')];
    const gh = document.querySelector('.github-link');
    const ghR = gh && gh.getBoundingClientRect();
    const controls = [...document.querySelectorAll('.header-actions > *')].map(e => e.getBoundingClientRect());
    const overlap = !!(ghR && controls.some(r => ghR.left < r.right && ghR.right > r.left && ghR.top < r.bottom && ghR.bottom > r.top));
    return {
      cards: cards.length,
      slots: document.querySelectorAll('[data-slot]').length,
      sections: document.querySelectorAll('.category-section').length,
      totalCount: document.getElementById('totalCount')?.textContent,
      eager: imgs.filter(i => i.getAttribute('loading') === 'eager').length,
      lazy: imgs.filter(i => i.getAttribute('loading') === 'lazy').length,
      fetchHigh: imgs.filter(i => i.getAttribute('fetchpriority') === 'high').length,
      decodingAsync: imgs.filter(i => i.getAttribute('decoding') === 'async').length,
      animNotLoaded: cards.filter(c => !c.querySelector('.thumb-anim')?.src).length,
      contentVisibility: cards[0] ? getComputedStyle(cards[0]).contentVisibility : null,
      containIntrinsicSize: cards[0] ? getComputedStyle(cards[0]).containIntrinsicSize : null,
      longTasks: window.__longTasks,
      sortBtn: !!document.getElementById('sortToggle'),
      exportBtn: !!document.getElementById('exportRatings'),
      footerHasSort: document.querySelector('.site-footer')?.textContent.includes('按评分排序'),
      promptLine: document.getElementById('promptLine')?.textContent,
      viewerPrompt: document.getElementById('viewerPromptText')?.textContent,
      github: ghR ? { right: Math.round(innerWidth - ghR.right), top: Math.round(ghR.top), overlapWithActions: overlap } : null,
      horizontalOverflow: document.documentElement.scrollWidth > innerWidth + 1,
    };
  })()`);

  // 分类筛选
  const chip = await ev(`(() => { const c = [...document.querySelectorAll('.filter-chip')].find(x => x.dataset.category === 'Gemini'); if (!c) return null; c.click(); return c.dataset.category; })()`);
  await wait(500);
  const filtered = await ev(`({ cards: document.querySelectorAll('.site-card').length, active: document.querySelector('.filter-chip.active')?.dataset.category, total: document.getElementById('totalCount')?.textContent })`);
  await ev(`document.querySelector('.filter-chip[data-category="全部"]')?.click()`);
  await wait(700);

  // 搜索防抖
  await ev(`(() => { const i = document.getElementById('searchInput'); i.value = 'hydrogen'; i.dispatchEvent(new Event('input', { bubbles: true })); })()`);
  const immediate = await ev(`document.querySelectorAll('.site-card').length`);
  await wait(400);
  const searched = await ev(`(() => ({ cards: document.querySelectorAll('.site-card').length, names: [...document.querySelectorAll('.card-title')].map(x => x.textContent.trim()) }))()`);
  await ev(`(() => { const i = document.getElementById('searchInput'); i.value = ''; i.dispatchEvent(new Event('input', { bubbles: true })); })()`);
  await wait(700);

  // 3D 切换（提示词同步）
  await ev(`document.querySelector('.mode-btn[data-mode="3d"]')?.click()`);
  await wait(700);
  const mode3d = await ev(`(() => ({
    cards: document.querySelectorAll('.site-card').length,
    active: document.querySelector('.mode-btn.is-active')?.dataset.mode,
    subtitle: document.querySelector('.subtitle')?.textContent.trim(),
    promptHead: document.getElementById('promptLine')?.textContent.slice(0, 12),
    viewerHead: document.getElementById('viewerPromptText')?.textContent.slice(0, 12),
  }))()`);
  await ev(`document.querySelector('.mode-btn[data-mode="2d"]')?.click()`);
  await wait(800);

  // 查看器真实点击 + 翻页 + Esc
  await ev(`document.querySelector('.site-card[data-slug="gemini-4-hydrogen"]')?.scrollIntoView({ block: 'center' })`);
  await wait(500);
  const cardPt = await centerOf('.site-card[data-slug="gemini-4-hydrogen"]');
  await click(cardPt.x, cardPt.rect.y + 60);
  await wait(900);
  const viewer = await ev(`(() => ({
    open: document.body.classList.contains('viewer-open'),
    title: document.getElementById('viewerTitle')?.textContent,
    count: document.getElementById('viewerCount')?.textContent,
    src: document.querySelector('.viewer-frame-doc.is-current')?.getAttribute('src'),
  }))()`);
  const nextBtn = await centerOf('#btnNext');
  await click(nextBtn.x, nextBtn.y);
  await wait(600);
  const afterNext = await ev(`({ title: document.getElementById('viewerTitle')?.textContent, count: document.getElementById('viewerCount')?.textContent })`);
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
  await wait(300);
  const closed = await ev(`!document.body.classList.contains('viewer-open')`);

  // 打分同步（合成 pointerdown 打 7 分）
  const rating = await ev(`(() => {
    const card = document.querySelector('.site-card[data-slug="gemini-4-hydrogen"]');
    if (!card) return null;
    card.scrollIntoView({ block: 'center' });
    const stars = card.querySelector('.stars');
    const r = stars.getBoundingClientRect();
    stars.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientX: r.left + r.width * 0.7, clientY: r.top + r.height / 2 }));
    return { score: card.querySelector('.star-score')?.textContent.trim(), stored: JSON.parse(localStorage.getItem('peilika_ratings_v1') || '{}')['gemini-4-hydrogen'] };
  })()`);

  // 移动端视口
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await wait(700);
  const mobile = await ev(`(() => {
    const gh = document.querySelector('.github-link')?.getBoundingClientRect();
    const h1 = document.querySelector('.brand h1')?.getBoundingClientRect();
    const overlap = !!(gh && h1 && gh.left < h1.right && gh.right > h1.left && gh.top < h1.bottom && gh.bottom > h1.top);
    return { horizontalOverflow: document.documentElement.scrollWidth > innerWidth + 1, scrollWidth: document.documentElement.scrollWidth, innerWidth, githubOverlapsTitle: overlap, githubRight: gh ? Math.round(innerWidth - gh.right) : null };
  })()`);
  await send('Emulation.clearDeviceMetricsOverride');

  console.log(JSON.stringify({
    home, filtered, searchImmediateCards: immediate, searched, mode3d,
    viewer, afterNext, closedViaEsc: closed, rating, mobile,
    consoleErrors, failedRequests,
    promptTailOk: home.promptLine && home.promptLine.includes(NEW_PROMPT_TAIL),
    viewerPromptTailOk: home.viewerPrompt && home.viewerPrompt.includes(NEW_PROMPT_TAIL),
  }, null, 2));
  ws.close();
  process.exit(0);
})().catch(e => { console.error('ERR', e.stack || e.message); process.exit(1); });
