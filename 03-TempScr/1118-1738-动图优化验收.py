"""1118-1738 动图重编码 + CSS 连续运动层 本地验收。

只检查展厅容器、资源与渲染表现，不对模型页面做复核/评审/评分。
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
        user_data_dir=str(ROOT / "02-TempFiles" / f"chrome-profile-1738-{TAG}-9370"),
        channel="chrome", headless=True, viewport={"width": 1600, "height": 900},
        args=["--remote-debugging-port=9370", "--proxy-server=http://127.0.0.1:7897",
              "--proxy-bypass-list=127.0.0.1;localhost"])
    pg = ctx.new_page()
    pg.on("console", lambda m: r["errors"].append("console: " + m.text[:200]) if m.type == "error" else None)
    pg.on("pageerror", lambda e: r["errors"].append("pageerror: " + str(e)[:200]))
    pg.on("requestfailed", lambda q: (
        r["aborted"].append(q.url[:120]) if "ERR_ABORTED" in str(q.failure)
        else r["failed"].append(q.url[:120] + " :: " + str(q.failure))))
    pg.goto(BASE + "/index.html", wait_until="domcontentloaded", timeout=90000)
    # 全量自动加载的动图需要按网络状况等待，避免把「还在下载」误判成破图
    try:
        pg.wait_for_function(
            "() => {const a=[...document.querySelectorAll('.thumb-anim')];"
            "return a.length>0 && a.every(i=>i.complete && i.naturalWidth>0);}",
            timeout=90000)
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
    c["webp_requests"] = pg.evaluate(
        "() => performance.getEntriesByType('resource').filter(e=>e.name.endsWith('.webp')).length")
    c["webp_transfer_MB"] = round(pg.evaluate(
        "() => performance.getEntriesByType('resource').filter(e=>e.name.endsWith('.webp'))"
        ".reduce((s,e)=>s+(e.transferSize||e.encodedBodySize||0),0)") / 1048576, 2)
    c["css_animation"] = pg.evaluate("""() => {
        const a=document.querySelector('.thumb-anim');
        return {name:getComputedStyle(a).animationName, duration:getComputedStyle(a).animationDuration,
                running:a.getAnimations().length};
    }""")
    c["hover_scale"] = pg.evaluate("""() => {
        const w=document.querySelector('.site-card .thumb-wrap');
        return getComputedStyle(w).transitionProperty;
    }""")
    c["fps_2s"] = pg.evaluate("""() => new Promise(res=>{
        let f=0; const t0=performance.now();
        function tick(){f++; if(performance.now()-t0<2000) requestAnimationFrame(tick);
          else res(Math.round(f/((performance.now()-t0)/1000)));}
        requestAnimationFrame(tick);})""")
    c["overflow_x"] = pg.evaluate("document.documentElement.scrollWidth-window.innerWidth")

    # 连续渲染截图：量化「动感」，重点看原本几乎静止的 Codex 两张
    for slug in ["gpt-5-6-luna-codex", "gpt-5-6-codex", "gpt-6-2-astra", "3d-deepseek-v4-pro"]:
        card = pg.locator('.site-card[data-slug="%s"] .thumb-wrap' % slug)
        if not card.count():
            c["motion_" + slug] = "card-not-found"
            continue
        bufs = []
        for k in range(6):
            bufs.append(card.screenshot())
            pg.wait_for_timeout(300)
        ds = [diff(bufs[i - 1], bufs[i]) for i in range(1, len(bufs))]
        c["motion_" + slug] = {"adjacent_pixel_diff": ds,
                               "avg": round(sum(ds) / len(ds), 2), "min": min(ds), "max": max(ds)}
    # 同口径对照：临时换回备份原件 + 关闭 CSS 推镜，量化优化前的「动感」
    # 备份目录不随 dist 部署，仅本地可做
    if not BASE.startswith("https"):
        pg.evaluate("""() => {
            const a=document.querySelector('.site-card[data-slug="gpt-5-6-luna-codex"] .thumb-anim');
            a.src='02-TempFiles/backup-webp-1118-1720/gpt-5-6-luna-codex.webp';
            a.style.animation='none';
        }""")
        pg.wait_for_timeout(1800)
        card = pg.locator('.site-card[data-slug="gpt-5-6-luna-codex"] .thumb-wrap')
        old = []
        for k in range(6):
            old.append(card.screenshot())
            pg.wait_for_timeout(300)
        ds = [diff(old[i - 1], old[i]) for i in range(1, len(old))]
        c["baseline_luna_codex"] = {"adjacent_pixel_diff": ds,
                                    "avg": round(sum(ds) / len(ds), 2), "min": min(ds), "max": max(ds)}
        pg.evaluate("""() => {
            const a=document.querySelector('.site-card[data-slug="gpt-5-6-luna-codex"] .thumb-anim');
            a.src='thumbs/gpt-5-6-luna-codex.webp'; a.style.animation='';
        }""")
        pg.wait_for_timeout(1200)
    pg.screenshot(path=str(SHOT / f"1118-1738-{TAG}展厅首页.png"), full_page=False)
    pg.close()
    ctx.close()

print(json.dumps(r, ensure_ascii=False, indent=2))
with open(EVID / f"1118-1738-动图优化验收-{TAG}.json", "w", encoding="utf-8", newline="\n") as f:
    json.dump(r, f, ensure_ascii=False, indent=2)
