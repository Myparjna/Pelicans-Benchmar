"""1118-1745 同步动图重编码后的活跃交接文档（增量替换，历史归档不改）。"""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REPL = {
    "AGENTS.md": [
        (
            "- 静态缩略图：前 6 张 `loading=\"eager\" fetchpriority=\"high\"`，其余 `loading=\"lazy\"`；全部 `decoding=\"async\"` 并带 `width/height`。动画 WebP 在卡片 HTML 中直接带 `src`、`loading=\"eager\"`、`fetchpriority=\"low\"`，页面加载后自动加载并循环播放，不再依赖 hover。63 张动画 WebP 合计约 12.1 MB。",
            "- 静态缩略图：前 6 张 `loading=\"eager\" fetchpriority=\"high\"`，其余 `loading=\"lazy\"`；全部 `decoding=\"async\"` 并带 `width/height`。动画 WebP 在卡片 HTML 中直接带 `src`、`loading=\"eager\"`、`fetchpriority=\"low\"`，页面加载后自动加载并循环播放，不再依赖 hover。63 张动画 WebP 统一为 **640×400 / 18 帧 / 83ms（12fps）/ 1.494s 循环 / loop=0**，合计 **6.75 MB**（重编码前 12.12 MB）。`.thumb-anim` 另叠加 `thumb-drift` 10s 往返轻微推镜（CSS 合成层 60fps 插值），让源页面本身无动画的预览也有连续运动；`prefers-reduced-motion` 下自动关闭。hover 放大作用于 `.thumb-wrap` 容器，避免与动画的 `transform` 冲突。",
        ),
        (
            "# 生成缩略图（先改脚本里的 SLUGS 列表）\n\"C:/Users/mypra/.workbuddy/binaries/python/envs/default/Scripts/python.exe\" \"03-TempScr/10月5日-1815-生成展厅缩略图.py\"",
            "# 生成缩略图（先改脚本里的 SLUGS 列表）\n\"C:/Users/mypra/.workbuddy/binaries/python/envs/default/Scripts/python.exe\" \"03-TempScr/10月5日-1815-生成展厅缩略图.py\"\n# 批量重编码全部动画 WebP（输入 02-TempFiles/backup-webp-1118-1720/，输出覆盖 thumbs/）\n\"C:/Users/mypra/.workbuddy/binaries/python/envs/default/Scripts/python.exe\" \"03-TempScr/1118-1720-重编码动图.py\"",
        ),
    ],
    "01-ProjectDoc/readme.md": [
        (
            "- 缩略图：每站点一张 1280×900 静态 PNG + 一张 8 帧动画 WebP（页面加载后自动加载并循环播放）。",
            "- 缩略图：每站点一张静态 PNG（原始 1280×900 系列，未改动）+ 一张动画 WebP；动画统一 **640×400 / 18 帧 / 83ms（12fps）/ 1.494s 循环**，页面加载后自动加载并循环播放，另叠加 CSS 合成层的 10s 往返轻微推镜。63 张动画合计 6.75 MB。",
        ),
        (
            "- 渐进式渲染：卡片按帧分批插入（每批 8 张），视口外卡片跳过布局与绘制，静态缩略图按需加载、动画 WebP 全部自动加载播放；搜索输入带防抖，卡片交互走事件委托。",
            "- 渐进式渲染：卡片按帧分批插入（每批 8 张），视口外卡片跳过布局与绘制（`content-visibility: auto`），静态缩略图按需加载、动画 WebP 全部自动加载播放；搜索输入带防抖，卡片交互走事件委托。动画画面自带帧动画 + CSS 推镜双层运动，后者不增加文件体积。",
        ),
    ],
    "01-ProjectDoc/architecture.md": [
        (
            "├─ thumbs/                 # 126 个缩略图：每个 slug 一份 png（静态）+ 一份 webp（8 帧动画），共 63 组",
            "├─ thumbs/                 # 126 个缩略图：每个 slug 一份 png（静态）+ 一份 webp（640×400 / 18 帧 / 83ms 动画），共 63 组",
        ),
        (
            "| 缩略图生成 | 无头 Chrome 截图 + Pillow 合成动画 WebP | `03-TempScr/10月5日-1815-生成展厅缩略图.py` | `sites/*.html` | `thumbs/*.png|.webp` | 1280×900、8 帧、每帧 260ms | 脚本已生成 63 组，产物人工抽查 |",
            "| 缩略图生成 | 无头 Chrome 截图 + Pillow 合成动画 WebP | `03-TempScr/10月5日-1815-生成展厅缩略图.py` | `sites/*.html` | `thumbs/*.png|.webp` | 静态 PNG 1280×900 系列；动画经 `1118-1720-重编码动图.py` 统一为 640×400 / 18 帧 / 83ms | 脚本已生成 63 组，产物人工抽查 |",
        ),
        (
            "- **缩略图规格**：改 `03-TempScr/10月5日-1815-生成展厅缩略图.py` 的 `SLUGS`、`BUDGETS`（8 个时间点采样）、`duration`；脚本对已存在的图会跳过，重截需先删。",
            "- **缩略图规格**：改 `03-TempScr/10月5日-1815-生成展厅缩略图.py` 的 `SLUGS`、`BUDGETS`（8 个时间点采样）、`duration`；脚本对已存在的图会跳过，重截需先删。批量统一动画规格用 `03-TempScr/1118-1720-重编码动图.py`（按累计变化量重采样 + 插值补帧 + 帧独立化），原始素材备份在 `02-TempFiles/backup-webp-1118-1720/`。",
        ),
    ],
    "01-ProjectDoc/usage.md": [
        (
            "- 图片：`thumbs/` 下每个 slug 两份——`<slug>.png`（1280×900 静态封面）与 `<slug>.webp`（8 帧动画，页面加载后自动加载并循环播放），当前 126 个文件（63 组 png + 63 组 webp）。",
            "- 图片：`thumbs/` 下每个 slug 两份——`<slug>.png`（静态封面，原始尺寸未改动）与 `<slug>.webp`（640×400 / 18 帧 / 83ms 动画，页面加载后自动加载并循环播放，另有 CSS 推镜），当前 126 个文件（63 组 png + 63 组 webp），63 张动画合计 6.75 MB。",
        ),
    ],
}

for rel, pairs in REPL.items():
    p = ROOT / rel
    s = p.read_text(encoding="utf-8")
    for old, new in pairs:
        if old in s:
            s = s.replace(old, new, 1)
            print("OK  ", rel, "->", old[:42].replace("\n", " "))
        elif new in s:
            print("SKIP", rel, "-> 已同步", new[:42].replace("\n", " "))
        else:
            print("MISS", rel, "->", old[:60].replace("\n", " "))
    p.write_text(s, encoding="utf-8", newline="\n")

# deployment.md 追加本轮部署记录
dep = ROOT / "01-ProjectDoc" / "deployment.md"
d = dep.read_text(encoding="utf-8")
line = (
    "\n## 2026-11-18 17:42 动图重编码部署记录\n\n"
    "- 部署专属域 `https://315e75b2.peilika.pages.dev`，上传 64 个文件（63 张重编码 WebP + `assets/style.css`），生产域 `https://peilika.pages.dev` 同步生效。\n"
    "- 63 张动画统一 640×400 / 18 帧 / 83ms，体积 12.12 MB → 6.75 MB；CSS `thumb-drift` 推镜层上线。\n"
    "- 线上核验：专属域与生产域首页 / style.css / 新 WebP 均 200 且 content-type 正确，线上 WebP 实测 640×400 / 18 帧 / 83ms / 1.49s；真实浏览器 51 张动图全部加载、CSS 动画运行中、动感采样连续、console 与请求失败 0。\n"
    "- 报告见 `01-ProjectDoc/1118-1735-动图重编码与卡顿修复报告.md`，证据 JSON 见 `1118-1738-动图优化验收-本地.json` / `-线上.json`。\n"
)
if "17:42 动图重编码部署记录" not in d:
    dep.write_text(d.rstrip("\n") + "\n" + line, encoding="utf-8", newline="\n")
    print("OK   01-ProjectDoc/deployment.md 追加部署记录")
else:
    print("SKIP 01-ProjectDoc/deployment.md 已含本轮记录")
