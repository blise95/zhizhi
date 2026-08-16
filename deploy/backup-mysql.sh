#!/bin/bash
# dump MySQL 到 /opt/zhizhi/backup，只保留最近 7 份
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=common.sh
. "${SCRIPT_DIR}/common.sh"

ensure_dirs
[ -f "${ZHIZHI_CONF}/zhizhi.env" ] || die "缺少 ${ZHIZHI_CONF}/zhizhi.env"
# shellcheck disable=SC1090
. "${ZHIZHI_CONF}/zhizhi.env"

STAMP="$(date +%Y%m%d-%H%M%S)"
OUT="${ZHIZHI_BACKUP}/quality_inspection-${STAMP}.sql.gz"

mysqldump -uzhizhi -p"${ZHIZHI_DB_PASSWORD}" -h127.0.0.1 \
  --single-transaction --quick quality_inspection | gzip > "$OUT"

chmod 600 "$OUT"
log "备份完成 $OUT"

ls -1t "${ZHIZHI_BACKUP}"/quality_inspection-*.sql.gz 2>/dev/null | tail -n +8 | xargs -r rm -f
log "已清理超过 7 份的旧备份"
