const PORT = 9303;
let ws, id = 0; const pending = new Map();
const send = (m, p = {}) => new Promise((res, rej) => { const i = ++id; pending.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method: m, params: p })); });
(async () => {
  const tabs = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
  const page = tabs.find(t => t.type === 'page' && t.url.startsWith('http://127.0.0.1:8137'));
  ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);
  ws.onmessage = ev => { const m = JSON.parse(ev.data); if (pending.has(m.id)) { const p = pending.get(m.id); pending.delete(m.id); p.res(m.result); } };
  const ev = async e => (await send('Runtime.evaluate', { expression: e, returnByValue: true })).result.value;
  await send('Page.enable');
  await send('Runtime.enable');
  await send('Page.reload'); await new Promise(r => setTimeout(r, 2500));
  console.log(await ev(`(() => {
    const cards = document.querySelectorAll('.site-card').length;
    const gone = ['deepseek-v4-pro-0424','deepseek-0424-pro-trae','deepseek-v4-flash-0424-trae','deepseek-flash-0424'].map(s => document.querySelector('.site-card[data-slug="'+s+'"]') === null);
    const kimi = document.querySelector('.site-card[data-slug="kimi-k3-wb"] .card-file').textContent;
    const kimiScore = document.querySelector('.site-card[data-slug="kimi-k3-wb"] .star-score').textContent.trim();
    const total = document.getElementById('totalCount').textContent;
    const chips = [...document.querySelectorAll('.filter-chip')].map(c=>c.textContent.trim()).join(' | ');
    return JSON.stringify({ cards, 全部已删除: gone.every(Boolean), kimi来源: kimi, kimi默认分: kimiScore, totalCount: total, 分类: chips });
  })()`));
  // 打开 kimi 查看器确认新页面正常加载
  await ev(`document.querySelector('.site-card[data-slug="kimi-k3-wb"]').click()`);
  await new Promise(r => setTimeout(r, 1200));
  console.log(await ev(`(() => {
    const f = [...document.querySelectorAll('.viewer-frame-doc')].find(f=>f.classList.contains('is-current'));
    return JSON.stringify({ title: document.getElementById('viewerTitle').textContent, src: f.dataset.src });
  })()`));
  ws.close(); process.exit(0);
})().catch(e => { console.error('失败:', e.message); process.exit(1); });
