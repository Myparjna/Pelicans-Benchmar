---
document: usage.md
generated: 2026-10-06 00:46
client_level: developer
---

# 项目使用说明

## 适用角色与入口

| 角色 | 入口 | 前置条件 | 能做什么 |
|---|---|---|---|
| 访客/评测者 | `https://peilika.pages.dev` 或本地 `http://127.0.0.1:8137/index.html` | 现代浏览器 | 浏览卡片、筛选搜索、打开查看器看原页面、打分（存本地浏览器） |
| 维护者（开发者） | 项目目录 + git bash + 系统 Chrome | wrangler 已 OAuth 登录、本机有 Chrome | 增删条目、重生成缩略图、本地验证、部署上线 |

无登录鉴权、无角色权限系统：所有访客看到同一份静态内容，打分只写各自浏览器的 `localStorage`，互不影响。

## 核心使用流程

### 流程 1：浏览并打开某个模型的页面

- 前置：展厅已加载（`sites-data.js` 45 条数据）。
- 操作：滚动查看分类分组 → 点分类 chip 可只看该分类 → 点卡片打开查看器。
- 输入：鼠标点击 / 键盘 `Enter`（卡片可聚焦）。
- 预期输出：查看器全屏 iframe 加载 `sites/<slug>.html` 的真实页面，顶部显示序号 `n / 45`、模型名、分类、参数、截止与评分控件。
- 失败表现：卡片区域空白 → 多为 `sites-data.js` 语法错误或 `sites/` 缺失文件（本地先 `node --check sites-data.js`）。

### 流程 2：打分并导出基准分

- 操作：卡片底部星星点 1-10 分；或打开查看器在顶部打分 → 关闭后卡片分数同步更新。
- 预期输出：写入 `localStorage` 键 `peilika_ratings_v1`；点顶部「按评分排序」生成榜单（高分在前、未评分在后，卡片带 `No.n` 徽标）；点导出按钮下载 JSON（格式见「数据与文件」）。
- 失败表现：分数不同步 → 检查是否在同一浏览器/同一 origin（本地 `127.0.0.1:8137` 与线上 `peilika.pages.dev` 数据不互通）。

### 流程 3：新增一个模型条目（维护者）

- 操作顺序：原 HTML 拷入项目根（保留原名、不动内容）→ `cp 原文件 sites/<ascii-slug>.html` → `sites-data.js` 增加条目（字段见 architecture.md）→ 用 `03-TempScr/10月5日-1815-生成展厅缩略图.py` 生成 `thumbs/<slug>.png` 与 `.webp` → 本地起服务验证 → `bash OpsDev/deploy-pages.sh`。
- 预期输出：展厅出现新卡片、缩略图可见、查看器能打开。
- 失败表现：缩略图裂图 → 确认 `thumbs/` 下 png 与 webp 都存在且内容类型为 `image/png` / `image/webp`（Cloudflare 对缺失文件会返回 200 的 HTML，状态码不可信，见 known-issues.md）。

### 流程 4：下架/替换条目

- 下架：从 `sites-data.js` 删除该条，删除 `sites/<slug>.html` 与 `thumbs/<slug>.{png,webp}`（建议先移入 `Trash/`），改首页计数文案，部署验证。
- 替换：新源拷入根目录 → `cp` 覆盖 `sites/<slug>.html` → 改数据里的 `file` 字段 → 重跑缩略图脚本（已存在会跳过，需先删旧图）→ 部署。
- 硬约束：**根目录原始 HTML 禁止修改**，只改 `sites/` 下的副本。

## 启动与停止

| 环境 | 启动 | 访问 | 停止 |
|---|---|---|---|
| 本地 | `python -m http.server 8137 --bind 127.0.0.1`（项目根目录） | `http://127.0.0.1:8137/index.html` | 关闭终端 / 结束 python 进程 |
| 生产 | `bash OpsDev/deploy-pages.sh` | `https://peilika.pages.dev` | 无（静态托管，回滚见 operations.md） |

- 默认端口惯用 8137（也被其他项目用过 8765、4173）；**启动前先 curl 探活**，被占用就换端口。
- 健康检查：`curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8137/index.html` 应为 200；线上抽查 `curl -sI https://peilika.pages.dev/thumbs/<slug>.webp` 的 `content-type` 应为 `image/webp`。
- 注意：用 `python -m http.server` 起的临时服务会随终端退出而挂掉，跑校验脚本前先探活。

## 数据与文件

- 输入数据：各模型产出的单页 HTML（根目录原始文件 + `sites/` ASCII 命名副本，`sites/` 当前 45 个）。
- 元数据：`sites-data.js`（`window.SITES`，45 条；字段 `file/slug/category/model/channel/thumb/src/params/cutoff/released`）。
- 图片：`thumbs/` 下每个 slug 两份——`<slug>.png`（1280×900 静态封面）与 `<slug>.webp`（8 帧动画，hover 播放），当前 90 个文件。
- 评分导出：浏览器导出 JSON，形如 `{ schema, count, totalSites, exportedAt, ratings: { slug: score } }`；最近一次基线导出为 `C:/Users/mypra/Desktop/peilika-ratings-2026-10-05.json`（已回填为 `assets/app.js` 的 `DEFAULT_RATINGS`）。
- 原始文件保留：根目录中文名原始 HTML 与 `Trash/` 下架备份长期保留，勿清理。

## 权限与安全边界

- 全站无鉴权、无后端接口，任何人可查看（线上为公开 Pages 站点）。
- 部署权依赖本机 wrangler OAuth 登录态：**不要在公开环境执行部署脚本以外的写操作**。
- 禁止在 `sites/` 副本里修 bug 后不回写记录：副本会被重新 `cp` 覆盖（历史上 opus5 补丁因此丢失，见 known-issues.md）。
- 生产环境不可执行：直接改线上文件（Pages 无此能力）、批量删除 `thumbs/` 后不部署。

## 常见使用问题

- **改了代码线上没生效**：Pages 对 `/assets/*.js|css` 有边缘缓存，强刷 Ctrl+F5，或用本次部署专属域名 `https://<deployment-id>.peilika.pages.dev` 验证。
- **查看器翻页顺序不对**：翻页顺序 = `sites-data.js` 数组顺序（即展厅展示顺序），调整顺序改数组即可，不是文件上传时间。
- **默认分数看起来不对**：本地 `localStorage` 会覆盖默认分，验证默认分前先清空存储。
