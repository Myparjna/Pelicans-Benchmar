# -*- coding: utf-8 -*-
"""本地展厅验收：新条目、图标对齐、全部动画 WebP 自动加载播放。

使用系统 Chrome（playwright channel=chrome），独立 profile 与 CDP 端口。
验收结束关闭本任务 Chrome 与 Tab，保留本地静态服务。
"""
import json
import os
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
BASE = 'http://127.0.0.1:8137'
PROFILE = ROOT / '02-TempFiles' / 'chrome-profile-1118验收-9350'
SHOTS = ROOT / '02-TempFiles' / 'screenshots'
EVID = ROOT / '02-TempFiles' / 'requests'
for d in (PROFILE, SHOTS, EVID):
    d.mkdir(parents=True, exist_ok=True)

r = {'base': BASE, 'checks': {}, 'errors': [], 'failed': []}

with sync_playwright() as p:
    ctx = p.chromium.launch_persistent_context(
        user_data_dir=str(PROFILE), channel='chrome', headless=True,
        viewport={'width': 1600, 'height': 1000},
        args=['--remote-debugging-port=9350'])
    pg = ctx.new_page()
    pg.on('console', lambda m: r['errors'].append('console: ' + m.text[:200]) if m.type == 'error' else None)
    pg.on('pageerror', lambda e: r['errors'].append('pageerror: ' + str(e)[:200]))
    pg.on('requestfailed', lambda q: r['failed'].append(q.url[:160] + ' :: ' + str(q.failure)))
    pg.goto(BASE + '/index.html', wait_until='networkidle', timeout=90000)
    pg.wait_for_function("document.querySelectorAll('.site-card').length >= 51", timeout=30000)
    pg.wait_for_timeout(2500)
    c = r['checks']
    c['title'] = pg.title()
    c['h1'] = pg.locator('h1').inner_text()
    c['subtitle'] = pg.locator('.subtitle').inner_text()
    c['cards_2d'] = pg.locator('.site-card').count()
    c['filter_chips'] = pg.locator('#filterBar .filter-chip').count()

    # 新条目字段（参数量 / 知识截止）
    new = pg.locator('.site-card[data-slug="gpt-6-2-astra"]')
    c['new_card_present'] = new.count()
    c['new_card_title'] = new.locator('.card-title').inner_text() if new.count() else ''
    c['new_params_badge'] = new.locator('.params-badge').inner_text() if new.count() else ''
    c['new_cutoff_badge'] = new.locator('.cutoff-badge').inner_text() if new.count() else ''
    c['new_card_file'] = new.locator('.card-file').inner_text() if new.count() else ''

    # GitHub 图标与右侧控件垂直中心对齐
    c['header_align'] = pg.evaluate('''() => {
        const a = document.querySelector('.github-link').getBoundingClientRect();
        const b = document.querySelector('.header-actions').getBoundingClientRect();
        const d = document.querySelector('.brand').getBoundingClientRect();
        return {icon_cy: Math.round((a.top+a.bottom)/2*10)/10,
                actions_cy: Math.round((b.top+b.bottom)/2*10)/10,
                brand_cy: Math.round((d.top+d.bottom)/2*10)/10,
                delta_actions: Math.round(Math.abs((a.top+a.bottom-b.top-b.bottom)/2)*10)/10,
                delta_brand: Math.round(Math.abs((a.top+a.bottom-d.top-d.bottom)/2)*10)/10};
    }''')

    # 所有动画 WebP：直接带 src、加载完成、默认可见（自动播放）
    c['anim'] = pg.evaluate('''() => {
        const els = [...document.querySelectorAll('.thumb-anim')];
        const bad = els.filter(i => !i.getAttribute('src') || !i.complete || i.naturalWidth === 0
                                   || getComputedStyle(i).display === 'none');
        return {total: els.length,
                with_src: els.filter(i => i.getAttribute('src')).length,
                complete: els.filter(i => i.complete && i.naturalWidth > 0).length,
                visible: els.filter(i => getComputedStyle(i).display !== 'none').length,
                webp_src: els.filter(i => (i.getAttribute('src')||'').endsWith('.webp')).length,
                loading_eager: els.filter(i => i.getAttribute('loading') === 'eager').length,
                bad: bad.map(i => i.getAttribute('src')).slice(0, 8)};
    }''')
    c['static_loading'] = pg.evaluate('''() => {
        const els = [...document.querySelectorAll('.thumb-static')];
        return {total: els.length, eager: els.filter(i=>i.getAttribute('loading')==='eager').length,
                lazy: els.filter(i=>i.getAttribute('loading')==='lazy').length};
    }''')
    c['overflow_x'] = pg.evaluate('document.documentElement.scrollWidth - window.innerWidth')
    pg.screenshot(path=str(SHOTS / '1118-1140-首页-2D.png'), full_page=True)

    # 查看器：新页面 iframe
    new.click()
    pg.wait_for_timeout(1800)
    c['viewer_src'] = pg.locator('.viewer-frame-doc.is-current').get_attribute('src')
    c['viewer_src_all'] = pg.locator('.viewer-frame-doc').evaluate_all(
        'els => els.map(e => e.getAttribute("src"))')
    c['viewer_title'] = pg.locator('#viewerTitle').inner_text()
    c['viewer_params'] = pg.locator('#viewerParams').inner_text()
    c['viewer_cutoff'] = pg.locator('#viewerCutoff').inner_text()
    c['viewer_visible'] = pg.locator('#viewer').get_attribute('aria-hidden')
    pg.screenshot(path=str(SHOTS / '1118-1140-查看器-Astra.png'))
    pg.locator('#btnClose').click()
    pg.wait_for_timeout(400)

    # 3D 模式回归
    pg.locator('.mode-btn[data-mode="3d"]').click()
    pg.wait_for_function("document.querySelectorAll('.site-card').length >= 12", timeout=30000)
    pg.wait_for_timeout(1500)
    c['cards_3d'] = pg.locator('.site-card').count()
    c['anim_3d'] = pg.evaluate('''() => {
        const els=[...document.querySelectorAll('.thumb-anim')];
        return {total:els.length, complete:els.filter(i=>i.complete&&i.naturalWidth>0).length,
                visible:els.filter(i=>getComputedStyle(i).display!=='none').length};
    }''')
    pg.close()
    ctx.close()

r['errors'] = [e for e in r['errors'] if 'favicon' not in e.lower()]
print(json.dumps(r, ensure_ascii=False, indent=2))
with open(EVID / '1118-1140-收录与UI验收.json', 'w', encoding='utf-8', newline='\n') as f:
    json.dump(r, f, ensure_ascii=False, indent=2)
