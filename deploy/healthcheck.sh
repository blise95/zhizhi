#!/bin/bash
# 检查 Nginx、Java 页面、API、本机 MySQL
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$(readlink -f "$0")")" && pwd)"
# shellcheck source=common.sh
. "${SCRIPT_DIR}/common.sh"

fail=0
check() {
  local name="$1"
  shift
  if "$@"; then
    log "OK  $name"
  else
    log "FAIL  $name"
    fail=1
  fi
}

check "nginx 进程" systemctl is-active --quiet nginx
check "zhizhi-api 进程" systemctl is-active --quiet zhizhi-api

# 等 Java 最多 45 秒
for i in $(seq 1 45); do
  if curl -sf -o /dev/null "http://127.0.0.1:8080/zhiliang/"; then
    break
  fi
  sleep 1
done

check "Java /zhiliang/" curl -sf -o /dev/null "http://127.0.0.1:8080/zhiliang/"
check "Nginx /zhiliang/" curl -sf -o /dev/null "http://127.0.0.1/zhiliang/"
check "API list" curl -sf -o /dev/null "http://127.0.0.1/zhiliang/api/inspection/list"

if [ -f "${ZHIZHI_CONF}/zhizhi.env" ]; then
  # shellcheck disable=SC1090
  . "${ZHIZHI_CONF}/zhizhi.env"
  if command -v mysql >/dev/null 2>&1; then
    if mysql -uzhizhi -p"${ZHIZHI_DB_PASSWORD}" -h127.0.0.1 quality_inspection -e "SELECT 1" >/dev/null 2>&1; then
      log "OK  MySQL 本机连通"
    else
      log "FAIL  MySQL 本机连通"
      fail=1
    fi
  fi
fi

if [ "$fail" -ne 0 ]; then
  die "健康检查未全部通过。journalctl -u zhizhi-api -n 80"
fi
log "健康检查全部通过"
