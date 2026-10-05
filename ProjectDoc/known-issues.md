---
document: known-issues.md
generated: 2026-10-06 00:46
client_level: developer
---

# 已知问题与技术债

> 这是交接中最有价值的文档。宁可多写，不可隐瞒。

## 已知 Bug

- **Cloudflare Pages 会让缺失文件返回 200**（SPA fallback 行为）→ 缩略图/页面 404 时浏览器拿到 HTML 当图片渲染，表现为「裂图」，而 `curl` 状态码是 200。
  - 影响：曾据此误判部署成功；实际是 `OpsDev/deploy-pages.sh` 只复制了 `*.png`，`*.webp` 从未上传。
  - 绕过：验证一律校验 `content-type`（`image/png` / `image/webp`），不要只看状态码。脚本已补齐 `cp thumbs/*.webp`。
  - 相关文件：`OpsDev/deploy-pages.sh:17-18`。
- **评分在查看器里改了、展厅卡片不更新**（已修）→ 根因是同步函数查询 `.rating`，实际类名是 `.star-rating`，永远查不到；另有一次绑定丢失导致卡片星星刷新后点不动。
  - 影响：表现为「打分没保存」，其实 localStorage 已写入。
  - 已修：统一 `applyRating/saveRating/refreshCardRating` 入口。
  - 相关文件：`assets/app.js`（评分模块）。
- **`wrangler pages deploy` 偶发 `fetch failed`** → 本机网络瞬断，非配置问题。
  - 影响：部署中断，输出里只有 wrangler 的报错提示，容易误判为凭据失效。
  - 绕过：直接重跑 `bash OpsDev/deploy-pages.sh`（历史多次重试即成功）。日志在 `~/.wrangler/logs/wrangler-*.log`。
- **SVG `clip-path` 跟随自身 `transform`**（模型产出页面内的坑，非展厅代码）→ 给滚动组加 `clip-path` 会导致内容整体消失。
  - 绕过：把 `clip` 放到外层无位移的 `<g>` 上。
  - 相关文件：`hy4preview-10月5日-1715-鹈鹕白天骑自行车动画.html`。
- **无头 Chrome 截图会冻结 CSS 过渡**：验证天气切换等过渡态时，截图看到的是过渡中间态（如半透明伞、未变灰的天空），不代表真实浏览器行为。
  - 绕过：生成一份禁用 transition 的副本来截最终态。

## 未完成功能

- **5 个新模型的 `channel` 元数据未确认**：`grok-4-7`、`deepseek-v4-1-flash`、`mimo-v2-6`、`mimo-v2-6-pro`、`minimax-m3-1` 的渠道值暂为 `—`（界面已隐藏渠道标签，数据仍留占位）。`Space Bunny` 公开检索查无此模型，疑似内部代号，分类是否保留待定。
- **模型规格字段有部分「未公开」**：闭源模型的 `params`（参数规模）与 `cutoff`（知识截止）检索不到时填「未公开」，只有能查证的才填实数（如 Hy4 preview 770B/A49B、Step 5 Preview 600B/A27B、DeepSeek V4.1 Flash 552B/A8B）。
- **评分只在本机生效**：无后端，换浏览器/设备看不到评分；跨设备同步目前只能手动导出/导入 JSON。

## 技术债

- **渠道标签代码残留**：界面已移除 `channel-badge` 渲染与查看器徽章，但 `channelClass()`（app.js:43）与 `.channel-badge.ch-*`（style.css 约 340-353 行的十余条配色）仍是无引用死代码，未清理。
- **临时目录重复**：`TempScr/`、`TempFiles/`（早期）与 `03-TempScr/`、`02-TempFiles/`（现行）并存，旧目录里的 `.mjs` 脚本（如 `build-sites-copies.mjs`、`shot-one.mjs`）已不再使用，且旧文档仍在引用它们，容易误导。
- **`02-TempFiles/chrome-profile-*`**：Chrome 调试 user data dir 留在项目内，体积大且被扫描器误判为项目内容（误报 Make/Ninja/Arduino/局域网绑定等线索）。
- **根目录堆积大量中文名原始 HTML** 与 `Trash/`、`3D鹈鹕测试/` 等旁支目录，仓库规模 4800+ 文件，扫描时 665/4843 受限。
- **无自动化测试**：全部依赖人工 + 一次性 CDP 脚本，脚本命名带日期且散在 `03-TempScr/`，没有统一入口（见 regression-test.md）。
- **首页计数文案手工维护**：`index.html` 里的「45 个模型」是 sed 手改的，增删条目时必须同步改，否则与数据不一致。
- **缩略图脚本用绝对路径且改一次动一次**：`03-TempScr/10月5日-1815-生成展厅缩略图.py` 的 `SLUGS` 是硬编码列表，每次新增都要往里塞 slug。

## 安全注意项

- 站点完全公开、无鉴权，任何人可访问全部 45 个模型产出页面（这是设计如此）。
- 仓库与部署包内**无密钥、无 token、无 `.env`**；部署凭据仅在本机 `~/.wrangler/`。
- 各模型产出的页面内引用了第三方 CDN（three.js 等，见 architecture.md 外部资源表），展厅以 iframe 加载它们且**未设 `sandbox` 属性**，被对比页面可执行自身脚本。
- 未做专业安全审计。

## 变更记录（近期）

| Git | 内容 |
|---|---|
| `be2f843` | 替换 Kimi K3 页面为 `kimik3.html`；下架 4 个 DeepSeek (0424) 旧条目 → 45 个；按导出 JSON 更新默认评分基线 |
| `eb4a790` | 网格 `auto-fill` → `auto-fit`（后已被用户否掉并撤回） |
| `95f8605` | 撤回 auto-fit；新增相邻小分类合并成一行（后改为显式配置） |
| `836a0d1` | 合并 band 标题改为随组占位，标题落在自己卡片上方 |
| `e7dad11` | 移除卡片与查看器的渠道标签、搜索中的渠道字眼 |
| `6b67e47` | 按方案 A 重排 14 个分类顺序；并列改为 `CATEGORY_BANDS` 显式配置 |

> 更早历史见 [legacy/PROJECT_HANDOFF.md](./legacy/PROJECT_HANDOFF.md)（24 卡时代记录，计数已过时）。
