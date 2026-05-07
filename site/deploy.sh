#!/bin/bash
# Deploy maxwellii.com static site to Singapore origin server
# Usage: bash site/deploy.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Optional: source .env for custom SSH host / remote dir
[ -f "$SCRIPT_DIR/.env" ] && source "$SCRIPT_DIR/.env"

SSH_HOST="${SSH_HOST:-singapore}"
REMOTE_DIR="${REMOTE_DIR:-/home/admin/maxwellii-site}"
LOCAL_DIR="$SCRIPT_DIR/public"

# Sanity check: public/ 不能是空的（至少要有 index.html 等真实内容）
if [ ! -f "$LOCAL_DIR/index.html" ]; then
    echo "Error: $LOCAL_DIR/index.html not found."
    echo "Put your Claude Design exports into site/public/ first."
    exit 1
fi

echo "=== Syncing $LOCAL_DIR/ → $SSH_HOST:$REMOTE_DIR ==="
rsync -avz --delete \
  --exclude '.gitkeep' \
  --exclude '.DS_Store' \
  "$LOCAL_DIR/" "$SSH_HOST:$REMOTE_DIR/"

echo
echo "=== Remote file list ==="
ssh "$SSH_HOST" "ls -lah $REMOTE_DIR/ | head -20"

echo
echo "✓ Deploy complete: https://maxwellii.com"
