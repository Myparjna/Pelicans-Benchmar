const fs = require('fs');
const html = fs.readFileSync('pelican-ride.html', 'utf8');

// 1. 内嵌 JS 语法检查(只编译不执行)
const m = html.match(/<script>([\s\S]*?)<\/script>/);
try { new Function(m[1]); console.log('JS syntax: OK'); }
catch (e) { console.log('JS syntax ERROR:', e.message); process.exit(1); }

// 2. 标签配对检查(排除自闭合)
for (const t of ['svg', 'g', 'defs', 'linearGradient', 'div', 'span', 'style', 'body', 'html', 'path', 'rect', 'circle', 'line', 'ellipse']) {
  const open = (html.match(new RegExp('<' + t + '[\\s>]', 'g')) || []).length;
  const close = (html.match(new RegExp('</' + t + '>', 'g')) || []).length;
  const selfc = (html.match(new RegExp('<' + t + '[^>]*/>', 'g')) || []).length;
  const ok = open - selfc === close;
  console.log(`${t}: open=${open} self=${selfc} close=${close} ${ok ? 'OK' : '*** MISMATCH ***'}`);
}

// 3. JS 中 getElementById / $('...') 引用的 id 与 HTML 静态 id + JS 动态创建 id 的并集比对
const staticIds = [...html.matchAll(/id="([^"]+)"/g)].map(x => x[1]);
const dynIds = [...m[1].matchAll(/id:\s*'([^']+)'/g)].map(x => 'x' === x[1] ? null : x[1]).filter(Boolean);
const dyn2 = [...html.matchAll(/\{id:'([^']+)'\}/g)].map(x => x[1]);
const dyn3 = [...html.matchAll(/row\.id\s*=\s*'([^']+)'/g)].map(x => x[1]);
const all = new Set([...staticIds, ...dyn2, ...dyn3]);
const refs = new Set([...m[1].matchAll(/\$\('([^']+)'\)/g)].map(x => x[1]));
const missing = [...refs].filter(r => !all.has(r));
console.log(missing.length ? 'MISSING IDS: ' + missing.join(',') : 'All referenced ids present: OK');

// 4. CSS 引用的 id 是否存在
const cssRefs = new Set([...html.matchAll(/#([A-Za-z][\w]*)\s*[{,:\s]/g)].map(x => x[1]));
const cssMissing = [...cssRefs].filter(r => !all.has(r) && !['pill','bar','dot','hud','scene'].includes(r) === false);
const cssMissing2 = [...cssRefs].filter(r => !all.has(r));
console.log('CSS ids missing:', cssMissing2.length ? cssMissing2.join(',') : '(none)');
