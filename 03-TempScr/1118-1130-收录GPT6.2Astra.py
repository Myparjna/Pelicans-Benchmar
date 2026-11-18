# -*- coding: utf-8 -*-
"""收录 GPT-6.2 Astra《鹈鹕海岸骑行》条目（鹈鹕自行车测试展厅 SOP）。

动作：原件归档 models/、展厅副本 sites/、sites-data.js 登记、index.html 计数与日期同步。
产出 HTML 原样保留，不修改模型页面内容。每处文本替换均校验命中。
"""
import hashlib
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = Path(r'C:\Users\mypra\Documents\临时项目\1118-1042-鹈鹕海岸骑行.html')
SLUG = 'gpt-6-2-astra'
RELEASED = 1794972406  # 2026-11-18 11:26:46 +0800，取自 date +%s

if not SRC.is_file():
    raise SystemExit('源文件不存在：' + str(SRC))

raw = SRC.read_bytes()
print('源文件', SRC.stat().st_size, 'B  md5=', hashlib.md5(raw).hexdigest())

model_file = ROOT / 'models' / f'{SLUG}.html'
site_file = ROOT / 'sites' / f'{SLUG}.html'
for dst in (model_file, site_file):
    shutil.copyfile(SRC, dst)
    assert hashlib.md5(dst.read_bytes()).hexdigest() == hashlib.md5(raw).hexdigest()
    print('已写入', dst.relative_to(ROOT), dst.stat().st_size, 'B')


def replace(path, pairs):
    p = ROOT / path
    s = p.read_text(encoding='utf-8')
    for old, new in pairs:
        if old not in s:
            raise SystemExit(f'未命中 [{path}]: {old[:80]}')
        s = s.replace(old, new, 1)
    p.write_text(s, encoding='utf-8', newline='\n')
    print('已同步', path, f'({len(pairs)} 处)')


# 数据登记：置于 GPT 分类 gpt-6 (Astra) 之后
anchor = '''    "released": 1788552838
  },
  {
    "file": "models/gpt-6-1-sol.html",'''
entry = '''    "released": 1788552838
  },
  {
    "file": "models/gpt-6-2-astra.html",
    "slug": "gpt-6-2-astra",
    "category": "GPT",
    "model": "GPT-6.2 Astra",
    "channel": "Codex · 思考程度中",
    "thumb": "thumbs/gpt-6-2-astra.png",
    "src": "sites/gpt-6-2-astra.html",
    "params": "未公开",
    "cutoff": "2026-04",
    "thinking": "中",
    "env": "Codex",
    "released": 1794972406
  },
  {
    "file": "models/gpt-6-1-sol.html",'''
replace('sites-data.js', [(anchor, entry)])

# 首页计数与更新日期：2D 由 50 增至 51，合计 62 增至 63
replace('index.html', [
    ('<title>AI模型鹈鹕自行车测试 · 50 个模型对比</title>',
     '<title>AI模型鹈鹕自行车测试 · 51 个模型对比</title>'),
    ('content="对比 50 个国内外大模型/平台生成的鹈鹕自行车主题网页效果',
     'content="对比 51 个国内外大模型/平台生成的鹈鹕自行车主题网页效果'),
    ('<h1>更新至 2026-11-13</h1>', '<h1>更新至 2026-11-18</h1>'),
    ('鹈鹕自行车测试 · 50 个模型/版本生成效果对比',
     '鹈鹕自行车测试 · 51 个模型/版本生成效果对比'),
])

# 自动校验登记结果
s = (ROOT / 'sites-data.js').read_text(encoding='utf-8')
assert s.count('"slug"') == 63, s.count('"slug"')
assert '"slug": "gpt-6-2-astra"' in s
print('sites-data.js slug 总数 =', s.count('"slug"'), '（2D 51 + 3D 12）')
print('收录完成，待生成缩略图')
