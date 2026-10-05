---
document: deployment.md
generated: 2026-10-06 00:46
client_level: developer
---

# 部署指南

## 部署方式

**Cloudflare Pages + wrangler CLI（本机手动部署，无 CI/CD）**。项目 `peilika`，生产域名 `https://peilika.pages.dev`，由 `OpsDev/deploy-pages.sh` 一键完成「构建 dist → wrangler 推送」。

仓库内没有 GitHub Actions / GitLab CI / Jenkins 配置，也没有 Docker、K8s、Vercel、Netlify 或 VPS 痕迹。

```bash
# 日常部署（在项目根目录，git bash 中执行）
bash OpsDev/deploy-pages.sh
```

脚本内容要点（`OpsDev/deploy-pages.sh`）：
1. `rm -rf $ROOT/02-TempFiles/dist` 后重建 `assets/`、`sites/`、`thumbs/` 三个子目录。
2. 复制 `index.html`、`sites-data.js`、`favicon.webp`、`assets/app.js`、`assets/style.css`、`sites/*.html`、`thumbs/*.png`、**`thumbs/*.webp`**（webp 这一行是修线上动图裂图时补的，别删）。
3. `export PATH="/c/Users/mypra/AppData/Roaming/npm:$PATH"` 后执行 `wrangler pages deploy "$DIST" --project-name peilika --commit-dirty=true`。
4. 输出本次部署专属域名 `https://<deployment-id>.peilika.pages.dev`，生产域名随后同步（有边缘缓存延迟）。

## 首次完整部署演练

假设拿到一台全新机器、一个 Cloudflare 账号：

1. 安装 Node LTS 与 Python 3.11+（本项目用托管 Python 3.13）。
2. 安装 wrangler：`npm install -g wrangler`（本项目装在全局 npm，`/c/Users/mypra/AppData/Roaming/npm`）。
3. 登录：`npx wrangler login` → 浏览器用目标 Cloudflare 账号授权（当前为 `905443848@qq.com`，[需向交接人确认: 该账号归属与是否转移]）。
4. 确认项目存在：Cloudflare Dashboard → Workers & Pages → 项目 `peilika` 存在（首次没有则 `wrangler pages project create peilika`）。
5. 准备 Chrome：截图/校验依赖 `C:\Program Files\Google\Chrome\Application\chrome.exe`。
6. 准备缩略图环境：`uv pip install --python <venv> pillow`（仅重生成缩略图时需要）。
7. 起本地服务验证：`python -m http.server 8137 --bind 127.0.0.1`，打开 `http://127.0.0.1:8137/index.html` 确认 45 张卡片、无裂图。
8. 部署：`bash OpsDev/deploy-pages.sh`。
9. 线上验收（**必须校验 content-type，不能只看状态码**）：
   ```bash
   curl -s -o /dev/null -w "%{http_code} %{content_type}\n" -L https://peilika.pages.dev/
   curl -s -o /dev/null -w "%{content_type}\n" -L https://peilika.pages.dev/thumbs/hy4-preview.webp   # 应为 image/webp
   curl -s https://peilika.pages.dev/sites-data.js | grep -c '"slug"'                                  # 应为 45
   ```
10. 提交 git：`git add` 涉及文件后 `git commit -m "..."`（当前仓库无 remote，不自动推送）。

> 详见 [environment.md](./environment.md)：本项目无环境变量需要配置。

## 域名与 DNS

| 域名 | 用途 | 托管 | 说明 |
|---|---|---|---|
| `peilika.pages.dev` | 生产入口 | Cloudflare Pages 自动签发 | 证书由 Cloudflare 自动管理，无需手动续期 |
| `<deployment-id>.peilika.pages.dev` | 每次部署的专属预览域名 | Cloudflare Pages | 验证新版本是否真的上传成功时用它（生产域名有边缘缓存） |

- 未使用自定义域名，注册商/DNS 托管均不涉及。
- `sites/*.html` 用 `curl` 不带 `-L` 时返回 308（Cloudflare clean URL 规范化），**属正常**，不是部署错误。

## 第三方服务账号清单

| 服务 | 用途 | 账号归属 | 交接动作 |
|---|---|---|---|
| Cloudflare Pages（项目 `peilika`） | 静态托管与生产域名 | wrangler OAuth 账号 `905443848@qq.com`，[需向交接人确认: 账号归属/是否转移] | 在 Cloudflare Dashboard 把接手方加为成员，或让对方 `wrangler login` 后自行部署 |
| GitHub `Myparjna/Pelicans-Benchmar` | 历史曾推送过的公开仓库；当前本地仓库 `git remote -v` 为空 | [需向交接人确认: GitHub 账号归属] | 若需继续同步，重新 `git remote add origin <url>` 并推送 |
| jsdelivr CDN（Tabler Icons Webfont） | 图标字体 | 无账号 | 无需交接；若要离线化需自托管字体 |

## 服务器/托管资源

无 VPS、无自建服务器、无数据库：全部使用 Cloudflare Pages 静态托管。不涉及 SSH、容器或 systemd 服务。
