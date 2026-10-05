// 一次性脚本：按指定顺序重排 sites-data.js，并追加 5 个新模型条目
const fs = require('fs');
const path = 'C:/Users/mypra/Desktop/VibeCoding指南/skills测评项目/03-鹈鹕自行车测试/sites-data.js';

global.window = {};
eval(fs.readFileSync(path, 'utf8'));
const sites = window.SITES;
const byslug = Object.fromEntries(sites.map((s) => [s.slug, s]));

const KEY_ORDER = ['file', 'slug', 'category', 'model', 'channel', 'thumb', 'src', 'params', 'cutoff', 'released'];

const NEW = [
  {
    file: 'minimax3.1.html', slug: 'minimax-m3-1', category: 'MiniMax',
    model: 'MiniMax M3.1', channel: '—', thumb: 'thumbs/minimax-m3-1.png',
    src: 'sites/minimax-m3-1.html', params: '—', cutoff: '—', released: 1791203158,
  },
  {
    file: 'mimov2.6.html', slug: 'mimo-v2-6', category: '小米 · MiMo',
    model: '小米 MiMo-V2.6', channel: '—', thumb: 'thumbs/mimo-v2-6.png',
    src: 'sites/mimo-v2-6.html', params: '—', cutoff: '—', released: 1791203136,
  },
  {
    file: 'mimov2.6pro.html', slug: 'mimo-v2-6-pro', category: '小米 · MiMo',
    model: '小米 MiMo-V2.6-Pro', channel: '—', thumb: 'thumbs/mimo-v2-6-pro.png',
    src: 'sites/mimo-v2-6-pro.html', params: '1T', cutoff: '—', released: 1791203083,
  },
  {
    file: 'deepseekv4.1flash-10月5日-鹈鹕白天骑自行车动画.html', slug: 'deepseek-v4-1-flash', category: 'DeepSeek',
    model: 'DeepSeek V4.1 Flash', channel: '—', thumb: 'thumbs/deepseek-v4-1-flash.png',
    src: 'sites/deepseek-v4-1-flash.html', params: '552B(A8B)', cutoff: '—', released: 1791200513,
  },
  {
    file: 'grok4.7.html', slug: 'grok-4-7', category: 'Grok',
    model: 'Grok 4.7', channel: '—', thumb: 'thumbs/grok-4-7.png',
    src: 'sites/grok-4-7.html', params: '—', cutoff: '—', released: 1791200129,
  },
];

// 指定顺序：GPT 家族按 astra / 6.1 / 6.0(sol>luna) / 5.6(sol>luna)，其余新增倒序置前
const PREFIX = [
  'gpt-6', 'gpt-6-1-sol', 'gpt-6-sol', 'gpt-6-luna', 'gpt-5-6-codex', 'gpt-5-6-luna-codex',
  'minimax-m3-1', 'mimo-v2-6', 'mimo-v2-6-pro', 'deepseek-v4-1-flash', 'grok-4-7',
  'seed-2-1-pro-0915', 'step-5-preview', 'hy4-preview', 'spacebunny', 'kimi-k2-8',
  'claude-sonnet-5-5', 'claude-opus-5-5-zcode',
];

const placed = new Set(PREFIX);
const ordered = PREFIX.map((slug) => byslug[slug] || NEW.find((n) => n.slug === slug));
const rest = sites.filter((s) => !placed.has(s.slug)).sort((a, b) => b.released - a.released);
const all = [...ordered, ...rest];

const missing = all.filter((s) => !s);
if (missing.length) throw new Error('存在无法定位的条目：' + PREFIX.filter((s) => !byslug[s] && !NEW.find((n) => n.slug === s)).join(', '));

const out = 'window.SITES = [\n' + all.map((s) => {
  const body = KEY_ORDER.map((k) => `    "${k}": ${JSON.stringify(s[k])}`).join(',\n');
  return '  {\n' + body + '\n  }';
}).join(',\n') + '\n];\n';

fs.writeFileSync(path, out, 'utf8');
console.log('写入条目数:', all.length);
console.log('顺序:', all.map((s) => s.slug).join(' > '));
