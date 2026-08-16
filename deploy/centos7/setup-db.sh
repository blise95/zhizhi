#!/bin/bash
# 处理 MySQL 8 临时密码，创建 zhizhi 用户并导入 schema
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$(readlink -f "$0")")" && pwd)"
# shellcheck source=../common.sh
. "${SCRIPT_DIR}/../common.sh"

require_root
ensure_dirs

ENV_FILE="${ZHIZHI_CONF}/zhizhi.env"
SCHEMA="${ZHIZHI_SRC}/src/main/resources/schema.sql"
[ -f "$SCHEMA" ] || die "找不到 $SCHEMA"
[ -f "$ENV_FILE" ] || die "找不到 $ENV_FILE，请先跑 install-mysql.sh"
# shellcheck disable=SC1090
. "$ENV_FILE"

ROOT_ARGS=(-uroot)
if mysql --protocol=socket -uroot -e "SELECT 1" >/dev/null 2>&1; then
  log "root 免密可用"
elif mysql --protocol=socket -uroot -p"${ZHIZHI_DB_PASSWORD}" -e "SELECT 1" >/dev/null 2>&1; then
  log "root 使用 zhizhi.env 中的密码"
  ROOT_ARGS=(-uroot -p"${ZHIZHI_DB_PASSWORD}")
else
  LOG_FILE="/var/log/mysqld.log"
  [ -f "$LOG_FILE" ] || LOG_FILE="/var/log/mysql/mysqld.log"
  [ -f "$LOG_FILE" ] || die "找不到 mysqld 日志，无法读取临时密码"

  TEMP_PASS="$(grep 'A temporary password is generated' "$LOG_FILE" | tail -1 | awk '{print $NF}')"
  [ -n "$TEMP_PASS" ] || die "日志里没有 temporary password，请 cat $LOG_FILE"

  CNF="$(mktemp)"
  chmod 600 "$CNF"
  printf '[client]\nuser=root\npassword=%s\n' "$TEMP_PASS" > "$CNF"
  log "使用临时密码重置 root"
  mysql --defaults-extra-file="$CNF" --connect-expired-password --protocol=socket \
    -e "ALTER USER 'root'@'localhost' IDENTIFIED BY '${ZHIZHI_DB_PASSWORD}'; FLUSH PRIVILEGES;"
  rm -f "$CNF"
  ROOT_ARGS=(-uroot -p"${ZHIZHI_DB_PASSWORD}")
fi

mysql --protocol=socket "${ROOT_ARGS[@]}" <<SQL
CREATE DATABASE IF NOT EXISTS quality_inspection DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
CREATE USER IF NOT EXISTS 'zhizhi'@'localhost' IDENTIFIED BY '${ZHIZHI_DB_PASSWORD}';
ALTER USER 'zhizhi'@'localhost' IDENTIFIED BY '${ZHIZHI_DB_PASSWORD}';
GRANT ALL PRIVILEGES ON quality_inspection.* TO 'zhizhi'@'localhost';
FLUSH PRIVILEGES;
SQL

mysql --protocol=socket "${ROOT_ARGS[@]}" < "$SCHEMA"
mysql --protocol=socket -uzhizhi -p"${ZHIZHI_DB_PASSWORD}" -e "SHOW TABLES FROM quality_inspection;"
log "数据库账号与表结构已就绪"
