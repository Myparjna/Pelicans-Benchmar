---
document: operations.md
generated: 2026-10-06 00:46
client_level: developer
---

# 日常维护

## 监控与日志

项目无自建监控、无后端日志。可观测入口只有：

| 想看什么 | 入口 |
|---|---|
| 部署历史与状态 | Cloudflare Dashboard → Workers & Pages → `peilika` → Deployments（每次部署有 ID 与专属预览域名） |
| 访问量/带宽 | 同一项目页 → Analytics（Pages 自带） |
| 运行时报错 | 无（无 Sentry/日志采集）。前端错误需本机 Chrome DevTools 复现，或用 `03-TempScr/` 里的 CDP 脚本跑一遍 |
| 部署命令输出/失败原因 | 本机 `~/.wrangler/logs/wrangler-*.log`（wrangler 会提示日志路径） |
| 账单/配额 | Cloudflare Dashboard → 账户 Billing |

## 依赖更新

无运行时依赖（无 package.json / requirements.txt），因此没有 `npm audit` / `pip-audit` 的常规动作。需注意的三处：

- **Tabler Icons Webfont（CDN，`@latest`）**：用了不固定版本，上游更新可能改图标外观。要锁版本就把 `index.html` 的 CDN 链接改成固定版本号，或下载到 `assets/` 自托管。
- **wrangler**：全局 npm 安装，CLI 会提示新版本（如 4.147.0）。升级前先看当前部署是否刚成功；本项目用 4.107.0 验证通过。**不要为了升级而升级**。
- **Chrome**：缩略图脚本依赖系统 Chrome 无头模式。系统 Chrome 大版本更新后，重跑一次缩略图脚本抽查产物尺寸是否为 1280×900。

## 例行检查清单

每月（或每次大改后）：

1. 卡片数是否与数据一致：线上 `curl -s https://peilika.pages.dev/sites-data.js | grep -c '"slug"'` 应为 45，首页计数文案同步。
2. 缩略图完整性：抽查若干 `thumbs/<slug>.png` 与 `.webp` 的 `content-type` 为 `image/png` / `image/webp`（状态码 200 不可信，见 known-issues.md）。
3. 评分基线：确认 `assets/app.js` 的 `DEFAULT_RATINGS` 是最新导出版（最近一次基线文件在桌面：`C:/Users/mypra/Desktop/peilika-ratings-2026-10-05.json`）。
4. 死链/缺失：核对 `sites-data.js` 每条的 `src`/`thumb` 文件真实存在（可用 `03-TempScr/10月5日-2335-本次改动冒烟.js` 的思路跑一遍）。
5. 证书：Cloudflare 自动管理，无需检查有效期。
6. 仓库：确认改动已 `git commit`（当前无 remote，不会自动备份到远端）。

## 回滚

Cloudflare Pages 无 CLI 回滚命令使用记录；用控制台回退：

1. Cloudflare Dashboard → Workers & Pages → `peilika` → Deployments
2. 找到上一个正常版本 → 右侧菜单 → **Rollback to this deployment**

替代方案（等价且更快，本机有仓库时）：`git checkout <上一个 commit>` 后重跑 `bash OpsDev/deploy-pages.sh`（最近一次提交见 known-issues.md 的变更记录）。

## 常见故障处置

| 症状 | 可能原因 | 处置步骤 |
|---|---|---|
| 线上动图/缩略图裂开 | `thumbs/` 下文件未部署或本身损坏 | `curl -s -o /dev/null -w "%{content_type}" -L https://peilika.pages.dev/thumbs/<slug>.webp`；非 `image/webp` 说明文件没传上去 → 确认 `OpsDev/deploy-pages.sh` 里 `*.webp` 复制行存在 → 重新部署 |
| 改了 js/css 线上没变 | Pages 边缘缓存 / 浏览器缓存 | 用部署专属域名 `https://<deployment-id>.peilika.pages.dev/assets/app.js` 验证；用户侧 Ctrl+F5 |
| `wrangler pages deploy` 报 `fetch failed` | 本机网络瞬断 | 直接重试 `bash OpsDev/deploy-pages.sh`（历史多次重试即成功，不是配置问题） |
| `wrangler: command not found` | PATH 未包含全局 npm | 部署脚本第 21 行已处理；手动执行时先 `export PATH="/c/Users/mypra/AppData/Roaming/npm:$PATH"` |
| 本地页面 0 张卡片 | 静态服务已挂（临时 server 随终端退出） | `curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8137/index.html`；非 200 就重启服务，端口被占用换一个 |
| 卡片数对不上/少了条目 | `sites-data.js` 被改坏或某条 `src`/`thumb` 文件缺失 | `node --check sites-data.js`；核对缺失文件；从 `02-TempFiles/sites-data.backup*.js` 或 git 恢复 |
| 查看器翻页顺序不对 | 数据数组顺序变了 | 翻页与展示共用数组顺序，改 `sites-data.js` 即可（不是文件时间） |

## 密钥失效处理

本项目无 API 密钥（见 environment.md）。唯一凭据是 wrangler OAuth 登录态：

- **现象**：部署时报未授权 / 找不到项目。
- **重新生成**：`npx wrangler login`，浏览器用 Cloudflare 账号重新授权。
- **更新到哪**：凭据写在本机 `~/.wrangler/`，不在仓库、不在 CI，无需同步到任何环境变量或 secret。
- 不要改用 Cloudflare API Token：历史 `cfut_...` Token 已验证失效。
