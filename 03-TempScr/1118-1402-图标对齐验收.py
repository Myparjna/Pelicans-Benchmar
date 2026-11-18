# -*- coding: utf-8 -*-
"""GitHub 图标对齐验收：桌面与窄屏两种视口，真实 Chrome。

检查：图标是否为右侧控件组最后一个成员、是否位于最右端、
上下边缘与搜索框是否齐平、无横向溢出与重叠、零 console 错误。
"""
import json
import os
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
BASE = os.environ.get('PELICAN_BASE', 'http://127.0.0.1:8137')
TAG = '线上' if BASE.startswith('https') else '本地'
PROFILE = ROOT / '02-TempFiles' / 'chrome-profile-1402-图标-9358'
SHOTS = ROOT / '02-TempFiles' / 'screenshots'
EVID = ROOT / '02-TempFiles' / 'requests'
for d in (PROFILE, SHOTS, EVID):
    d.mkdir(parents=True, exist_ok=True)

r = {'base': BASE, 'viewports': {}, 'errors': [], 'failed': [], 'aborted': []}

PROBE = '''() => {
    const g = document.querySelector('.github-link');
    const s = document.querySelector('.search-box');
    const a = document.querySelector('.header-actions');
    const b = document.querySelector('.brand');
    const gr = g.getBoundingClientRect(), sr = s.getBoundingClientRect(),
          ar = a.getBoundingClientRect(), br = b.getBoundingClientRect();
    const siblings = [...a.children].map(e => e.className);
    return {
        icon: {left:Math.round(gr.left), right:Math.round(gr.right), top:Math.round(gr.top),
               bottom:Math.round(gr.bottom), w:Math.round(gr.width), h:Math.round(gr.height)},
        search: {left:Math.round(sr.left), right:Math.round(sr.right), top:Math.round(sr.top),
                 bottom:Math.round(sr.bottom), w:Math.round(sr.width), h:Math.round(sr.height)},
        actions: {left:Math.round(ar.left), right:Math.round(ar.right)},
        brand_cy: Math.round((br.top+br.bottom)/2*10)/10,
        icon_cy: Math.round((gr.top+gr.bottom)/2*10)/10,
        last_child: siblings[siblings.length-1],
        is_last: g === a.lastElementChild,
        gap_to_search: Math.round(gr.left - sr.right),
        top_delta: Math.round(Math.abs(gr.top - sr.top)*10)/10,
        bottom_delta: Math.round(Math.abs(gr.bottom - sr.bottom)*10)/10,
        overflow_x: document.documentElement.scrollWidth - window.innerWidth,
        viewport_w: window.innerWidth
    };
}'''

with sync_playwright() as p:
    ctx = p.chromium.launch_persistent_context(
        user_data_dir=str(PROFILE), channel='chrome', headless=True,
        viewport={'width': 1600, 'height': 900},
        args=['--remote-debugging-port=9358',
              '--proxy-server=http://127.0.0.1:7897',
              '--proxy-bypass-list=127.0.0.1;localhost'])
    pg = ctx.new_page()
    pg.on('console', lambda m: r['errors'].append('console: ' + m.text[:200]) if m.type == 'error' else None)
    pg.on('pageerror', lambda e: r['errors'].append('pageerror: ' + str(e)[:200]))
    pg.on('requestfailed', lambda q: (r['aborted'] if 'ERR_ABORTED' in str(q.failure) else r['failed'])
          .append(q.url[:160] + ' :: ' + str(q.failure)))

    for name, w, h in [('desktop_1600', 1600, 900), ('mobile_390', 390, 844)]:
        pg.set_viewport_size({'width': w, 'height': h})
        pg.goto(BASE + '/index.html', wait_until='domcontentloaded', timeout=60000)
        pg.wait_for_timeout(1800)
        r['viewports'][name] = pg.evaluate(PROBE)
        pg.screenshot(path=str(SHOTS / f'1118-1402-header-{name}.png'),
                      clip={'x': 0, 'y': 0, 'width': w, 'height': min(h, 200)})
    pg.close()
    ctx.close()

for name, v in r['viewports'].items():
    ok = (v['is_last'] and v['top_delta'] == 0 and v['bottom_delta'] == 0
          and v['overflow_x'] == 0 and v['gap_to_search'] >= 0)
    print(name, 'PASS' if ok else 'CHECK', json.dumps(v, ensure_ascii=False))
print('errors =', len(r['errors']), r['errors'][:5])
print('failed =', len(r['failed']), r['failed'][:5])
print('aborted(切换视口时取消的动图请求) =', len(r['aborted']))
with open(EVID / f'1118-1402-图标对齐验收-{TAG}.json', 'w', encoding='utf-8', newline='\n') as f:
    json.dump(r, f, ensure_ascii=False, indent=2)
