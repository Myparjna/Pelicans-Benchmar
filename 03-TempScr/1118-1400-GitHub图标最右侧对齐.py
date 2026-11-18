# -*- coding: utf-8 -*-
"""GitHub 图标：置于右侧控件组最末位，与搜索框等高、上下边缘对齐。

从 .header-inner 的绝对定位子元素改为 .header-actions 的 flex 成员，
去掉为绝对定位预留的 padding-right，响应式下让搜索框可收缩。
每处替换校验命中，替换后做标记自检。
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


# ---- index.html：图标移入 .header-actions 末尾 ----
html = replace('index.html', [
    ('''        <label class="search-box" for="searchInput">
          <i class="ti ti-search"></i>
          <input type="search" id="searchInput" placeholder="搜索模型或厂商…" autocomplete="off">
        </label>
      </div>
      <a class="github-link" href="https://github.com/Myparjna/Pelicans-Benchmar" target="_blank" rel="noopener" aria-label="GitHub 仓库"><i class="ti ti-brand-github"></i></a>
    </div>''',
     '''        <label class="search-box" for="searchInput">
          <i class="ti ti-search"></i>
          <input type="search" id="searchInput" placeholder="搜索模型或厂商…" autocomplete="off">
        </label>
        <a class="github-link" href="https://github.com/Myparjna/Pelicans-Benchmar" target="_blank" rel="noopener" aria-label="GitHub 仓库"><i class="ti ti-brand-github"></i></a>
      </div>
    </div>'''),
])
assert html.index('class="github-link"') < html.index('</header>')
assert html.index('class="header-actions"') < html.index('class="github-link"') < html.index('  </header>')
print('  index.html 自检：图标已位于 header-actions 内')

# ---- style.css：改为 flex 成员、40x40 等高；移除绝对定位与预留间距 ----
css = replace('assets/style.css', [
    ('''.github-link {
  position: absolute;
  top: 50%;
  right: 20px;
  transform: translateY(-50%);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;''',
     '''.github-link {
  flex: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;'''),
    ('''.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: none;
  padding-right: 46px;
}''',
     '''.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: none;
}'''),
    ('''  .brand {
    padding-right: 46px;
  }

''', ''),
    ('''  .header-actions {
    width: 100%;
    padding-right: 0;
  }

  .github-link {
    top: 50%;
    right: 20px;
  }

''',
     '''  .header-actions {
    width: 100%;
  }

'''),
    ('''  .search-box {
    width: 100%;
  }''',
     '''  .search-box {
    flex: 1;
    width: auto;
    min-width: 0;
  }'''),
])
assert 'position: absolute;\n  top: 50%;\n  right: 20px;\n  transform: translateY(-50%);' not in css
assert 'padding-right: 46px' not in css
assert 'width: 40px;\n  height: 40px;' in css
print('  style.css 自检：绝对定位与预留间距已移除，图标 40x40')
print('图标调整完成')
