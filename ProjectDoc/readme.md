---
document: readme.md
generated: 2026-10-06 00:46
client_level: developer
---

# 03-鹈鹕自行车测试 — 项目交接文档

## 待确认问题

- [需向交接人确认: GitHub 仓库 https://github.com/Myparjna/Pelicans-Benchmar 是否仍需同步？当前本地仓库 `git remote -v` 为空，历史提交未推送]
- [需向交接人确认: GitHub 账号归属]
- [需向交接人确认: 45 个模型产出分别是在哪些账号/平台生成的，是否有费用需要跟踪]
- [需向交接人确认: Cloudflare Pages 项目 `peilika` 所在账号归属（当前 wrangler OAuth 登录账号 `905443848@qq.com`），后续是否要转移所有权]
- [需向交接人确认: 新增 5 个模型（Grok 4.7 / DeepSeek V4.1 Flash / 小米 MiMo V2.6 与 Pro / MiniMax M3.1）的 `channel` 字段来源尚未确认，界面已隐藏渠道标签但数据仍保留占位 `—`]
- [需向交接人确认: `Space Bunny` 是否为内部代号（公开检索查无此模型），是否保留该分类]
- [需向交接人确认: 根目录大量中文名原始 HTML（如 `中转API的opus5.html`）是否仍按"禁止修改原件"原则保留]

## 项目简介

一个**纯静态的 AI 模型前端产出对比展厅**：把 45 个国内外大模型/平台生成的「鹈鹕白天骑自行车」主题单页 HTML 收集起来，生成统一缩略图，支持分类筛选、搜索、1-10 分打分与 iframe 全屏原样查看，用于横向评估各模型的网页生成效果。面向做前端设计/模型评测的使用者，已部署在 Cloudflare Pages：**https://peilika.pages.dev**。

## 核心功能

- 分类陈列：14 个分类按指定顺序展示，指定的小分类成对并列（共用一行网格，标题各在自己卡片上方）。
- 缩略图：每站点一张 1280×900 静态 PNG + 一张 8 帧动画 WebP（卡片 hover 时播放）。
- 搜索与筛选：按模型名/分类/源文件名搜索，点击分类 chip 过滤。
- 打分：1-10 分，卡片与查看器内都能打，写入浏览器 `localStorage`；可一键「按评分排序」生成带 `No.1` 徽标的榜单，可导出/导入评分 JSON。
- 查看器：iframe 全屏查看原始页面，上一/下一页（含相邻页预加载）、键盘 ←/→ 翻页、Esc 关闭，红色关闭按钮。
- 响应式：浅色主题，PC 多列、手机单列。

## 技术栈

**框架**: 无（纯静态 HTML + CSS + 原生 JS，无构建、无 npm 依赖）

**UI 组件库**: 无（图标用 Tabler Icons Webfont CDN `@tabler/icons-webfont`）

**包管理器**: 无（仓库内没有 package.json / requirements.txt）

**依赖规模**: Node 0 个 / Python 0 个（仓库运行时零依赖）

**工具链（仅本地维护用）**：
- 缩略图生成：Python + Pillow（托管 venv `C:\Users\mypra\.workbuddy\binaries\python\envs\default`）+ 系统 Chrome 无头截图 `C:\Program Files\Google\Chrome\Application\chrome.exe`
- 部署：`wrangler`（全局 npm 安装，OAuth 登录态）
- 校验脚本：Node 22（托管运行时）+ Chrome DevTools Protocol

## 快速启动

```bash
# 1) 进入项目根目录
cd "C:/Users/mypra/Desktop/VibeCoding指南/skills测评项目/03-鹈鹕自行车测试"

# 2) 起本地静态服务（8137 为本项目惯用端口，被占用就换）
"C:/Users/mypra/.workbuddy/binaries/python/envs/default/Scripts/python.exe" -m http.server 8137 --bind 127.0.0.1

# 3) 浏览器打开
# http://127.0.0.1:8137/index.html
```

无依赖安装步骤；不需要 `.env`（项目不使用环境变量，见 environment.md）。

**可用脚本**: 无 npm scripts。维护脚本集中在 `03-TempScr/`，部署脚本为 `OpsDev/deploy-pages.sh`。

## 速查卡

| 项目 | 值 | 出处/说明 |
|---|---|---|
| 本地访问地址 | `http://127.0.0.1:8137/index.html` | `python -m http.server 8137` |
| 生产访问入口 | `https://peilika.pages.dev` | Cloudflare Pages 项目 `peilika` |
| 启动一行命令 | `python -m http.server 8137 --bind 127.0.0.1` | 项目根目录 |
| 部署一行命令 | `bash OpsDev/deploy-pages.sh` | 需 wrangler OAuth 已登录，详见 deployment.md |
| 回滚一行命令 | Cloudflare Dashboard → Workers & Pages → peilika → Deployments → 选上一版本 Rollback | 无 CLI 回滚记录，详见 operations.md |
| 日志/监控入口 | Cloudflare Dashboard → Workers & Pages → peilika → Deployments/Analytics | 无自建监控，详见 operations.md |
| 数据源 | `sites-data.js`（45 条，`window.SITES`） | 唯一数据源 |
| 评分存储 | `localStorage` 键 `peilika_ratings_v1` | 仅本地，无后端 |

## 文档导航

| 文档 | 内容 |
|---|---|
| [architecture.md](./architecture.md) | 架构、目录、模块职责与调用链 |
| [usage.md](./usage.md) | 使用流程与增删条目 SOP |
| [regression-test.md](./regression-test.md) | 验证范围与已执行记录 |
| [environment.md](./environment.md) | 环境变量（本项目无密钥） |
| [deployment.md](./deployment.md) | Cloudflare Pages 部署与账号清单 |
| [known-issues.md](./known-issues.md) | 已知问题与技术债 |
| [operations.md](./operations.md) | 日常维护、故障与回滚 |
| [ai-services.md](./ai-services.md) | AI 相关内容说明（本项目不调用 AI API） |

> 旧版单文件交接文档已备份在 [legacy/PROJECT_HANDOFF.md](./legacy/PROJECT_HANDOFF.md)，其中 24 卡时代的计数与流程已过时，以本文档集为准。
