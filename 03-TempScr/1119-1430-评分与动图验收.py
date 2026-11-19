"""1119-1430 评分登记 + 动图突变修复 验收（本地/线上通用）。

只检查展厅容器、资源与渲染表现，不对模型页面做复核/评审/评分。
用法：PELICAN_BASE=https://<专属域> python 1119-1430-评分与动图验收.py
"""
import io
import json
import os
from pathlib import Path

from PIL import Image, ImageChops, ImageStat
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
BASE = os.environ.get("PELICAN_BASE", "http://127.0.0.1:8137")
EVID = ROOT / "02-TempFiles" / "requests"
EVID.mkdir(parents=True, exist_ok=True)
SHOT = ROOT / "02-TempFiles" / "screenshots"
SHOT.mkdir(parents=True, exist_ok=True)
TAG = "线上" if BASE.startswith("https") else "本地"

r = {"base": BASE, "tag": TAG, "checks": {}, "errors": [], "failed": [], "aborted": []}


def diff(a, b):
    ia = Image.open(io.BytesIO(a)).convert("RGB").resize((160, 100))
    ib = Image.open(io.BytesIO(b)).convert("RGB").resize((160, 100))
    return round(sum(ImageStat.Stat(ImageChops.difference(ia, ib)).mean) / 3, 2)


with sync_playwright() as p:
    ctx = p.chromium.launch_persistent_context(
        user_data_dir=str(ROOT / "02-TempFiles" / f"chrome-profile-1119-{TAG}-9380"),
        channel="chrome", headless=True, viewport={"width": 1600, "height": 900},
        args=["--remote-debugging-port=9380", "--proxy-server=http://127.0.0.1:7897",
              "--proxy-bypass-list=127.0.0.1;localhost"])
    pg = ctx.new_page()
    pg.on("console", lambda m: r["errors"].append("console: " + m.text[:200]) if m.type == "error" else None)
    pg.on("pageerror", lambda e: r["errors"].append("pageerror: " + str(e)[:200]))
    pg.on("requestfailed", lambda q: (
        r["aborted"].append(q.url[:120]) if "ERR_ABORTED" in str(q.failure)
        else r["failed"].append(q.url[:120] + " :: " + str(q.failure))))
    pg.goto(BASE + "/index.html", wait_until="domcontentloaded", timeout=90000)
    try:
        pg.wait_for_function(
            "() => {const a=[...document.querySelectorAll('.thumb-anim')];"
            "return a.length>0 && a.every(i=>i.complete && i.naturalWidth>0);}", timeout=90000)
    except Exception:
        pass
    pg.wait_for_timeout(1200)
    c = r["checks"]

    c["title"] = pg.title()
    c["cards_2d"] = pg.locator(".site-card").count()
    c["anim_total"] = pg.locator(".thumb-anim").count()
    c["anim_loaded"] = pg.evaluate(
        "() => [...document.querySelectorAll('.thumb-anim')].filter(i=>i.complete&&i.naturalWidth>0).length")
    c["anim_sizes"] = pg.evaluate(
        "() => [...new Set([...document.querySelectorAll('.thumb-anim')].map(i=>i.naturalWidth+'x'+i.naturalHeight))]")
    c["css_animation"] = pg.evaluate("""() => {
        const a=document.querySelector('.thumb-anim');
        return {name:getComputedStyle(a).animationName, duration:getComputedStyle(a).animationDuration,
                running:a.getAnimations().length};
    }""")
    # 评分：GPT-6.2 Astra 应为 10 分（5 颗满星）
    c["astra_rating"] = pg.evaluate("""() => {
        const card=document.querySelector('.site-card[data-slug="gpt-6-2-astra"]');
        if(!card) return 'card-not-found';
        const score=card.querySelector('.star-score');
        const fills=[...card.querySelectorAll('.stars > *')].map(e=>getComputedStyle(e).width);
        return {text:score?score.textContent:'', rated:score?score.classList.contains('rated'):false,
                star_count:card.querySelectorAll('.stars > *').length};
    }""")
    c["first_card_slug"] = pg.locator(".site-card").first.get_attribute("data-slug")
    c["fps_2s"] = pg.evaluate("""() => new Promise(res=>{
        let f=0; const t0=performance.now();
        function tick(){f++; if(performance.now()-t0<2000) requestAnimationFrame(tick);
          else res(Math.round(f/((performance.now()-t0)/1000)));}
        requestAnimationFrame(tick);})""")
    c["overflow_x"] = pg.evaluate("document.documentElement.scrollWidth-window.innerWidth")

    # 连续渲染截图：验证「有连续运动」且「没有某一帧突然大跳」
    for slug in ["gpt-6-2-astra", "gpt-5-6-luna-codex", "gpt-5-6-codex", "deepseek-v4-flash-0424-wb"]:
        card = pg.locator('.site-card[data-slug="%s"] .thumb-wrap' % slug)
        if not card.count():
            c["motion_" + slug] = "card-not-found"
            continue
        bufs = []
        for k in range(8):
            bufs.append(card.screenshot())
            pg.wait_for_timeout(260)
        ds = [diff(bufs[i - 1], bufs[i]) for i in range(1, len(bufs))]
        avg = sum(ds) / len(ds)
        c["motion_" + slug] = {"adjacent_pixel_diff": ds, "avg": round(avg, 2),
                               "min": min(ds), "max": max(ds),
                               "spike": any(d > max(6.0, avg * 3) for d in ds)}
    pg.screenshot(path=str(SHOT / f"1119-1430-{TAG}展厅首页.png"), full_page=False)
    pg.close()
    ctx.close()

print(json.dumps(r, ensure_ascii=False, indent=2))
with open(EVID / f"1119-1430-评分与动图验收-{TAG}.json", "w", encoding="utf-8", newline="\n") as f:
    json.dump(r, f, ensure_ascii=False, indent=2)
