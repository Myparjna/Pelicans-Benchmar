# -*- coding: utf-8 -*-
"""展厅 UI 调整：GitHub 图标垂直居中；所有动画 WebP 自动加载并播放。

只改 assets/app.js 与 assets/style.css，不触碰 models/ 与 sites/ 下的模型产出。
每处替换校验命中，替换后做关键标记自检。
"""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def replace(path, pairs):
    p = ROOT / path
    s = p.read_text(encoding='utf-8')
    for old, new in pairs:
        if old not in s:
            raise SystemExit(f'未命中 [{path}]: {old[:90]}')
        s = s.replace(old, new, 1)
    p.write_text(s, encoding='utf-8', newline='\n')
    print('已同步', path, f'({len(pairs)} 处)')
    return s


# ---- app.js：动画 WebP 直接带 src 自动加载；删除 hover 懒赋值 ----
app = replace('assets/app.js', [
    (r'''          <img class="thumb-anim" data-anim="${escapeHtml(s.thumb.replace(/\.png$/, '.webp'))}" alt="" aria-hidden="true" decoding="async">''',
     r'''          <img class="thumb-anim" src="${escapeHtml(s.thumb.replace(/\.png$/, '.webp'))}" alt="" aria-hidden="true" decoding="async" loading="eager" fetchpriority="low">'''),
    (r'''    root.addEventListener('pointerover', e => {
      if (!(e.target instanceof Element)) return;
      const card = e.target.closest('.site-card');
      if (!card || card.dataset.animLoaded) return;
      const anim = card.querySelector('.thumb-anim');
      if (anim && !anim.src) anim.src = anim.dataset.anim;
      card.dataset.animLoaded = '1';
    });
''', ''),
])
assert 'data-anim=' not in app and 'animLoaded' not in app, '懒加载残留'
assert 'class="thumb-anim" src=' in app and 'loading="eager" fetchpriority="low"' in app
print('  app.js 自检：动图直接带 src，hover 懒加载已移除')

# ---- style.css：动图常显自动播放；GitHub 图标相对 header 垂直居中 ----
css = replace('assets/style.css', [
    (r'''/* 悬停播放的动画预览（Animated WebP） */
.thumb-wrap .thumb-anim {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: none;
}

.site-card:hover .thumb-anim {
  display: block;
}

.site-card:hover .thumb-static {
  opacity: 0;
}

.site-card:hover .thumb-wrap img {
  transform: scale(1.03);
}''',
     r'''/* 自动加载并循环播放的动画预览（Animated WebP） */
.thumb-wrap .thumb-anim {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.site-card:hover .thumb-wrap img {
  transform: scale(1.03);
}'''),
    (r'''.github-link {
  position: absolute;
  top: 18px;
  right: 20px;''',
     r'''.github-link {
  position: absolute;
  top: 50%;
  right: 20px;
  transform: translateY(-50%);'''),
    (r'''  .github-link {
    top: 16px;
    right: 20px;
  }''',
     r'''  .github-link {
    top: 50%;
    right: 20px;
  }'''),
])
assert '.thumb-anim {' in css and 'display: block;' in css
assert 'top: 50%;' in css and 'transform: translateY(-50%);' in css
assert '.site-card:hover .thumb-anim' not in css and '.site-card:hover .thumb-static' not in css
print('  style.css 自检：动图常显、hover 门控移除、图标垂直居中')
print('UI 调整完成')
