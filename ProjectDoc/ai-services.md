---
document: ai-services.md
generated: 2026-10-06 00:46
client_level: developer
---

# AI 服务

> 本文档由扫描器因「源码中出现模型名」而生成。需要先说明：**本项目自身不调用任何 AI API、不使用任何 AI SDK**。源码里出现的模型名（如 `claude-opus-5-5-zcode`、`deepseek-v4-1-flash`、`qwen-3-8-max`、`glm-5-3-wb` 等）全部是**被评测对象的标识**（目录名、slug、分类名），不是调用参数。

## 使用的 SDK

未检测到 AI SDK。项目无 package.json，运行期零依赖，没有任何 `openai`/`anthropic`/`@google/generative-ai` 之类的调用。

## API 端点

未检测到直连端点。展厅是纯静态站点，没有任何后端接口或 XHR/fetch 调用 AI 服务。

## 模型

源码中出现的模型名按用途分为两类：

| 类别 | 例子 | 用途 | 能否替换 |
|---|---|---|---|
| 展厅分类名（`sites-data.js` 的 `category`） | `GPT`、`A/Claude`、`DeepSeek`、`阿里 · 通义千问`、`智谱 · GLM`、`腾讯 · 混元`、`月之暗面 · Kimi`、`Grok`、`字节 · 豆包`、`阶跃星辰 · Step`、`MiniMax`、`小米 · MiMo`、`Gemini`、`Space Bunny` | 卡片分组与筛选 chip | 直接在 `sites-data.js` 改；分组并列在 `assets/app.js` 的 `CATEGORY_BANDS` |
| 站点标识（`slug` / `model` / `file`） | `gpt-6`、`claude-opus-5-5-zcode`、`deepseek-v4-1-flash`、`mimo-v2-6-pro`、`minimax-m3-1`、`kimi-k3-wb`、`hy4-preview`、`seed-2-1-pro-0915` 等 45 个 | 卡片标题、缩略图与 iframe 路径命名 | 换条目即换 slug（须为 ASCII，`src` 指向 `sites/<slug>.html`） |

元数据（参数规模 `params`、知识截止 `cutoff`、发布时间 `released`）来自联网检索（豆包搜索 + DataLearner 页面抓取），闭源模型查不到时填「未公开」，不臆造数字。

## 计费与限额

不适用：项目不调用 AI API，无 token 消耗、无限流、无余额告警。

被评测的 45 个模型各自在哪些平台/账号下生成、产生了多少费用，本项目不掌握 —— [需向交接人确认: 这些模型产出是在哪些账号/平台生成的，是否有费用需要跟踪]

## 降级与故障

不适用：无 AI 调用，无重试/超时/降级逻辑。AI 服务不可用不会影响展厅运行（展厅只托管静态 HTML 与图片）。

唯一外部依赖是 jsdelivr 的 Tabler 图标字体：加载失败时图标显示为空白方块，页面功能不受影响；需要彻底离线化就把字体下载到 `assets/` 并改 `index.html` 的 `<link>`。
