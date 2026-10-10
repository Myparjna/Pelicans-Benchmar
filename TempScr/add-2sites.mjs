// 批量为新增的两条源文件生成 sites/ 副本
import { copyFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = 'C:/Users/mypra/Desktop/VibeCoding指南/skills测评项目/03-鹈鹕自行车测试';
const tasks = [
  ['qwen3.8flashAPI.html', 'qwen-3-8-flash-api'],
  ['ZAIglm5.3flash.html', 'glm-5-3-flash-zai'],
];
for (const [file, slug] of tasks) {
  const from = join(ROOT, file);
  const to = join(ROOT, 'sites', slug + '.html');
  copyFileSync(from, to);
  console.log('已复制:', file, '-> sites/' + slug + '.html');
}
