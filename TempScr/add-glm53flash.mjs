// 单独为新增的 GLM 5.3 Flash (智谱官网) 生成 sites/ 副本，不影响其它条目
import { copyFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = 'C:/Users/mypra/Desktop/VibeCoding指南/skills测评项目/03-鹈鹕自行车测试';
const from = join(ROOT, '智谱官网glm5.3flash.html');
const to = join(ROOT, 'sites', 'glm-5-3-flash-zhipu.html');
copyFileSync(from, to);
console.log('已复制:', from, '->', to);
