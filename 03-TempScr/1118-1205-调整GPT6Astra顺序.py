# -*- coding: utf-8 -*-
"""按用户截图箭头调整 2D 数据集顺序：GPT-6 Astra 插到 GPT-6 Sol 之前。

只移动 `window.SITES` 中的一个对象块，字段、评分、缩略图与 3D 数据集均不变。
数组顺序即展厅卡片与查看器翻页顺序（见 AGENTS.md §3）。
"""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
p = ROOT / 'sites-data.js'
s = p.read_text(encoding='utf-8')

start_marker = '  {\n    "file": "models/gpt-6.html",'
target_marker = '  {\n    "file": "models/gpt-6-sol.html",'
assert s.count(start_marker) == 1 and s.count(target_marker) == 1

i = s.index(start_marker)
end = s.index('\n  },\n', i)
block_end = end + len('\n  },')
block = s[i:block_end]                      # 形如 "  {\n ... \n  },"
assert '"slug": "gpt-6"' in block and '"slug": "gpt-6-2-astra"' not in block
assert s[block_end:block_end + 1] == '\n'

# 摘除首位块（含其后换行），再插到 gpt-6-sol 块之前
s2 = s[:i] + s[block_end + 1:]
t = s2.index(target_marker)
s3 = s2[:t] + block + '\n' + s2[t:]

p.write_text(s3, encoding='utf-8', newline='\n')

# 校验：2D 前 8 条顺序与条目总数
import re
head = s3.split('window.SITES_3D')[0]
arr = head.split('window.SITES = [')[1].split('\n];')[0]
slugs = re.findall(r'"slug":\s*"([^"]+)"', arr)
print('2D 条目数:', len(slugs))
print('GPT 前 8 条顺序:')
for n, slug in enumerate(slugs[:8], 1):
    print(f'  {n}. {slug}')
assert len(slugs) == 51
assert slugs[:6] == ['gpt-6-2-astra', 'gpt-6-1-sol', 'gpt-6-1-terra',
                     'gpt-6', 'gpt-6-sol', 'gpt-6-luna'], slugs[:6]
assert s3.count('"slug"') == 63
print('顺序调整完成，slug 总数 63')
