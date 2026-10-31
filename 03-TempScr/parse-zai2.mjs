// 抓真实行号：用 vm.Script 解析，能给到具体行列
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const s = readFileSync('C:/Users/mypra/Desktop/VibeCoding指南/skills测评项目/03-鹈鹕自行车测试/sites/glm-5-3-flash-zai.html', 'utf8');
const m = s.match(/<script>([\s\S]*?)<\/script>/);
const code = m[1];
try {
  new vm.Script(code, { filename: 'zai.js' });
  console.log('OK');
} catch (e) {
  console.log('err:', e.message, 'stack:', e.stack.split('\n').slice(0, 5).join('\n'));
}
