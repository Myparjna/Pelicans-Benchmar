// 把 24 个原始 HTML 复制为 sites/<slug>.html（纯 ASCII、无空格），
// 让展厅引用副本（原文件不动），并重新生成带 src 字段的 sites-data.js
import { readFileSync, writeFileSync, copyFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';

const ROOT = 'C:/Users/mypra/Desktop/鹈鹕自行车测试';
const src = readFileSync(join(ROOT, 'sites-data.js'), 'utf8');
const json = src.slice(src.indexOf('['), src.lastIndexOf(']') + 1);
const sites = JSON.parse(json);

mkdirSync(join(ROOT, 'sites'), { recursive: true });

let ok = 0;
for (const s of sites) {
  const from = join(ROOT, s.file);
  const to = join(ROOT, 'sites', s.slug + '.html');
  copyFileSync(from, to);
  s.src = 'sites/' + s.slug + '.html';
  ok++;
}

// 重新生成 sites-data.js（保留 file 用于展示，新增 src 用于实际加载）
const out = 'window.SITES = ' + JSON.stringify(sites, null, 2) + ';\n';
writeFileSync(join(ROOT, 'sites-data.js'), out, 'utf8');

console.log(`已复制 ${ok} 个文件到 sites/ 并生成 sites-data.js（含 src 字段）`);
