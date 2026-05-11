#!/bin/bash
# 清空 chat-api 的 ADMIN_TOKEN（每天定时跑，强制 token 过期）
#
# 部署：deploy.sh 的 rsync 会把本脚本同步到服务器
#       /home/admin/maxwellii-chat-api/clear-admin-token.sh
#
# crontab（admin 用户，已配置一次后不需重装）：
#   0 7 * * * /home/admin/maxwellii-chat-api/clear-admin-token.sh
#
# 触发后所有当前 token 立刻 401；想再用 → /admin-url skill 重新发一个

set -u

ENV=/home/admin/maxwellii-chat-api/.env.local
LOG=/home/admin/admin-token-clear.log
ts=$(date '+%Y-%m-%d %H:%M:%S %Z')

if grep -q '^ADMIN_TOKEN=' "$ENV"; then
  sed -i 's|^ADMIN_TOKEN=.*|ADMIN_TOKEN=|' "$ENV"
  /usr/bin/pm2 reload maxwellii-chat-api --update-env >/dev/null 2>&1
  rc=$?
  if [ $rc -eq 0 ]; then
    echo "[$ts] cleared + reloaded" >> "$LOG"
  else
    echo "[$ts] cleared but pm2 reload failed (rc=$rc)" >> "$LOG"
  fi
else
  echo "[$ts] no ADMIN_TOKEN line, skipped" >> "$LOG"
fi
