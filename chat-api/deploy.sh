#!/bin/bash
# Deploy maxwellii-chat-api (LLM chat backend for maxwellii.com)
# Usage: bash chat-api/deploy.sh
#
# Prereq on server (one-time):
#   - Node 20+ + pm2 安装好
#   - vi /home/admin/maxwellii-chat-api/.env.local 写入 CHAT_LLM_API_KEY / CHAT_LLM_BASE_URL / CHAT_LLM_MODEL
#   - nginx 加 location /api/chat → proxy_pass http://127.0.0.1:3002 + proxy_buffering off

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

[ -f "$SCRIPT_DIR/.env" ] && source "$SCRIPT_DIR/.env"

SSH_HOST="${SSH_HOST:-alicloud-sg}"
REMOTE_DIR="${REMOTE_DIR:-/home/admin/maxwellii-chat-api}"

# Sanity check
if [ ! -f "$SCRIPT_DIR/package.json" ]; then
  echo "Error: $SCRIPT_DIR/package.json not found."
  exit 1
fi

if ! command -v node >/dev/null 2>&1; then
  echo "Error: node not found locally."
  exit 1
fi

echo "=== Checking RAG embeddings ==="
if [ ! -f "$SCRIPT_DIR/data/embeddings.json" ]; then
  echo "Error: data/embeddings.json missing. Run \`npm run reindex\` first."
  exit 1
fi
# 如果 manifest.json 比 embeddings.json 新，提醒（但不自动 reindex，因为耗时 ~30min）
if [ -f "$SCRIPT_DIR/scripts/manifest.json" ] && \
   [ "$SCRIPT_DIR/scripts/manifest.json" -nt "$SCRIPT_DIR/data/embeddings.json" ]; then
  echo "⚠️  manifest.json is newer than embeddings.json — consider running \`npm run reindex\`"
  read -p "Continue with current embeddings? [y/N] " ans
  [ "$ans" != "y" ] && exit 1
fi
EMBED_SIZE=$(du -h "$SCRIPT_DIR/data/embeddings.json" | cut -f1)
echo "→ embeddings.json ready ($EMBED_SIZE)"
echo

echo "=== Building maxwellii-chat-api ==="
if ! ( cd "$SCRIPT_DIR" && npm run build ); then
  echo "Error: next build FAILED. Aborting deploy (服务器仍跑旧版)."
  exit 1
fi

if [ ! -d "$SCRIPT_DIR/.next" ]; then
  echo "Error: build failed (no .next/ output)."
  exit 1
fi

echo "=== Syncing $SCRIPT_DIR/ → $SSH_HOST:$REMOTE_DIR ==="
rsync -avz \
  --exclude '.git' \
  --exclude '.env.example' \
  --exclude 'node_modules' \
  --exclude '.next/cache' \
  --exclude '.next/dev' \
  --exclude '.DS_Store' \
  "$SCRIPT_DIR/" "$SSH_HOST:$REMOTE_DIR/"

# 把 .env.local 的权限收紧到 600（只 admin 可读，含 KEY）
ssh "$SSH_HOST" "chmod 600 $REMOTE_DIR/.env.local 2>/dev/null || true"

echo "=== Installing prod deps on remote ==="
ssh "$SSH_HOST" "cd $REMOTE_DIR && npm install --omit=dev"

echo "=== Reloading pm2 ==="
ssh "$SSH_HOST" "pm2 reload $REMOTE_DIR/ecosystem.config.cjs --update-env || pm2 start $REMOTE_DIR/ecosystem.config.cjs"

echo "=== Status ==="
ssh "$SSH_HOST" "pm2 list | grep maxwellii-chat-api || true"

echo
echo "✓ Deploy complete: https://maxwellii.com/api/chat"
echo "  log: ssh $SSH_HOST 'pm2 logs maxwellii-chat-api'"
