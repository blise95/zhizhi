#!/bin/bash
# 检查 Nginx、前端静态页、Java API、本机 MySQL
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

http_code() {
  curl -s -o /dev/null -w "%{http_code}" "$1" || echo "000"
}

check "nginx 进程" systemctl is-active --quiet nginx
check "zhizhi-api 进程" systemctl is-active --quiet zhizhi-api

# 等 Java 最多 45 秒（登录接口未登录应 401）
for i in $(seq 1 45); do
  code="$(http_code "http://127.0.0.1:8080/zhiliang/api/auth/me")"
  if [ "$code" = "401" ] || [ "$code" = "200" ]; then
    break
  fi
  sleep 1
done

code_java="$(http_code "http://127.0.0.1:8080/zhiliang/api/auth/me")"
if [ "$code_java" = "401" ] || [ "$code_java" = "200" ]; then
  log "OK  Java API ($code_java)"
else
  log "FAIL  Java API (got $code_java)"
  fail=1
fi

code_page="$(http_code "http://127.0.0.1/zhiliang/")"
if [ "$code_page" = "200" ]; then
  log "OK  Nginx /zhiliang/ ($code_page)"
else
  log "FAIL  Nginx /zhiliang/ (got $code_page)"
  fail=1
fi

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
