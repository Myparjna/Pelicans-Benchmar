// 处理 sites-data.js：DeepSeek 按时间排序(0813→0731→0424)且全部标注版本号；A·Claude→A/Claude
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = 'C:/Users/mypra/Desktop/鹈鹕自行车测试';
const file = join(ROOT, 'sites-data.js');
const src = readFileSync(file, 'utf8');
const sites = JSON.parse(src.slice(src.indexOf('['), src.lastIndexOf(']') + 1));

// 1) DeepSeek 目标顺序（时间新→旧，0424 组内保持 pro→flash）
const DS_ORDER = [
  'deepseek-v4-pro-api-0813',
  'deepseek-v4-flash-api-0731',
  'deepseek-v4-pro-0424',
  'deepseek-0424-pro-trae',
  'deepseek-v4-pro-0424-wb',
  'deepseek-v4-flash-0424-trae',
  'deepseek-flash-0424',
  'deepseek-v4-flash-0424-wb',
];
const rank = new Map(DS_ORDER.map((s, i) => [s, i]));

const groups = [];
const gidx = new Map();
for (const s of sites) {
  if (!gidx.has(s.category)) { gidx.set(s.category, groups.length); groups.push({ cat: s.category, items: [] }); }
  groups[gidx.get(s.category)].items.push(s);
}
for (const g of groups) {
  if (g.cat === 'DeepSeek') {
    g.items.sort((a, b) => rank.get(a.slug) - rank.get(b.slug));
  }
}

// 2) DeepSeek 模型名统一标注版本号
const VER = {
  'deepseek-v4-pro-api-0813': 'DeepSeek V4 Pro (0813)',
  'deepseek-v4-flash-api-0731': 'DeepSeek V4 Flash (0731)',
  'deepseek-v4-pro-0424': 'DeepSeek V4 Pro (0424)',
};
// 3) A·Claude → A/Claude
for (const s of sites) {
  if (VER[s.slug]) s.model = VER[s.slug];
  if (s.category === 'A·Claude') s.category = 'A/Claude';
}

writeFileSync(file, 'window.SITES = ' + JSON.stringify(groups.flatMap(g => g.items), null, 2) + ';\n', 'utf8');

console.log('--- DeepSeek 新顺序 ---');
sites.filter(s => s.category === 'DeepSeek').forEach((s, i) => console.log((i + 1) + '. ' + s.model + ' | ' + s.channel));
console.log('--- 分类 ---');
console.log([...new Set(sites.map(s => s.category))].join(' | '));
