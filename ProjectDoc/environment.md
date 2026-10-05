---
document: environment.md
generated: 2026-10-06 00:46
client_level: developer
---

# 环境变量

⚠️ 本文档不包含任何真实密钥值。真实值通过安全渠道单独交接。

> 详见 [deployment.md](./deployment.md) 中的 密钥在各部署平台的配置位置

## 总览

本项目**不使用任何环境变量与 `.env` 文件**，也没有任何 API 密钥：纯静态站点，部署凭据依赖本机 `wrangler` 的 OAuth 登录态（凭据文件在 `~/.wrangler/`，不在仓库内）。

扫描器报告的 3 个变量全部来自 `OpsDev/deploy-pages.sh` 的 shell 局部变量，说明如下。

## 变量清单

| 变量名 | 来源 | 交接说明 |
|---|---|---|
| `ROOT` | **仅源码中使用，未在 .env.example 声明** | `OpsDev/deploy-pages.sh:8` 定义的 shell 变量，值为本项目根目录绝对路径（`C:/Users/mypra/Desktop/VibeCoding指南/skills测评项目/03-鹈鹕自行车测试`）。用途：定位待复制的源文件。不需要加入 `.env`（换机器时改这一行即可）；必需（脚本 `set -e`，路径错则部署失败）；泄露影响：仅暴露本地目录结构 |
| `DIST` | **仅源码中使用，未在 .env.example 声明** | `OpsDev/deploy-pages.sh:9`，值为 `$ROOT/02-TempFiles/dist`。用途：部署包输出目录，每次部署前 `rm -rf` 重建。不需要加入 `.env`；必需；泄露影响：无 |
| `PATH` | **仅源码中使用，未在 .env.example 声明** | `OpsDev/deploy-pages.sh:21`，脚本内临时把 `/c/Users/mypra/AppData/Roaming/npm` 加入 `PATH`，用于找到全局安装的 `wrangler`。不需要加入 `.env`；必需（否则报 `wrangler: command not found`）；泄露影响：无 |

## 密钥轮换

- **无 API 密钥可轮换**：仓库与部署包里没有 token、没有 `.env`、没有 CI secrets。
- **唯一凭据是 wrangler OAuth 登录态**：存于本机 `~/.wrangler/`（不在仓库）。交接给他人时不需要轮换该凭据，正确做法是让接手方在自己的机器上执行 `npx wrangler login` 用目标 Cloudflare 账号登录，或在 Cloudflare Dashboard 把对方加为项目成员（见 deployment.md）。
- 历史教训：曾尝试使用 Cloudflare API Token（`cfut_...` 前缀）验证为**失效**，不要再走 Token 路线（见 known-issues.md）。
