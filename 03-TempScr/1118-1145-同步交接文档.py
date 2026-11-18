# -*- coding: utf-8 -*-
"""增量同步活跃交接文档：条目计数、动图自动播放、图标对齐。

按「唯一命中行 + 子串替换」方式修改，历史回归记录保持原文不回改时点状态。
"""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def sub_line(path, needle, pairs):
    p = ROOT / path
    lines = p.read_text(encoding='utf-8').splitlines(keepends=True)
    idx = [i for i, l in enumerate(lines) if needle in l]
    if len(idx) != 1:
        raise SystemExit(f'[{path}] 命中 {len(idx)} 行，期望 1 行：{needle}')
    line = lines[idx[0]]
    for old, new in pairs:
        if old not in line:
            raise SystemExit(f'[{path}] 行内未命中：{old}  ←  {line[:90]}')
        line = line.replace(old, new)
    lines[idx[0]] = line
    p.write_text(''.join(lines), encoding='utf-8', newline='')
    print('  已改', path, '|', needle[:36])


def append(path, text):
    p = ROOT / path
    s = p.read_text(encoding='utf-8')
    p.write_text(s.rstrip('\n') + '\n\n' + text.strip() + '\n', encoding='utf-8', newline='\n')
    print('  已追加', path)


print('=== AGENTS.md ===')
sub_line('AGENTS.md', 'index.html            展厅首页', [('50 个模型/版本', '51 个模型/版本')])
sub_line('AGENTS.md', 'sites-data.js         唯一数据源', [('50 条 2D', '51 条 2D'), ('合计 62 个 slug', '合计 63 个 slug')])
sub_line('AGENTS.md', 'sites/                部署用的页面副本', [('62 个 = 50 + 12', '63 个 = 51 + 12')])
sub_line('AGENTS.md', '- 默认基线在', [('2D 50 条', '2D 51 条')])
sub_line('AGENTS.md', '- `window.SITES`（50 条', [('（50 条，平面动画版）', '（51 条，平面动画版）')])
sub_line('AGENTS.md', '- 图片：前 6 张', [
    ('- 图片：前 6 张 `loading="eager" fetchpriority="high"`，其余 `loading="lazy"`；静态图全部 `decoding="async"` 并带 `width/height`；动画 WebP 只在首次 hover 时才赋 `src`。',
     '- 静态缩略图：前 6 张 `loading="eager" fetchpriority="high"`，其余 `loading="lazy"`；全部 `decoding="async"` 并带 `width/height`。动画 WebP 在卡片 HTML 中直接带 `src`、`loading="eager"`、`fetchpriority="low"`，页面加载后自动加载并循环播放，不再依赖 hover。63 张动画 WebP 合计约 12.1 MB。')])
append('AGENTS.md', '''### 2026-11-18 UI 约定补充

- 右上角 GitHub 图标使用 `top: 50%` + `transform: translateY(-50%)`，相对 `.header-inner` 垂直居中，与 brand、header-actions 同中心；响应式断点只覆盖 `top`/`right`，不覆盖 transform。
- 动画 WebP 默认 `display: block` 覆盖在静态 PNG 之上；静态 PNG 保留作加载失败时的回退。`.site-card:hover .thumb-anim` 与 `.site-card:hover .thumb-static` 两条门控已移除，hover 只保留轻微放大。
- 2D 新增字段 `thinking`、`env` 为可选元数据（当前仅 `gpt-6-2-astra` 登记），界面不渲染，改动渲染逻辑时勿误删。''')

print('=== readme.md ===')
sub_line('01-ProjectDoc/readme.md', '需向交接人确认: 62 个模型产出', [('62 个模型产出（50 个 2D + 12 个 3D）', '63 个模型产出（51 个 2D + 12 个 3D）')])
sub_line('01-ProjectDoc/readme.md', '把 62 个国内外大模型', [('把 62 个', '把 63 个'), ('（50 个平面动画版 + 12 个体素场景版）', '（51 个平面动画版 + 12 个体素场景版）')])
sub_line('01-ProjectDoc/readme.md', '- 展示模式：顶部', [('2D 模式为 50 个平面动画版本', '2D 模式为 51 个平面动画版本')])
sub_line('01-ProjectDoc/readme.md', '- 缩略图：每站点', [('（卡片 hover 时播放）', '（页面加载后自动加载并循环播放）')])
sub_line('01-ProjectDoc/readme.md', '- 渐进式渲染：卡片按帧', [('缩略图按需加载', '静态缩略图按需加载、动画 WebP 全部自动加载播放')])
sub_line('01-ProjectDoc/readme.md', '| 数据源 |', [('`window.SITES` 50 条', '`window.SITES` 51 条'), ('合计 62 个 slug', '合计 63 个 slug')])

print('=== deployment.md ===')
sub_line('01-ProjectDoc/deployment.md', '确认 50 张卡片', [('确认 50 张卡片', '确认 51 张卡片')])
sub_line('01-ProjectDoc/deployment.md', '应为 62', [('应为 62', '应为 63')])

print('=== architecture.md ===')
sub_line('01-ProjectDoc/architecture.md', '├─ sites-data.js', [('window.SITES 50 条', 'window.SITES 51 条'), ('合计 62 个 slug', '合计 63 个 slug')])
sub_line('01-ProjectDoc/architecture.md', '├─ sites/', [('62 个 ASCII 命名干净副本（50 个 2D + 12 个 3D', '63 个 ASCII 命名干净副本（51 个 2D + 12 个 3D')])
sub_line('01-ProjectDoc/architecture.md', '├─ thumbs/', [('124 个缩略图', '126 个缩略图'), ('共 62 组', '共 63 组')])
sub_line('01-ProjectDoc/architecture.md', '| 数据层 |', [('50 + 12 条站点元数据', '51 + 12 条站点元数据')])
sub_line('01-ProjectDoc/architecture.md', '| 缩略图生成 |', [('脚本已生成 62 组', '脚本已生成 63 组')])

print('=== usage.md ===')
sub_line('01-ProjectDoc/usage.md', '- 前置：展厅已加载', [('`sites-data.js` 50 条数据', '`sites-data.js` 51 条数据')])
sub_line('01-ProjectDoc/usage.md', '- 输入数据：各模型产出', [('当前 62 个（50 个 2D + 12 个 3D）', '当前 63 个（51 个 2D + 12 个 3D）')])
sub_line('01-ProjectDoc/usage.md', '- 元数据：`sites-data.js`', [
    ('`window.SITES` 50 条', '`window.SITES` 51 条'), ('合计 62 个 slug', '合计 63 个 slug'),
    ('`file/slug/category/model/channel/thumb/src/params/cutoff/released`',
     '`file/slug/category/model/channel/thumb/src/params/cutoff/released`，可选 `thinking/env`')])
sub_line('01-ProjectDoc/usage.md', '- 图片：`thumbs/`', [
    ('hover 播放', '页面加载后自动加载并循环播放'),
    ('当前 124 个文件（62 组 png + 62 组 webp）', '当前 126 个文件（63 组 png + 63 组 webp）')])

print('=== 活跃文档同步完成；历史回归记录保持原文 ===')
