# AGENTS.md — 鹈鹕自行车测试展厅（peilika）

给后续接手这个仓库的 AI / 人看的**操作守则**。改动前先读这份，再读 `01-ProjectDoc/`。

线上：<https://peilika.pages.dev>　源码：<https://github.com/Myparjna/Pelicans-Benchmar>（默认分支 `main`，remote `origin`）

---

## 0. 最重要的一条：这是展厅，不是生成器

**禁止自行编写 / 重写 / 「优化」被展示的页面 HTML。**

这个仓库里 `models/`、`models/3d/`、`sites/` 下的每一个 HTML 都是**某个大模型自己生成的产出**，本项目的职责只有四件事：

1. 收录（把原件归档到 `models/`，副本放 `sites/`）
2. 生成缩略图（`thumbs/*.png` + `*.webp`）
3. 在 `sites-data.js` 里登记条目
4. 部署 + 校验

**不要**做这些：
- ❌ 不要自己写一个「鹈鹕骑自行车」页面塞进去（哪怕是 3D / 体素版）
- ❌ 不要修改原件内容来「提速」「修 bug」「美化」——页面长什么样是评测结果本身
- ❌ 不要为了凑数生成占位页

要加新条目 → 用户给 HTML 文件 → 走下面的 SOP。没有用户给的文件就不要动手。

---

## 1. 目录结构

```
index.html            展厅首页（计数文案「51 个模型/版本生成效果对比」+「更新至 YYYY-MM-DD」需手工维护）
sites-data.js         唯一数据源：window.SITES（51 条 2D）+ window.SITES_3D（12 条 3D），合计 63 个 slug
assets/app.js         展厅逻辑（筛选/搜索/打分/查看器/2D-3D 切换）
assets/style.css      样式（浅色主题）
sites/                部署用的页面副本（63 个 = 51 + 12），命名 <slug>.html
thumbs/               缩略图 <slug>.png + <slug>.webp
models/               模型原件归档（2D，按 slug 命名），不参与部署
models/3d/            体素版本原件，不参与部署
01-ProjectDoc/        交接文档集（readme / usage / architecture / deployment / operations / regression-test / known-issues / ai-services）
02-TempFiles/         临时产物、截图、备份（已 gitignore）
03-TempScr/           一次性脚本（缩略图生成、CDP 校验），命名带日期
04-OpsDev/            deploy-pages.sh（Cloudflare Pages 部署）
99-Trash/             废弃文件（已 gitignore）
```

`.gitignore` 已排除 `02-TempFiles/`、`99-Trash/`、`.wrangler/`、`.workbuddy/`、`node_modules/`、`dist/`、`*.zip`。**不要把调试缓存、Chrome profile 提交进仓库。**

---

## 2. 新增 / 替换条目 SOP

以「用户给了 `C:/某路径/xxx.html`，要求归档为某模型」为例：

1. **归档原件** → 复制到 `models/<slug>.html`（3D 走 `models/3d/`）。slug 必须 ASCII 小写、连字符分隔，例如 `kimi-k3-1-pro`、`gpt-6-1-terra`。**不允许**中文名/带日期的原始文件名留在根目录。
2. **生成展厅副本** → 复制到 `sites/<slug>.html`（内容与原模型文件一致，`src` 指向这里）。
3. **登记数据** → 在 `sites-data.js` 对应数组里加/改一条，字段：`file`（指向 `models/...`）、`slug`、`model`、`category`、以及 2D 条目的规格字段。`category` 必须是已有分类名之一，否则会新开一个分类 section。
4. **生成缩略图** → 改 `03-TempScr/10月5日-1815-生成展厅缩略图.py` 的 `SLUGS` 列表，跑一次。
5. **同步首页文案** → `index.html` 里「N 个模型/版本」计数 + 「更新至 YYYY-MM-DD」日期 + `<title>` 与 meta description 的计数。**这一步最容易漏，每次增删条目都要改。**（曾因漏改被返工）
   - 若同时改了提示词，按 §3 的说明同步 `MODE_META` 与 `index.html` 四处静态文案。
6. **校验** → 见第 4 节。
7. **部署** → `bash 04-OpsDev/deploy-pages.sh`，然后用**部署专属域** `<id>.peilika.pages.dev` 验证（生产域有边缘缓存，会看到旧版）。
8. **提交推送** → `git add -A && git commit -m "..."` && `git push`。

### 分类与排序

分类展示顺序与「成对并列」由 `assets/app.js` 的 `CATEGORY_BANDS` 常量控制，格式：

```js
const CATEGORY_BANDS = [
  ['智谱 · GLM', '腾讯 · 混元'],
  ['月之暗面 · Kimi', 'Grok'],
  ['字节 · 豆包', '阶跃星辰 · Step'],
];
```

被配对的分类合并进同一行网格（`.band-group`），标题各在自己卡片上方。要改分组就改这个常量，不要动渲染函数。

### 评分

- 默认基线在 `assets/app.js` 的 `DEFAULT_RATINGS`（2D 51 条，其中 `hy4`=10 分、`hy4-preview`=8 分、`gemini-4-hydrogen`=10 分；3D 暂未设基线）。
- 用户打分存 `localStorage` 键 `peilika_ratings_v1`。
- ⚠️ `loadRatings()` 是 `Object.assign({}, DEFAULT_RATINGS, localStorage)`，**本机旧值会盖掉新基线**。改了 `DEFAULT_RATINGS` 后本机看不到变化是正常的，用无痕窗口或清该键验证。

---

## 3. 2D / 3D 两套数据集与渲染约定

- `window.SITES`（51 条，平面动画版）与 `window.SITES_3D`（12 条，体素场景版）是**两个独立数组**，slug 分别以普通名称和 `3d-` 前缀区分。
- 顶部「2D / 3D」按钮（`.mode-switch` / `.mode-btn[data-mode]`）切换时，卡片、缩略图、分类、提示词文案、查看器与计数全部同步切换（`applyMode()`）。
- 3D 提示词原文：**「使用体素建模。生成一个鹈鹕白天骑自行车的网页场景，要求兼容手机竖屏与电脑横屏显示。而且每过5秒进行晴天-阴天-雨天-晴天的天气自动切换。不使用任何skills。给我html」**
- 2D 提示词原文（2026-11-13 更新）：**「生成一个鹈鹕白天骑自行车的网页动画，单个html文件给我，要求能自适应网页宽度，兼容手机竖屏与电脑横屏显示。每过5秒进行晴天-阴天-雨天-晴天的天气自动切换。不使用任何skills。也不派任何subagent进行codereviwer。单个文件+时间命名好给我。告诉我绝对路径。」**
- 两套文案写在 `assets/app.js` 的 `MODE_META` 里，不要硬编码进 `index.html`。`index.html` 里另有 `promptLine`、`promptTip1`、`promptTip2`、`viewerPromptText` 四处静态文案，改提示词时**四处 + MODE_META 一起改**，否则首屏会闪旧文案或查看器不跟随切换。

### 渐进式渲染与性能约定

- `renderGallery()` 先铺「分类标题 + 空网格」骨架，卡片 HTML 字符串与 DOM 插入都按 `requestAnimationFrame` 每帧 8 张进行（`RENDER_BATCH`）；`renderToken` 代次取消旧批次，快速筛选/切换时不会串插。
- 卡片交互走 `root` 上的事件委托（click / keydown / pointerover），新插入的卡片无需逐个绑定监听器。评分交互仍按批次对新卡片调用 `bindRatings(card)`。
- 静态缩略图：前 6 张 `loading="eager" fetchpriority="high"`，其余 `loading="lazy"`；全部 `decoding="async"` 并带 `width/height`。动画 WebP 在卡片 HTML 中直接带 `src`、`loading="eager"`、`fetchpriority="low"`，页面加载后自动加载并循环播放，不再依赖 hover。63 张动画 WebP 统一 **640×400 / 130ms / loop=0**，帧数按素材自适应 **7~36 帧**（长序列取前段连续帧，相邻帧按像素差自适应补帧，单帧跳变受 `MAX_STEP=2.5` 约束），合计 **7.39 MB**（原始 12.12 MB）。`.thumb-anim` 叠加 `thumb-drift` **14s** 往返极轻微推镜（`scale 1→1.012`，CSS 合成层 60fps 插值），让源页面本身无动画的预览也有连续运动；`prefers-reduced-motion` 下自动关闭。hover 放大作用于 `.thumb-wrap` 容器，避免与动画的 `transform` 冲突。评分预置表 `DEFAULT_RATINGS` 含 `gpt-6-2-astra: 10`；用户在 localStorage 手动改过/清过的分数优先。
- `.site-card` 用 `content-visibility: auto` + `contain-intrinsic-size: auto 340px` 跳过视口外绘制。
- 搜索输入 120ms 防抖；分类 chip 点击只切换 `active`，不重建 chip DOM；`<head>` 对 jsDelivr 有 `preconnect`。
- 排序与导出入口已于 2026-11-13 下线，`sortByRating` / `exportRatings()` / `rank-badge` 相关代码与样式已清理，不要重新引入。

---

## 4. 常用命令

一切命令在项目根目录执行：
`cd "C:/Users/mypra/Desktop/VibeCoding指南/skills测评项目/03-鹈鹕自行车测试"`

```bash
# 本地起服务（8137 惯用端口）
"C:/Users/mypra/.workbuddy/binaries/python/envs/default/Scripts/python.exe" -m http.server 8137 --bind 127.0.0.1

# 语法检查
"C:/Users/mypra/.workbuddy/binaries/node/versions/22.22.2-6/node.exe" --check assets/app.js

# 数据完整性（两套数据集条目数 + 缺失文件）
"C:/Users/mypra/.workbuddy/binaries/node/versions/22.22.2-6/node.exe" -e "
global.window={}; const fs=require('fs');
eval(fs.readFileSync('sites-data.js','utf8'));
for (const key of ['SITES','SITES_3D']) {
  const s = window[key] || [];
  const miss = s.filter(x => !fs.existsSync(x.src) || !fs.existsSync(x.thumb));
  console.log(key, s.length, 'missing=' + miss.length, miss.map(m=>m.slug).join(','));
}
"

# 生成缩略图（先改脚本里的 SLUGS 列表）
"C:/Users/mypra/.workbuddy/binaries/python/envs/default/Scripts/python.exe" "03-TempScr/10月5日-1815-生成展厅缩略图.py"
# 批量温和重编码全部动画 WebP（当前采用：自适应补帧限制单帧突变）
"C:/Users/mypra/.workbuddy/binaries/python/envs/default/Scripts/python.exe" "03-TempScr/1119-1410-平滑重编码动图.py"
# 历史版本（按变化量重采样，已弃用，会放大帧间跳变）：03-TempScr/1118-1720-重编码动图.py

# 部署 Cloudflare Pages
bash 04-OpsDev/deploy-pages.sh
```

### 部署与校验要点

- 生产域 `peilika.pages.dev` 有边缘缓存 → **验证必须用部署专属域** `https://<deployment-id>.peilika.pages.dev`。
- ⚠️ **Cloudflare Pages 对缺失文件也返回 200**（SPA fallback），所以校验图片必须看 `content-type` 是不是 `image/png` / `image/webp`，**不能只看状态码**。
- `sites/*.html` 不带 `-L` 时返回 308 是 clean URL 规范化，属正常。
- `wrangler pages deploy` 偶发 `fetch failed` 多为网络瞬断，直接重跑即可。

### CDP 校验

一次性 CDP 脚本放 `03-TempScr/`，用系统 Chrome 起带 `--remote-debugging-port=9303`（或 9304/9305/9306/9307，其中 9307 为 2026-11-04 与 2026-11-13 两次收录校验所用端口）；每个实例按端口配独立 `userDataDir`，同端口的后续任务可复用该目录。脚本通过 WebSocket `Runtime.evaluate` 读 DOM。
注意卡片缩略图是懒加载：**必须先 `scrollIntoView` 再判断 `img.complete && naturalWidth > 0`**，否则会误报「未加载」。
使用 Node 22 原生 `WebSocket` 时，事件监听走 `addEventListener`（无 `.on` 方法），不要沿用 `ws` 包的 `ws.on('message', ...)` 写法；此经验来自 2026-11-04 的 `03-TempScr/1104-1409-hy4正式版收录校验.js`。
查看器当前页要读 `.viewer-frame-doc.is-current`（三帧轮转中的当前帧），不要直接取 `#viewerIframe`；翻页按钮 ID 为 `#btnNext` / `#btnPrev`。此经验来自 2026-11-13 的 `03-TempScr/1113-2128-查看器真实点击补测.js`（真实鼠标点击验证）。

---

## 5. Git / GitHub

- remote：`origin` → `https://github.com/Myparjna/Pelicans-Benchmar`
- 凭据已配：`credential.helper=!gh auth git-credential`（`gh` 登录账号 `Myparjna`），可直接 `git push`。
- ⚠️ 本仓库 `user.email` 必须是 `48089881+Myparjna@users.noreply.github.com`。用 `905443848@qq.com` 提交会被 GitHub 隐私策略 GH007 拒收（历史提交已用 `git filter-branch` 改正过）。
- 旧历史保留在 `backup-2026-08-15` 分支。

---

## 6. 交付前的自检清单

- [ ] 没有自己写过任何被展示的页面 HTML（只做收录 / 缩略图 / 数据 / 部署）
- [ ] 原件已进 `models/`（或 `models/3d/`）并按 slug 命名，根目录没有散落的中文名 HTML
- [ ] `sites-data.js` 条目数正确，`file` 字段指向 `models/...`
- [ ] `index.html` 的**计数**和**更新至日期**已同步
- [ ] 缩略图 png + webp 都已生成
- [ ] `node --check assets/app.js` 通过，本地首页无裂图
- [ ] 部署后用专属域验证过 `content-type`
- [ ] 交接文档（`01-ProjectDoc/`）里的计数与结构描述同步更新
- [ ] 本文件（`AGENTS.md`）里的数据集/副本计数与 `DEFAULT_RATINGS` 说明同步更新
- [ ] 改提示词时，`MODE_META` 与 `index.html` 四处静态文案一起改
- [ ] CDP 验收覆盖渐进式渲染、2D/3D 提示词同步、查看器、打分与移动端视口
- [ ] 已 commit + push

---

## 7. 沟通约定（来自项目 Owner）

- 中文沟通，结论先行，喜欢表格 + 简短汇报。
- 增删条目时**主动核对计数 + 日期 + 排序**，不要等用户指出。
- 用户给的 HTML 文件视为评测原件，**原样收录**，不改内容。
- 涉及删除/重命名等破坏性操作，先只读扫描列出清单，确认后再执行。

### 2026-11-18 UI 约定补充

- 右上角 GitHub 图标为 `.header-actions` 的最后一个 flex 成员（`flex: none`，40×40），与 40px 高的搜索框同高、顶底齐平，并位于控件组最右端；不再使用绝对定位，`.header-actions` 不再保留 `padding-right` 预留位。响应式断点下搜索框 `flex: 1; min-width: 0` 可收缩，窄屏不产生横向溢出。
- 动画 WebP 默认 `display: block` 覆盖在静态 PNG 之上；静态 PNG 保留作加载失败时的回退。`.site-card:hover .thumb-anim` 与 `.site-card:hover .thumb-static` 两条门控已移除，hover 只保留轻微放大。
- 2D 新增字段 `thinking`、`env` 为可选元数据（当前仅 `gpt-6-2-astra` 登记），界面不渲染，改动渲染逻辑时勿误删。
