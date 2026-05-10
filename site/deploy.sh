#!/bin/bash
# Deploy maxwellii.com static site (方案 C：V2 占主域 / V1 退到 /v1/)
# Usage: bash site/deploy.sh
#
# 部署后服务器结构：
#   /home/admin/maxwellii-site/
#     ├── index.html         ← V2 (主域 maxwellii.com/)
#     ├── styles.css / chat.js / emotes.js / commands.js / token-hud.js
#     ├── data/home-data.js  ← V1 + V2 共用真相源
#     ├── p/                 ← 10 详情页（V1 + V2 共享）
#     └── v1/                ← V1 主页 (/v1/)
#         ├── index.html / styles.css / avatar.jpg

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

[ -f "$SCRIPT_DIR/.env" ] && source "$SCRIPT_DIR/.env"

SSH_HOST="${SSH_HOST:-alicloud-sg}"
REMOTE_DIR="${REMOTE_DIR:-/home/admin/maxwellii-site}"

LOCAL_PUBLIC="$SCRIPT_DIR/public"
V2_DIR="$SCRIPT_DIR/v2-redesign"
DATA_DIR="$SCRIPT_DIR/data"

# ── Sanity ────────────────────────────────────────────
if [ ! -f "$LOCAL_PUBLIC/index.html" ]; then
    echo "Error: $LOCAL_PUBLIC/index.html not found."
    exit 1
fi
if [ ! -f "$V2_DIR/index.html" ]; then
    echo "Error: $V2_DIR/index.html not found."
    exit 1
fi
if ! command -v node >/dev/null 2>&1; then
    echo "Error: node not found."
    exit 1
fi

# ── Build (V1 + 详情页) ────────────────────────────────
echo "=== Building V1 + detail pages ==="
( cd "$SCRIPT_DIR" && node build.js )

DETAIL_COUNT=$(ls -1 "$LOCAL_PUBLIC/p/" 2>/dev/null | grep -c '\.html$' || true)
if [ "$DETAIL_COUNT" -eq 0 ]; then
    echo "Error: no detail pages built."
    exit 1
fi
echo "→ $DETAIL_COUNT detail pages built, V1 index.html ready"
echo

# ── Stage 1: V2 → maxwellii-site/ 根 ────────────────────
echo "=== Stage 1: V2 → $SSH_HOST:$REMOTE_DIR/ (root) ==="
rsync -avz \
  --exclude '.DS_Store' \
  --exclude 'DESIGN-NOTES.md' \
  "$V2_DIR/" "$SSH_HOST:$REMOTE_DIR/"
echo

# ── Stage 2: data/ → maxwellii-site/data/ ──────────────
echo "=== Stage 2: data/ → $SSH_HOST:$REMOTE_DIR/data/ ==="
rsync -avz \
  --exclude '.DS_Store' \
  "$DATA_DIR/" "$SSH_HOST:$REMOTE_DIR/data/"
echo

# ── Stage 3: 详情页 → maxwellii-site/p/ (V1 + V2 共享) ─
echo "=== Stage 3: p/ → $SSH_HOST:$REMOTE_DIR/p/ ==="
rsync -avz --delete \
  --exclude '.DS_Store' \
  "$LOCAL_PUBLIC/p/" "$SSH_HOST:$REMOTE_DIR/p/"
echo

# ── Stage 4: V1 → maxwellii-site/v1/ ───────────────────
echo "=== Stage 4: V1 → $SSH_HOST:$REMOTE_DIR/v1/ ==="
ssh "$SSH_HOST" "mkdir -p $REMOTE_DIR/v1"
rsync -avz \
  --exclude '.DS_Store' \
  "$LOCAL_PUBLIC/index.html" \
  "$LOCAL_PUBLIC/styles.css" \
  "$LOCAL_PUBLIC/avatar.jpg" \
  "$LOCAL_PUBLIC/detail-init.js" \
  "$SSH_HOST:$REMOTE_DIR/v1/"
echo

# ── Stage 5: detail-init.js → 根（详情页 ../detail-init.js 引用）─
echo "=== Stage 5: detail-init.js → $SSH_HOST:$REMOTE_DIR/ (for /p/*.html) ==="
rsync -avz "$LOCAL_PUBLIC/detail-init.js" "$SSH_HOST:$REMOTE_DIR/"
echo

# ── 健全性检查 ─────────────────────────────────────────
echo "=== Remote root listing ==="
ssh "$SSH_HOST" "ls -la $REMOTE_DIR/ | head -25"
echo
echo "=== Remote v1/ listing ==="
ssh "$SSH_HOST" "ls -la $REMOTE_DIR/v1/"
echo
echo "✓ Deploy complete:"
echo "  V2 (主域): https://maxwellii.com/"
echo "  V1:        https://maxwellii.com/v1/"
echo "  详情页:     https://maxwellii.com/p/<slug>.html"
