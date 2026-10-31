// 重排 sites-data.js：渠道名去"风格"（官网风格→官网），并按用户指定顺序重排分类内条目（最新在前）
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = 'C:/Users/mypra/Desktop/鹈鹕自行车测试';
const file = join(ROOT, 'sites-data.js');
const src = readFileSync(file, 'utf8');
const sites = JSON.parse(src.slice(src.indexOf('['), src.lastIndexOf(']') + 1));

// 目标顺序（仅列出要重排的分类内 slug；未列出的分类保持原顺序）
const ORDER = [
  // 阿里 · 通义千问：max → plus → 27b → flash（3.8 在 3.6 前）
  'qwen-3-8-max', 'qwen-3-7-plus', 'qwen-3-8-27b', 'qwen-3-6-27b', 'qianwen-3-6-flash',
  // Google · Gemini：3.7 → 3.6 → 3.1
  'gemini-3-7', 'gemini-3-6-flash', 'gemini-3-1-pro',
  // DeepSeek：pro → flash（同代内新渠道在前）
  'deepseek-v4-pro-api-0813', 'deepseek-v4-pro-0424', 'deepseek-0424-pro-trae', 'deepseek-v4-pro-0424-wb',
  'deepseek-v4-flash-api-0731', 'deepseek-v4-flash-0424-trae', 'deepseek-flash-0424', 'deepseek-v4-flash-0424-wb',
  // 智谱 · GLM：5.3 → 5.2
  'glm-5-3-wb', 'glm-5-2-wb',
];
const rank = new Map(ORDER.map((s, i) => [s, i]));

// 渠道名统一："官网风格" → "官网"（先替换长串）
for (const s of sites) {
  if (!s.channel) continue;
  s.channel = s.channel
    .replace('官网风格 · 专家模式', '官网 · 专家模式')
    .replace('官网风格', '官网');
}

// 按分类分组（保持现有分类出现顺序）
const groups = [];
const gidx = new Map();
for (const s of sites) {
  if (!gidx.has(s.category)) {
    gidx.set(s.category, groups.length);
    groups.push({ cat: s.category, items: [] });
  }
  groups[gidx.get(s.category)].items.push(s);
}

// 组内：若该分类全部条目都在 ORDER 中，则按 ORDER 重排，否则保持原顺序
let moved = 0;
for (const g of groups) {
  if (g.items.every(s => rank.has(s.slug))) {
    g.items.sort((a, b) => rank.get(a.slug) - rank.get(b.slug));
    moved += g.items.length;
  }
}

const out = 'window.SITES = ' + JSON.stringify(groups.flatMap(g => g.items), null, 2) + ';\n';
writeFileSync(file, out, 'utf8');
console.log(`总数 ${sites.length}，按 ORDER 重排 ${moved} 条，渠道名已统一`);
console.log('渠道集合:', [...new Set(sites.map(s => s.channel))].join(' | '));
