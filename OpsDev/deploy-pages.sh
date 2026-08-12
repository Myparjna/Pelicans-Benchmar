#!/usr/bin/env bash
# 部署「鹈鹕自行车测试」展厅到 Cloudflare Pages 项目 peilika
# 用法（在 git bash 中）：
#   bash OpsDev/deploy-pages.sh
# 依赖：已登录 wrangler（npx wrangler login）且账号下有 peilika 项目
set -e

ROOT="C:/Users/mypra/Desktop/鹈鹕自行车测试"
DIST="$ROOT/TempFiles/dist"

echo "==> 构建部署包到 $DIST"
rm -rf "$DIST"
mkdir -p "$DIST/assets" "$DIST/sites" "$DIST/thumbs"
cp "$ROOT/index.html" "$ROOT/sites-data.js" "$DIST/"
cp "$ROOT/assets/app.js" "$ROOT/assets/style.css" "$DIST/assets/"
cp "$ROOT/sites/"*.html "$DIST/sites/"
cp "$ROOT/thumbs/"*.png "$DIST/thumbs/"

echo "==> 部署到 peilika.pages.dev"
export PATH="/c/Users/mypra/AppData/Roaming/npm:$PATH"
wrangler pages deploy "$DIST" --project-name peilika --commit-dirty=true
