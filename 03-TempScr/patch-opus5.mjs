// 重新应用 opus-5-relay 副本补丁（build-sites-copies.mjs 会用原件覆盖副本后运行此脚本）
// 修复点：splash.filter 内 ctx.ellipse(s.x,s.y,s.r,...) 半径偶发为负导致动画中断
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = 'C:/Users/mypra/Desktop/鹈鹕自行车测试';
const file = join(ROOT, 'sites', 'opus-5-relay.html');

let code = readFileSync(file, 'utf8');
const before = 'ctx.ellipse(s.x,s.y,s.r,s.r*0.3,0,0,7);ctx.stroke();return true;});';
const after  = 'const _sr=Math.max(s.r,0.01);ctx.ellipse(s.x,s.y,_sr,_sr*0.3,0,0,7);ctx.stroke();return true;});';

if (code.includes(after)) {
  console.log('已是最新，无需补丁');
} else if (code.includes(before)) {
  code = code.replace(before, after);
  writeFileSync(file, code, 'utf8');
  console.log('补丁已应用：opus-5-relay.html 256 行（负半径 clamp）');
} else {
  console.error('未找到补丁目标行，检查原件是否已变更');
  process.exitCode = 1;
}
