#!/usr/bin/env bash
# 部署「鹈鹕自行车测试」展厅到 Cloudflare Pages 项目 peilika
# 用法（在 git bash 中）：
#   export CLOUDFLARE_API_TOKEN="cfut_你的有效token"
#   export CLOUDFLARE_ACCOUNT_ID="你的账号ID"   # 可选，留空会自动获取
#   bash OpsDev/deploy-pages.sh
set -e

if [ -z "$CLOUDFLARE_API_TOKEN" ]; then
  echo "缺少 CLOUDFLARE_API_TOKEN，请先 export 后再运行。" >&2
  exit 1
fi

if [ -z "$CLOUDFLARE_ACCOUNT_ID" ]; then
  echo "未设置 CLOUDFLARE_ACCOUNT_ID，尝试自动获取..."
  CLOUDFLARE_ACCOUNT_ID=$(curl -s -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
    https://api.cloudflare.com/client/v4/accounts \
    | grep -o '"id":"[^"]*"' | head -1 | sed 's/"id":"//; s/"//')
  if [ -z "$CLOUDFLARE_ACCOUNT_ID" ]; then
    echo "自动获取账号 ID 失败（token 可能无效或权限不足），请手动 export CLOUDFLARE_ACCOUNT_ID。" >&2
    exit 1
  fi
  echo "账号 ID: $CLOUDFLARE_ACCOUNT_ID"
  export CLOUDFLARE_ACCOUNT_ID
fi

export PATH="/c/Users/mypra/AppData/Roaming/npm:$PATH"
wrangler pages deploy . --project-name peilika
