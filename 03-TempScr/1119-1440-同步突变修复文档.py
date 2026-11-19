"""1119-1440 同步「动图突变修复 + GPT-6.2 Astra 评分」后的活跃交接文档。"""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REPL = {
    "AGENTS.md": [
        (
            "- 静态缩略图：前 6 张 `loading=\"eager\" fetchpriority=\"high\"`，其余 `loading=\"lazy\"`；全部 `decoding=\"async\"` 并带 `width/height`。动画 WebP 在卡片 HTML 中直接带 `src`、`loading=\"eager\"`、`fetchpriority=\"low\"`，页面加载后自动加载并循环播放，不再依赖 hover。63 张动画 WebP 统一为 **640×400 / 18 帧 / 83ms（12fps）/ 1.494s 循环 / loop=0**，合计 **6.75 MB**（重编码前 12.12 MB）。`.thumb-anim` 另叠加 `thumb-drift` 10s 往返轻微推镜（CSS 合成层 60fps 插值），让源页面本身无动画的预览也有连续运动；`prefers-reduced-motion` 下自动关闭。hover 放大作用于 `.thumb-wrap` 容器，避免与动画的 `transform` 冲突。",
            "- 静态缩略图：前 6 张 `loading=\"eager\" fetchpriority=\"high\"`，其余 `loading=\"lazy\"`；全部 `decoding=\"async\"` 并带 `width/height`。动画 WebP 在卡片 HTML 中直接带 `src`、`loading=\"eager\"`、`fetchpriority=\"low\"`，页面加载后自动加载并循环播放，不再依赖 hover。63 张动画 WebP 统一 **640×400 / 130ms / loop=0**，帧数按素材自适应 **7~36 帧**（长序列取前段连续帧，相邻帧按像素差自适应补帧，单帧跳变受 `MAX_STEP=2.5` 约束），合计 **7.39 MB**（原始 12.12 MB）。`.thumb-anim` 叠加 `thumb-drift` **14s** 往返极轻微推镜（`scale 1→1.012`，CSS 合成层 60fps 插值），让源页面本身无动画的预览也有连续运动；`prefers-reduced-motion` 下自动关闭。hover 放大作用于 `.thumb-wrap` 容器，避免与动画的 `transform` 冲突。评分预置表 `DEFAULT_RATINGS` 含 `gpt-6-2-astra: 10`；用户在 localStorage 手动改过/清过的分数优先。",
        ),
        (
            "# 批量重编码全部动画 WebP（输入 02-TempFiles/backup-webp-1118-1720/，输出覆盖 thumbs/）\n\"C:/Users/mypra/.workbuddy/binaries/python/envs/default/Scripts/python.exe\" \"03-TempScr/1118-1720-重编码动图.py\"",
            "# 批量温和重编码全部动画 WebP（当前采用：自适应补帧限制单帧突变）\n\"C:/Users/mypra/.workbuddy/binaries/python/envs/default/Scripts/python.exe\" \"03-TempScr/1119-1410-平滑重编码动图.py\"\n# 历史版本（按变化量重采样，已弃用，会放大帧间跳变）：03-TempScr/1118-1720-重编码动图.py",
        ),
    ],
    "01-ProjectDoc/readme.md": [
        (
            "- 缩略图：每站点一张静态 PNG（原始 1280×900 系列，未改动）+ 一张动画 WebP；动画统一 **640×400 / 18 帧 / 83ms（12fps）/ 1.494s 循环**，页面加载后自动加载并循环播放，另叠加 CSS 合成层的 10s 往返轻微推镜。63 张动画合计 6.75 MB。",
            "- 缩略图：每站点一张静态 PNG（原始 1280×900 系列，未改动）+ 一张动画 WebP；动画统一 **640×400 / 130ms / loop=0**，帧数按素材自适应 7~36 帧（相邻帧按像素差补帧，限制单帧跳变），页面加载后自动加载并循环播放，另叠加 CSS 合成层的 14s 往返极轻微推镜。63 张动画合计 7.39 MB。",
        ),
    ],
    "01-ProjectDoc/architecture.md": [
        (
            "├─ thumbs/                 # 126 个缩略图：每个 slug 一份 png（静态）+ 一份 webp（640×400 / 18 帧 / 83ms 动画），共 63 组",
            "├─ thumbs/                 # 126 个缩略图：每个 slug 一份 png（静态）+ 一份 webp（640×400 / 130ms / 自适应帧数），共 63 组",
        ),
        (
            "| 缩略图生成 | 无头 Chrome 截图 + Pillow 合成动画 WebP | `03-TempScr/10月5日-1815-生成展厅缩略图.py` | `sites/*.html` | `thumbs/*.png|.webp` | 静态 PNG 1280×900 系列；动画经 `1118-1720-重编码动图.py` 统一为 640×400 / 18 帧 / 83ms | 脚本已生成 63 组，产物人工抽查 |",
            "| 缩略图生成 | 无头 Chrome 截图 + Pillow 合成动画 WebP | `03-TempScr/10月5日-1815-生成展厅缩略图.py` | `sites/*.html` | `thumbs/*.png|.webp` | 静态 PNG 1280×900 系列；动画经 `1119-1410-平滑重编码动图.py` 统一为 640×400 / 130ms / 自适应帧数 | 脚本已生成 63 组，产物人工抽查 |",
        ),
        (
            "- **缩略图规格**：改 `03-TempScr/10月5日-1815-生成展厅缩略图.py` 的 `SLUGS`、`BUDGETS`（8 个时间点采样）、`duration`；脚本对已存在的图会跳过，重截需先删。批量统一动画规格用 `03-TempScr/1118-1720-重编码动图.py`（按累计变化量重采样 + 插值补帧 + 帧独立化），原始素材备份在 `02-TempFiles/backup-webp-1118-1720/`。",
            "- **缩略图规格**：改 `03-TempScr/10月5日-1815-生成展厅缩略图.py` 的 `SLUGS`、`BUDGETS`（8 个时间点采样）、`duration`；脚本对已存在的图会跳过，重截需先删。批量统一动画规格用 `03-TempScr/1119-1410-平滑重编码动图.py`（保留原始帧 + 按像素差自适应补帧 + 首尾渐变闭环），原始素材备份在 `02-TempFiles/backup-webp-1118-1720/`。`1118-1720-重编码动图.py` 按累计变化量重采样，会放大帧间跳变，已弃用。",
        ),
    ],
    "01-ProjectDoc/usage.md": [
        (
            "- 图片：`thumbs/` 下每个 slug 两份——`<slug>.png`（静态封面，原始尺寸未改动）与 `<slug>.webp`（640×400 / 18 帧 / 83ms 动画，页面加载后自动加载并循环播放，另有 CSS 推镜），当前 126 个文件（63 组 png + 63 组 webp），63 张动画合计 6.75 MB。",
            "- 图片：`thumbs/` 下每个 slug 两份——`<slug>.png`（静态封面，原始尺寸未改动）与 `<slug>.webp`（640×400 / 130ms / 自适应 7~36 帧动画，页面加载后自动加载并循环播放，另有 CSS 推镜），当前 126 个文件（63 组 png + 63 组 webp），63 张动画合计 7.39 MB。",
        ),
    ],
}

for rel, pairs in REPL.items():
    p = ROOT / rel
    s = p.read_text(encoding="utf-8")
    for old, new in pairs:
        if old in s:
            s = s.replace(old, new, 1)
            print("OK  ", rel, "->", old[:40].replace("\n", " "))
        elif new in s:
            print("SKIP", rel, "-> 已同步")
        else:
            print("MISS", rel, "->", old[:60].replace("\n", " "))
    p.write_text(s, encoding="utf-8", newline="\n")

dep = ROOT / "01-ProjectDoc" / "deployment.md"
d = dep.read_text(encoding="utf-8")
line = (
    "\n## 2026-11-19 14:35 动图突变修复与评分更新部署记录\n\n"
    "- 部署专属域 `https://8f261524.peilika.pages.dev`，上传 65 个文件（63 张温和重编码 WebP + `assets/app.js` + `assets/style.css`），生产域 `https://peilika.pages.dev` 同步生效。\n"
    "- 动图改为保留原始帧 + 自适应补帧（`MAX_STEP=2.5`、130ms、640×400），体积 6.75 MB → 7.39 MB；`max>10` 的张数 20 → 6。CSS 推镜减弱为 14s / scale 1.012。`DEFAULT_RATINGS` 新增 `gpt-6-2-astra: 10`。\n"
    "- 线上核验：专属域与生产域首页 / app.js / style.css / 抽查 WebP 均 200 且 content-type 正确；线上 WebP 实测 640×400 / 26 帧 / 130ms / 3.38s；真实浏览器 51 张动图全部加载、Astra 卡片显示「10 分」5 颗满星、CSS 动画 14s 运行中、四张抽查卡片连续截屏无突变、console 与请求失败 0。\n"
    "- 报告见 `01-ProjectDoc/1119-1425-动图突变修复与评分更新报告.md`，证据 JSON 见 `1119-1430-评分与动图验收-本地.json` / `-线上.json`。\n"
)
if "14:35 动图突变修复与评分更新部署记录" not in d:
    dep.write_text(d.rstrip("\n") + "\n" + line, encoding="utf-8", newline="\n")
    print("OK   01-ProjectDoc/deployment.md 追加部署记录")
else:
    print("SKIP 01-ProjectDoc/deployment.md 已含本轮记录")
