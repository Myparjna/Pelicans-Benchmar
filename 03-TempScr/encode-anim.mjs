// 用 ffmpeg 把帧序列合成 Animated WebP（loop 0，8fps）到 thumbs/<slug>.webp
import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = 'C:/Users/mypra/Desktop/鹈鹕自行车测试';
const src = readFileSync(join(ROOT, 'sites-data.js'), 'utf8');
const sites = JSON.parse(src.slice(src.indexOf('['), src.lastIndexOf(']') + 1));

let ok = 0, fail = 0;
for (const s of sites) {
  const dir = join(ROOT, 'TempFiles', 'anim-frames', s.slug);
  const first = join(dir, 'f-00.png');
  if (!existsSync(first)) { console.log(`SKIP ${s.slug}（无帧）`); fail++; continue; }
  const out = join(ROOT, 'thumbs', s.slug + '.webp');
  try {
    execFileSync('ffmpeg', [
      '-y', '-framerate', '8',
      '-i', join(dir, 'f-%02d.png'),
      '-loop', '0',
      '-vf', 'scale=640:-2',
      '-quality', '65', '-compression_level', '6',
      '-an', out,
    ], { stdio: 'pipe' });
    ok++;
  } catch (e) {
    console.log(`FAIL ${s.slug}: ${e.message.split('\n')[0]}`);
    fail++;
  }
}
console.log(`合成完成 OK=${ok} FAIL=${fail}`);
