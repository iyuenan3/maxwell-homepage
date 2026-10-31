#!/bin/bash
# Deploy maxwellii-chat-api (LLM chat backend for maxwellii.com)
# Usage: bash chat-api/deploy.sh
#
# 默认发布到北京 Docker。旧机发布显式指定 PROCESS_MANAGER=pm2。
# 新机首次配置与迁移阻断状态见 AIREADME/DEPLOYMENT.md。
# .env.local 始终由服务器保管，不随代码发布。

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

[ -f "$SCRIPT_DIR/.env" ] && source "$SCRIPT_DIR/.env"

PROCESS_MANAGER="${PROCESS_MANAGER:-docker}"
case "$PROCESS_MANAGER" in
  docker)
    SSH_HOST="${SSH_HOST:-alicloud-bj}"
    REMOTE_DIR="${REMOTE_DIR:-/srv/maxwell-homepage/current/chat-api}"
    INDEX_DIR="/srv/maxwell-homepage/shared/data"
    RSYNC_PRIVILEGE=(--rsync-path "sudo -n rsync")
    ;;
  pm2)
    SSH_HOST="${SSH_HOST:-alicloud-sg}"
    REMOTE_DIR="${REMOTE_DIR:-/home/admin/maxwellii-chat-api}"
    INDEX_DIR="$REMOTE_DIR/data"
    RSYNC_PRIVILEGE=(--rsync-path rsync)
    ;;
  *)
    echo "Error: PROCESS_MANAGER must be docker or pm2. The former systemd candidate is retired."
    exit 1
    ;;
esac
SSH_OPTS=(-o BatchMode=yes -o ConnectTimeout=10 -o ServerAliveInterval=10 -o ServerAliveCountMax=2 -o ControlMaster=no -o ControlPath=none)
DEPLOY_ID=$(TZ=Asia/Shanghai date +%Y%m%d-%H%M%S)

remote_run() {
  local script
  script=$(printf '%q' "$1")
  if [ "$PROCESS_MANAGER" = docker ]; then
    ssh "${SSH_OPTS[@]}" "$SSH_HOST" "sudo -n bash -c $script"
  else
    ssh "${SSH_OPTS[@]}" "$SSH_HOST" "bash -c $script"
  fi
}

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
rsync -avz "${RSYNC_PRIVILEGE[@]}" -e "ssh ${SSH_OPTS[*]}" \
  --exclude '.git' \
  --exclude '.env*' \
  --exclude 'node_modules' \
  --exclude '.next/cache' \
  --exclude '.next/dev' \
  --exclude 'data/' \
  --exclude '.DS_Store' \
  "$SCRIPT_DIR/" "$SSH_HOST:$REMOTE_DIR/"

# 仅分发索引文件，不把缓存、备份或其他本地资料带到生产。
# 临时文件校验后原子替换，保留原索引，防止进程加载半个 JSON。
INDEX_SHA=$(shasum -a 256 "$SCRIPT_DIR/data/embeddings.json" | cut -d ' ' -f 1)
remote_run "set -e; mkdir -p '$INDEX_DIR'; chmod 600 '$REMOTE_DIR/.env.local'"
rsync -vz "${RSYNC_PRIVILEGE[@]}" --chmod=u=rw,go= -e "ssh ${SSH_OPTS[*]}" \
  "$SCRIPT_DIR/data/embeddings.json" "$SSH_HOST:$INDEX_DIR/embeddings.json.incoming.$DEPLOY_ID"
remote_run "set -e; cd '$INDEX_DIR'; echo '$INDEX_SHA  embeddings.json.incoming.$DEPLOY_ID' | sha256sum -c -; if [ -f embeddings.json ]; then cp -p embeddings.json 'embeddings.json.bak.$DEPLOY_ID'; fi; mv 'embeddings.json.incoming.$DEPLOY_ID' embeddings.json; chmod 600 embeddings.json"

echo "=== Installing prod deps on remote ==="
if [ "$PROCESS_MANAGER" = docker ]; then
  remote_run "set -e; chown -R maxwellii:maxwellii '$REMOTE_DIR'; chown maxwellii:maxwellii '$INDEX_DIR/embeddings.json'; docker compose -f /srv/maxwell-homepage/current/ops/compose.yaml run --rm --no-deps --entrypoint npm chat-api ci --omit=dev --no-audit --fund=false; docker compose -f /srv/maxwell-homepage/current/ops/compose.yaml up -d --no-deps --force-recreate chat-api"
else
  remote_run "cd '$REMOTE_DIR' && npm ci --omit=dev && (pm2 reload '$REMOTE_DIR/ecosystem.config.cjs' --update-env || pm2 start '$REMOTE_DIR/ecosystem.config.cjs')"
fi

echo "=== Status ==="
if [ "$PROCESS_MANAGER" = docker ]; then
  remote_run "docker compose -f /srv/maxwell-homepage/current/ops/compose.yaml ps chat-api"
else
  ssh "${SSH_OPTS[@]}" "$SSH_HOST" "pm2 list | grep maxwellii-chat-api || true"
fi

echo
if [ "$PROCESS_MANAGER" = docker ]; then
  echo "✓ Beijing origin deployed. Domain availability is managed separately; see AIREADME/DEPLOYMENT.md."
  echo "  log: ssh $SSH_HOST 'sudo docker compose -f /srv/maxwell-homepage/current/ops/compose.yaml logs --tail 50 chat-api'"
else
  echo "✓ Legacy origin deployed. Domain availability is managed separately; see AIREADME/DEPLOYMENT.md."
  echo "  log: ssh $SSH_HOST 'pm2 logs maxwellii-chat-api'"
fi
