#!/bin/bash
# 只重新构建并发布后端 JAR，然后重启 Java。不跑 npm。
# 用法：zhizhi-backend
#    或：bash /opt/zhizhi/src/deploy/deploy-backend.sh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$(readlink -f "$0")")" && pwd)"
# shellcheck source=common.sh
. "${SCRIPT_DIR}/common.sh"

require_root
ensure_dirs
install_cli
setup_path

cd "${ZHIZHI_SRC}"

command -v javac >/dev/null || die "未找到 JDK，请安装 java-1.8.0-openjdk-devel"
command -v mvn >/dev/null || die "未找到 mvn（已尝试解压 apache-maven-3.9.6-bin.zip）"
log "mvn=$(mvn -v 2>/dev/null | sed -n '1p')"
log "java=$(java -version 2>&1 | sed -n '1p')"

MVN_SETTINGS="${ZHIZHI_SRC}/deploy/maven-settings.xml"
MVN_ARGS=(-DskipTests package -Dmaven.repo.local="${ZHIZHI_M2}")
if [ -f dist/index.html ]; then
  log "发现 dist/，使用 -Pprod 把前端打进 JAR（兼容旧 Nginx 反代）"
  MVN_ARGS=(-DskipTests -Pprod package -Dmaven.repo.local="${ZHIZHI_M2}")
else
  log "没有 dist/，只打 Java（页面由 Nginx 的 ${ZHIZHI_WEB} 提供）"
fi

log "Maven 打包（不要用 -q，才能看到下载进度）"
if [ -f "$MVN_SETTINGS" ]; then
  mvn "${MVN_ARGS[@]}" -s "$MVN_SETTINGS"
else
  mvn "${MVN_ARGS[@]}"
fi

SRC_JAR="${ZHIZHI_SRC}/target/${ZHIZHI_ARTIFACT}"
[ -f "$SRC_JAR" ] || die "未找到 $SRC_JAR"

DEST_JAR="${ZHIZHI_APP}/${ZHIZHI_JAR_NAME}"
if [ -f "$DEST_JAR" ]; then
  cp -f "$DEST_JAR" "${DEST_JAR}.bak"
  log "已备份上一版 → ${DEST_JAR}.bak"
fi
cp -f "$SRC_JAR" "$DEST_JAR"
log "已发布 $DEST_JAR"

if [ -f /etc/systemd/system/zhizhi-api.service ] || systemctl list-unit-files | grep -q zhizhi-api; then
  log "同步 systemd 并重启 zhizhi-api"
  cp -f "${SCRIPT_DIR}/systemd/zhizhi-api.service" /etc/systemd/system/zhizhi-api.service
  systemctl daemon-reload
  systemctl restart zhizhi-api
else
  die "尚未安装 systemd 服务，请先跑 deploy/install.sh"
fi

log "后端已重启。日志：${ZHIZHI_LOG_FILE:-/opt/zhizhi/logs/zhizhi-api.log}"
log "回滚：cp -f ${DEST_JAR}.bak ${DEST_JAR} && systemctl restart zhizhi-api"
