"""批量生成展厅缩略图：静态 png + 动画 webp（与现有 34 个站点规格一致，1280x900）。"""

import os
import shutil
import subprocess
import sys

from PIL import Image

ROOT = r"C:\Users\mypra\Desktop\VibeCoding指南\skills测评项目\03-鹈鹕自行车测试"
SITES = os.path.join(ROOT, "sites")
THUMBS = os.path.join(ROOT, "thumbs")
TMP = r"C:\Users\mypra\AppData\Local\Temp\pel-thumbs"
CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"

SLUGS = [
    "seed-2-1-pro-0915",
    "gpt-6-sol",
    "gpt-6-luna",
    "gpt-6-1-sol",
    "step-5-preview",
    "hy4-preview",
    "spacebunny",
    "kimi-k2-8",
    "claude-sonnet-5-5",
    "claude-opus-5-5-zcode",
]

# 虚拟时间点（毫秒），逐帧推进以抓取不同动画时刻
BUDGETS = [900, 1150, 1400, 1650, 1900, 2150, 2400, 2650]


def shoot(slug_html, out_png, budget):
    subprocess.run(
        [
            CHROME,
            "--headless=new",
            "--disable-gpu",
            "--hide-scrollbars",
            "--no-first-run",
            "--window-size=1280,900",
            "--virtual-time-budget=%d" % budget,
            "--screenshot=%s" % out_png,
            "file:///" + slug_html.replace("\\", "/"),
        ],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
        timeout=90,
    )


def main():
    os.makedirs(TMP, exist_ok=True)
    frames_dir = os.path.join(TMP, "frames")
    shutil.rmtree(frames_dir, ignore_errors=True)
    os.makedirs(frames_dir, exist_ok=True)

    for slug in SLUGS:
        src = os.path.join(SITES, slug + ".html")
        tmp_html = os.path.join(TMP, slug + ".html")
        shutil.copyfile(src, tmp_html)

        paths = []
        for i, budget in enumerate(BUDGETS):
            out = os.path.join(frames_dir, "%s-%02d.png" % (slug, i))
            shoot(tmp_html, out, budget)
            if os.path.exists(out) and os.path.getsize(out) > 1000:
                paths.append(out)

        if not paths:
            print("!! 截图失败:", slug)
            continue

        # 静态首帧
        shutil.copyfile(paths[0], os.path.join(THUMBS, slug + ".png"))

        # 动画 webp
        imgs = [Image.open(p).convert("RGB") for p in paths]
        webp = os.path.join(THUMBS, slug + ".webp")
        imgs[0].save(
            webp,
            format="WEBP",
            save_all=True,
            append_images=imgs[1:],
            duration=260,
            loop=0,
            quality=78,
            method=4,
        )
        for im in imgs:
            im.close()
        print(
            "ok %-24s 帧=%d  png=%dKB  webp=%dKB"
            % (
                slug,
                len(paths),
                os.path.getsize(os.path.join(THUMBS, slug + ".png")) // 1024,
                os.path.getsize(webp) // 1024,
            )
        )
        sys.stdout.flush()

    shutil.rmtree(TMP, ignore_errors=True)
    print("完成")


if __name__ == "__main__":
    main()
