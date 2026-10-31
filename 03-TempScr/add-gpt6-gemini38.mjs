// 复制两条新增源文件到 sites/ 副本（单条复制，不触发全量覆盖）
import { copyFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = 'C:/Users/mypra/Desktop/VibeCoding指南/skills测评项目/03-鹈鹕自行车测试';
const DESKTOP = 'C:/Users/mypra/Desktop';
const tasks = [
  ['GPT6鹈鹕的晴雨骑行.html', 'gpt-6'],
  ['gemini-3.8.html', 'gemini-3-8'],
];
for (const [file, slug] of tasks) {
  copyFileSync(join(DESKTOP, file), join(ROOT, 'sites', slug + '.html'));
  console.log('已复制:', file, '-> sites/' + slug + '.html');
}
