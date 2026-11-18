# -*- coding: utf-8 -*-
"""线上验收：使用部署专属域，真实 Chrome 核验新条目、图标对齐、动图自动加载播放。

生产域有边缘缓存，按交接规范改用部署专属域。验收结束关闭本任务 Chrome。
"""
import json
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
BASE = 'https://6dc4ca32.peilika.pages.dev'
PROFILE = ROOT / '02-TempFiles' / 'chrome-profile-1118线上-9352'
SHOTS = ROOT / '02-TempFiles' / 'screenshots'
EVID = ROOT / '02-TempFiles' / 'requests'
for d in (PROFILE, SHOTS, EVID):
    d.mkdir(parents=True, exist_ok=True)

r = {'base': BASE, 'checks': {}, 'errors': [], 'failed': []}
with sync_playwright() as p:
    ctx = p.chromium.launch_persistent_context(
        user_data_dir=str(PROFILE), channel='chrome', headless=True,
        viewport={'width': 1600, 'height': 1000},
        args=['--remote-debugging-port=9352',
              '--proxy-server=http://127.0.0.1:7897',
              '--proxy-bypass-list=127.0.0.1;localhost'])
    pg = ctx.new_page()
    pg.on('console', lambda m: r['errors'].append('console: ' + m.text[:200]) if m.type == 'error' else None)
    pg.on('pageerror', lambda e: r['errors'].append('pageerror: ' + str(e)[:200]))
    pg.on('requestfailed', lambda q: r['failed'].append(q.url[:160] + ' :: ' + str(q.failure)))
    pg.goto(BASE + '/index.html', wait_until='networkidle', timeout=90000)
    pg.wait_for_function("document.querySelectorAll('.site-card').length >= 51", timeout=40000)
    pg.wait_for_timeout(3000)
    c = r['checks']
    c['title'] = pg.title()
    c['h1'] = pg.locator('h1').inner_text()
    c['cards_2d'] = pg.locator('.site-card').count()
    new = pg.locator('.site-card[data-slug="gpt-6-2-astra"]')
    c['new_card'] = new.count()
    c['new_title'] = new.locator('.card-title').inner_text() if new.count() else ''
    c['new_params'] = new.locator('.params-badge').inner_text() if new.count() else ''
    c['new_cutoff'] = new.locator('.cutoff-badge').inner_text() if new.count() else ''
    c['header_align'] = pg.evaluate('''() => {
        const a=document.querySelector('.github-link').getBoundingClientRect();
        const b=document.querySelector('.header-actions').getBoundingClientRect();
        return Math.round(Math.abs((a.top+a.bottom-b.top-b.bottom)/2)*10)/10;
    }''')
    c['anim'] = pg.evaluate('''() => {
        const els=[...document.querySelectorAll('.thumb-anim')];
        return {total:els.length,
                with_src:els.filter(i=>i.getAttribute('src')).length,
                complete:els.filter(i=>i.complete&&i.naturalWidth>0).length,
                visible:els.filter(i=>getComputedStyle(i).display!=='none').length,
                webp:els.filter(i=>(i.getAttribute('src')||'').endsWith('.webp')).length};
    }''')
    c['overflow_x'] = pg.evaluate('document.documentElement.scrollWidth-window.innerWidth')
    pg.screenshot(path=str(SHOTS / '1118-1150-线上首页.png'), full_page=True)
    new.click()
    pg.wait_for_timeout(2000)
    c['viewer_src'] = pg.locator('.viewer-frame-doc.is-current').get_attribute('src')
    c['viewer_title'] = pg.locator('#viewerTitle').inner_text()
    pg.screenshot(path=str(SHOTS / '1118-1150-线上查看器.png'))
    pg.close()
    ctx.close()
r['errors'] = [e for e in r['errors'] if 'favicon' not in e.lower()]
print(json.dumps(r, ensure_ascii=False, indent=2))
with open(EVID / '1118-1150-线上验收.json', 'w', encoding='utf-8', newline='\n') as f:
    json.dump(r, f, ensure_ascii=False, indent=2)
