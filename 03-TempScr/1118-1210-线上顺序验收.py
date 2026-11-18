# -*- coding: utf-8 -*-
"""线上顺序验收：部署专属域，真实 Chrome 核验 GPT 分类卡片顺序与零错误。"""
import json
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
BASE = 'https://fe0ad14b.peilika.pages.dev'
PROFILE = ROOT / '02-TempFiles' / 'chrome-profile-1118顺序线上-9354'
SHOTS = ROOT / '02-TempFiles' / 'screenshots'
EVID = ROOT / '02-TempFiles' / 'requests'
for d in (PROFILE, SHOTS, EVID):
    d.mkdir(parents=True, exist_ok=True)

r = {'base': BASE, 'checks': {}, 'errors': [], 'failed': []}
with sync_playwright() as p:
    ctx = p.chromium.launch_persistent_context(
        user_data_dir=str(PROFILE), channel='chrome', headless=True,
        viewport={'width': 1600, 'height': 1000},
        args=['--remote-debugging-port=9354',
              '--proxy-server=http://127.0.0.1:7897',
              '--proxy-bypass-list=127.0.0.1;localhost'])
    pg = ctx.new_page()
    pg.on('console', lambda m: r['errors'].append('console: ' + m.text[:200]) if m.type == 'error' else None)
    pg.on('pageerror', lambda e: r['errors'].append('pageerror: ' + str(e)[:200]))
    pg.on('requestfailed', lambda q: r['failed'].append(q.url[:160] + ' :: ' + str(q.failure)))
    pg.goto(BASE + '/index.html', wait_until='networkidle', timeout=90000)
    pg.wait_for_function("document.querySelectorAll('.site-card').length >= 51", timeout=40000)
    pg.wait_for_timeout(2500)
    c = r['checks']
    c['title'] = pg.title()
    c['cards_2d'] = pg.locator('.site-card').count()
    c['gpt_order'] = pg.locator('#galleryRoot .site-card').evaluate_all(
        'els => els.slice(0, 8).map(e => e.dataset.slug)')
    c['first_card_title'] = pg.locator('.site-card').first.locator('.card-title').inner_text()
    c['anim_complete'] = pg.evaluate('''() => {
        const els=[...document.querySelectorAll('.thumb-anim')];
        return els.filter(i=>i.complete&&i.naturalWidth>0&&getComputedStyle(i).display!=='none').length;
    }''')
    c['overflow_x'] = pg.evaluate('document.documentElement.scrollWidth-window.innerWidth')
    pg.screenshot(path=str(SHOTS / '1118-1210-线上顺序调整后首页.png'), full_page=True)
    pg.close()
    ctx.close()
r['errors'] = [e for e in r['errors'] if 'favicon' not in e.lower()]
print(json.dumps(r, ensure_ascii=False, indent=2))
with open(EVID / '1118-1210-线上顺序验收.json', 'w', encoding='utf-8', newline='\n') as f:
    json.dump(r, f, ensure_ascii=False, indent=2)
