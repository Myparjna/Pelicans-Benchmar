// 逐步探测 ZAI 副本的 JS 真实报错行
import { readFileSync } from 'node:fs';
const s = readFileSync('C:/Users/mypra/Desktop/VibeCoding指南/skills测评项目/03-鹈鹕自行车测试/sites/glm-5-3-flash-zai.html', 'utf8');
const m = s.match(/<script>([\s\S]*?)<\/script>/);
const lines = m[1].split('\n');
// 累加到第 N 行，看哪行起开始 parse 失败
for (let i = 0; i < lines.length; i++) {
  const slice = lines.slice(0, i + 1).join('\n');
  try {
    new Function(slice);
  } catch (e) {
    console.log('第', i + 1, '行起失败:', e.message);
    console.log('  上下文(±3):');
    for (let j = Math.max(0, i - 2); j <= Math.min(lines.length - 1, i + 2); j++) {
      console.log('  L' + (j + 1) + ':', JSON.stringify(lines[j]));
    }
    break;
  }
}
console.log('总行数:', lines.length);
