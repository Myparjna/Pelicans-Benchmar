// CDP 校验：hy4 正式版条目（卡片数 49、混元组首位 hy4、10 分、缩略图加载）
const http = require('http');

function getJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve(JSON.parse(d)));
    }).on('error', reject);
  });
}

(async () => {
  const targets = await getJson('http://127.0.0.1:9307/json');
  const page = targets.find(t => t.type === 'page');
  const ws = new WebSocket(page.webSocketDebuggerUrl, { maxPayload: 100 * 1024 * 1024 });
  let id = 0;
  const pending = {};
  ws.addEventListener('message', m => {
    const msg = JSON.parse(m.data);
    if (msg.id && pending[msg.id]) { pending[msg.id](msg); delete pending[msg.id]; }
  });
  const send = (method, params = {}) => new Promise(res => {
    const i = ++id; pending[i] = res;
    ws.send(JSON.stringify({ id: i, method, params }));
  });
  const evalJs = async expr => {
    const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
    return r.result.result && r.result.result.value;
  };

  await new Promise(r => ws.addEventListener('open', r, { once: true }));
  await send('Page.enable');
  await send('Page.navigate', { url: 'http://127.0.0.1:8137/index.html' });
  await new Promise(r => setTimeout(r, 2500));

  const cards = await evalJs(`document.querySelectorAll('.card').length`);
  const hyCards = await evalJs(`
    (() => {
      const bands = [...document.querySelectorAll('.band-title')];
      const hyTitle = bands.find(b => b.textContent.includes('混元'));
      let sec = hyTitle && hyTitle.closest('section');
      if (!sec) { sec = hyTitle && hyTitle.closest('.band-group, section'); }
      const scope = sec || document;
      const cards = [...scope.querySelectorAll('.card')].filter(c => scope.contains(c));
      return cards.map(c => {
        const a = c.querySelector('a[href], [data-slug]') || c;
        return {
          slug: c.dataset.slug || (c.querySelector('[data-slug]')||{}).dataset?.slug || c.getAttribute('data-slug') || '',
          text: c.textContent.replace(/\\s+/g, ' ').slice(0, 80),
        };
      });
    })()
  `);
  const hy4Card = await evalJs(`
    (() => {
      const card = [...document.querySelectorAll('[data-slug="hy4"], .card')].find(c => (c.dataset?.slug || c.getAttribute('data-slug')) === 'hy4');
      if (!card) return null;
      const img = card.querySelector('img');
      return {
        found: true,
        text: card.textContent.replace(/\\s+/g, ' ').slice(0, 120),
        score: (card.querySelector('.star-rating, .rating') || {}).textContent?.trim()?.slice(0, 20) || '',
        imgLoaded: !!(img && img.complete && img.naturalWidth > 0),
        imgW: img ? img.naturalWidth : 0,
      };
    })()
  `);
  const subtitle = await evalJs(`document.querySelector('.subtitle')?.textContent`);
  const dateText = await evalJs(`document.querySelector('h1')?.textContent`);

  // 滚动到 hy4 卡片触发懒加载再复测
  await evalJs(`
    (() => {
      const card = [...document.querySelectorAll('[data-slug="hy4"], .card')].find(c => (c.dataset?.slug || c.getAttribute('data-slug')) === 'hy4');
      if (card) card.scrollIntoView({ block: 'center' });
    })()
  `);
  await new Promise(r => setTimeout(r, 1500));
  const hy4After = await evalJs(`
    (() => {
      const card = [...document.querySelectorAll('[data-slug="hy4"], .card')].find(c => (c.dataset?.slug || c.getAttribute('data-slug')) === 'hy4');
      const img = card && card.querySelector('img');
      return img ? { imgLoaded: img.complete && img.naturalWidth > 0, imgW: img.naturalWidth } : null;
    })()
  `);

  console.log(JSON.stringify({ cards, subtitle, dateText, hyCards, hy4Card, hy4After }, null, 2));
  ws.close();
  process.exit(0);
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
