# 鹈鹕自行车测试 · 模型生成网页展厅 — 项目交接文档

> 维护人：WorkBuddy ｜ 最后更新：2026-08-13

---

## 1. 项目背景与目标

把 24 个国内外 AI 模型/平台生成的「鹈鹕自行车」主题网页集中到一个可对比的展厅里：

- 每张卡片有缩略图封面、渠道/厂商标签、1-10 分评分。
- 可分类筛选、搜索，点开后用 iframe 全屏看真实效果（上一/下一个、键盘方向键、Esc 关闭）。
- 顶部「按评分排序」一键生成榜单。
- 响应式适配 PC / 手机，浅色主题。
- 已部署到 Cloudflare Pages：**https://peilika.pages.dev**

**硬约束**：原始 HTML 文件（根目录下中文名/混合名文件）**禁止修改**，仅用作对比源。展厅实际展示的是 `sites/` 下的 ASCII 命名干净副本。

---

## 2. 技术栈

| 项 | 说明 |
|---|---|
| 前端 | 纯静态 HTML + CSS + 原生 JS，无框架、无打包构建 |
| 缩略图 | `puppeteer-core` + 系统 Chrome（`C:\Program Files\Google\Chrome\Application\chrome.exe`）无头截图 |
| 持久化 | 浏览器 `localStorage`（评分） |
| 部署 | Cloudflare Pages + `wrangler`（OAuth 登录态，账号 `905443848@qq.com`） |
| 图标 | Tabler Icons Webfont（`@tabler/icons-webfont`） |

---

## 3. 目录结构

```
鹈鹕自行车测试/
├─ index.html              # 页面骨架：header(搜索框+排序按钮+品牌图标)、filter-bar、galleryRoot、viewer 弹窗
├─ sites-data.js           # 24 条元数据：file / slug / category / model / channel / thumb / src
├─ favicon.webp            # 网站 favicon 与左上角品牌图标（同一张）
├─ assets/
│  ├─ style.css            # 浅色主题 + 响应式样式
│  └─ app.js               # 画廊渲染、分类/搜索、评分、排序、iframe 查看器
├─ sites/                  # 24 个 ASCII 命名干净副本（部署用，不含原中文名）
├─ thumbs/                 # 24 张缩略图 PNG（封面）
├─ ProjectDoc/             # 本项目交接文档
├─ OpsDev/
│  └─ deploy-pages.sh      # 构建 dist 并 wrangler 部署脚本
├─ TempScr/                # 临时脚本：截图(screenshot.mjs / shot-one.mjs)、构建副本(build-sites-copies.mjs)、各种验证脚本
├─ TempFiles/              # 临时生成物（含 dist/ 部署包、验证截图）
└─ Trash/                  # 被替换/移除的旧文件备份（可恢复，勿误删）
```

> 注意：`.gitignore` 已忽略 `TempScr/`、`TempFiles/`、`*.zip`、`.workbuddy/`，所以临时脚本/生成物不会进仓库。

---

## 4. 关键文件说明

- **`sites-data.js`**：唯一数据源。`slug` 必须是 ASCII（部署路径用），`src` 指向 `sites/<slug>.html`，`thumb` 指向 `thumbs/<slug>.png`。新增/替换条目都从这里改。
- **`assets/app.js`**：
  - `CHANNEL_CLASS`：渠道名 → 徽标配色 class（如 `官网风格→ch-blue`、`中转API→ch-cyan`）。
  - 评分：`RATINGS_KEY='peilika_ratings_v1'`，`DEFAULT_RATINGS` 预置基线，`loadRatings()` 用 `Object.assign({}, DEFAULT_RATINGS, base)` 合并（本地手动分优先），`saveRating()` 清除时记 `0`（不被默认分覆盖）。
  - 排序：`sortByRating` 开启后全站倒序榜单，卡片带 `No.1` 排名徽标。
  - 查看器：`openViewer(slug)`、`loadCurrent()`、`prev()`/`next()`，iframe 加载 `s.src`。
- **`assets/style.css`**：`.site-grid`（grid auto-fill）、`.filter-chip`、`.channel-badge`（含 `ch-*` 颜色变体）、`.rating`/`.rating-btn`、`.rank-badge`、`.viewer`、移动端断点 720px。

---

## 5. 评分机制

- 范围 1-10 分，按钮位于每张卡片底部 + 查看器顶部，写入 `localStorage`（键 `peilika_ratings_v1`）。
- **预置默认分（代码基线，见 `app.js` 的 `DEFAULT_RATINGS`）**：

  | 模型 | slug | 默认分 |
  |---|---|---|
  | 通义千问 Qwen 3.8 Max | `qwen-3-8-max` | 10 |
  | GPT 5.6 (Codex) | `gpt-5-6-codex` | 9 |
  | DeepSeek API V4 Pro | `deepseek-v4-pro-api-0813` | 9 |
  | Kimi K3 | `kimi-k3-wb` | 9 |
  | Claude Opus 5（中转API） | `opus-5-relay` | 9 |

- 规则：新访客看到默认分；用户本地手动改/清除过以本地为准（清除记 `0`，刷新不回弹默认分）。
- 顶部「按评分排序」：高分在前、未评分在后。

---

## 6. 本地预览与部署

**本地预览**（任选端口，避开占用）：
```bash
cd 鹈鹕自行车测试
python -m http.server 4173 --bind 127.0.0.1
# 浏览器打开 http://127.0.0.1:4173/index.html
```

**构建部署包 + 部署**（也可直接跑 `OpsDev/deploy-pages.sh`）：
```bash
cd 鹈鹕自行车测试
rm -rf TempFiles/dist && mkdir -p TempFiles/dist/assets TempFiles/dist/sites TempFiles/dist/thumbs
cp index.html sites-data.js favicon.webp TempFiles/dist/
cp assets/app.js assets/style.css TempFiles/dist/assets/
cp sites/*.html TempFiles/dist/sites/
cp thumbs/*.png TempFiles/dist/thumbs/
export PATH="/c/Users/mypra/AppData/Roaming/npm:$PATH"
wrangler pages deploy TempFiles/dist --project-name peilika --commit-dirty=true
```

部署完成后会给出预览哈希（如 `https://a1acd402.peilika.pages.dev`），主域名 `peilika.pages.dev` 边缘缓存稍后同步。

**wrangler 登录态**：当前用 OAuth（账号 `905443848@qq.com`）即可部署，无需 API Token。若登录失效：`npx wrangler login`。

---

## 7. 增 / 删 / 改 条目 SOP

> 通用流程，每次改完务必真机验证 + git 提交。

**新增条目**
1. 原始 HTML 拷入项目根（保留原名，不动内容）。
2. `sites-data.js` 增加一条：`slug` 用 ASCII、`category`/`model`/`channel` 填好、`thumb`/`src` 用 `sites/<slug>.png`、`sites/<slug>.html`。
3. `app.js` 的 `CHANNEL_CLASS` 若用到新渠道，补映射；`style.css` 补对应 `.channel-badge.ch-xxx` 颜色。
4. `node TempScr/build-sites-copies.mjs` 生成 `sites/<slug>.html` 副本并刷新 `src` 字段。
5. `node TempScr/shot-one.mjs "<原始文件名>" <slug>` 截 `thumbs/<slug>.png`。
6. 重建 dist → 部署 → 真机验证（卡片数、缩略图 200、iframe 打开）→ commit。

**替换某条目源文件**（如 MiniMax M3 换成官网版）
1. 新源拷入根目录；旧源移入 `Trash/`。
2. `sites-data.js` 改该条 `file` + 必要时 `channel`。
3. 跑 `build-sites-copies.mjs` 覆盖副本 + `shot-one.mjs` 重截缩略图。
4. 重建 dist → 部署 → 验证 → commit。

**删除条目**
1. `sites-data.js` 删除该条。
2. `sites/<slug>.html`、`thumbs/<slug>.png` 移入 `Trash/`（可恢复）。
3. 原始对比文件按「不改动原文件」原则**保留**在根目录。
4. 重建 dist → 部署 → 验证（卡片数 -1）→ commit。

---

## 8. 已知问题 / 坑

- **`qwen3.6flash官网.html` canvas bug**：原文件内 `ctx.quadraticCurve(...)` 拼写错误（应为 `quadraticCurveTo`），导致封面截图全黑。**按用户要求未修改原文件**，仅影响该卡片缩略图，不影响打开查看实际效果。
- **部署前先确认端口未被占用**，被占用就换端口（不要用 `kill` 批量杀 Node/Python）。
- **`encodeURIComponent(s.src)` 会把 `/` 编码成 `%2F`** 导致 404，查看器直接赋值 `s.src` 即可（已在代码中修正）。
- **Cloudflare API Token 不可用**：用户曾提供 `cfut_...` 令牌验证为失效，最终用 OAuth 登录态部署，不要再用该 Token。

---

## 9. 变更流水（2026-08-13）

| Git | 内容 |
|---|---|
| — | 初版展厅：24 卡片、分类、iframe 查看器、响应式；截图缩略图 |
| `2e94489` | 新增 1-10 打分（localStorage）+ 一键按评分排序；部署脚本改 OAuth+dist |
| `1f8691f` | 左上角品牌图标与网站 favicon 改为 favicon.webp |
| `30e10b9` | 排序按钮移到顶部 header；查看器顶部加入评分控件 |
| `73b8d7d` | favicon 更新为新版（faviconnew.webp） |
| `80704a6` | 移除 Grok 4.5(标准)，仅保留真·Grok 4.5（23 卡） |
| `173bfd9` | 查看器移除新窗口打开按钮，加宽上/下/关按钮 |
| `e33ada0` | 标题改为「AI模型鹈鹕自行车测试」，页头改为「更新至 2026-08-13」 |
| `44ef7ac` | 新增 Claude Opus 5（中转API）条目，恢复 24 卡 |
| `07315da` | MiniMax M3 替换为官网风格新源，渠道 WorkBuddy→官网风格 |
| `0f096b2` | 预置 5 个模型默认评分（qwen3.8max=10，其余 4 个=9），本地手动分优先 |
| 本次 | 新增 Gemini 3.7（Poe）、Qwen 3.8 27B（Poe）、GLM 5.3（WorkBuddy）三张卡；Grok 4.5 替换为 Grok 4.6（真·官网）；新增 Poe 渠道徽标 ch-fuchsia；清单 28 卡，重新部署 peilika |

---

## 10. Git 约定

- 分支 `main`；提交人 `workbuddy`，邮箱 `905443848@qq.com`。
- commit message 用中文，写清改动。较大更新主动提交（如本次）。
- 默认本地开发；用户明确要求才推 GitHub（目前未推送）。

## 11. 验收 / 自验证约定（重要）

按使用者要求，完成较大功能后需用 **系统 Chrome + puppeteer-core**（全局 `node_modules`）做真实操作验证，而非只测后端：

- 起本地静态服务 → 用 puppeteer 模拟点击/打分/排序 → 桌面 + 移动端各截图 → 检查 `console` 无报错 → 再部署。
- 典型脚本：`TempScr/verify-*.mjs`（验证评分、排序、favicon、新增/替换条目等），运行方式：
  ```bash
  export PATH="/c/Users/mypra/AppData/Roaming/npm:$PATH"
  export NODE_PATH="/c/Users/mypra/AppData/Roaming/npm/node_modules"
  node TempScr/verify-xxx.mjs https://<预览哈希>.peilika.pages.dev
  ```
- 最多循环 5 次修复验证；仍异常则带截图和日志上报并给方案。
