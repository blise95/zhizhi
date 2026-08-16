#!/bin/bash
# 一行更新：拉取 GitHub 最新代码 → 构建前端 → 打 JAR → 重启服务
# 用法（安装完成后）：
#   zhizhi-update
# 或：
#   /opt/zhizhi/src/deploy/update.sh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$(readlink -f "$0")")" && pwd)"
# shellcheck source=common.sh
. "${SCRIPT_DIR}/common.sh"

require_root
ensure_dirs

SKIP_PULL="${1:-}"

if [ ! -d "${ZHIZHI_SRC}/.git" ]; then
  die "未找到仓库 ${ZHIZHI_SRC}。请先执行：bash deploy/install.sh"
fi

if [ -f "${ZHIZHI_CONF}/deploy_key" ]; then
  chmod 600 "${ZHIZHI_CONF}/deploy_key"
  export GIT_SSH_COMMAND="ssh -i ${ZHIZHI_CONF}/deploy_key -o StrictHostKeyChecking=accept-new"
fi

if [ "$SKIP_PULL" != "--no-sync" ]; then
  log "拉取 ${ZHIZHI_BRANCH}（以 GitHub 为准，丢弃服务器本地改动）..."
  cd "${ZHIZHI_SRC}"
  git merge --abort >/dev/null 2>&1 || true
  git rebase --abort >/dev/null 2>&1 || true
  git fetch origin
  # 不要先 checkout：有未合并文件时会失败。reset --hard 可直接对齐远端。
  git reset --hard "origin/${ZHIZHI_BRANCH}"
  git checkout -B "${ZHIZHI_BRANCH}" "origin/${ZHIZHI_BRANCH}" >/dev/null
  exec bash "${ZHIZHI_SRC}/deploy/update.sh" --no-sync
fi

cd "${ZHIZHI_SRC}"
log "准备构建工具链..."
setup_path

command -v node >/dev/null || die "未找到 node，请先跑 deploy/install.sh"
command -v javac >/dev/null || die "未找到 JDK，请安装 java-1.8.0-openjdk-devel"
command -v mvn >/dev/null || die "未找到 mvn（已尝试解压 apache-maven-3.9.6-bin.zip）"

log "node=$(node -v)  npm=$(npm -v)"
log "mvn=$(mvn -v 2>/dev/null | sed -n '1p')"
log "java=$(java -version 2>&1 | sed -n '1p')"

# 国内机器访问 npmjs/maven 官方源经常像卡住，默认走镜像
export npm_config_registry="${NPM_REGISTRY:-https://registry.npmmirror.com}"
MVN_SETTINGS="${ZHIZHI_SRC}/deploy/maven-settings.xml"
log "npm 源: ${npm_config_registry}"

log "安装前端依赖 npm ci（首次 5Mbps 可能要 10～20 分钟，会持续有输出）"
if [ -f package-lock.json ]; then
  npm ci --no-audit --no-fund
else
  npm install --no-audit --no-fund
fi

log "构建 React（base=/zhiliang/）"
export VITE_ZHIHE_API_URL="${VITE_ZHIHE_API_URL:-/zhihe}"
npm run build:prod
[ -f dist/index.html ] || die "前端构建失败：没有 dist/index.html"

log "Maven 打包（不要用 -q，才能看到下载进度）"
if [ -f "$MVN_SETTINGS" ]; then
  mvn -DskipTests -Pprod package -Dmaven.repo.local="${ZHIZHI_M2}" -s "$MVN_SETTINGS"
else
  mvn -DskipTests -Pprod package -Dmaven.repo.local="${ZHIZHI_M2}"
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
  log "重启 zhizhi-api"
  systemctl daemon-reload
  systemctl restart zhizhi-api
else
  log "尚未安装 systemd 服务，跳过重启（首次请跑 install.sh）"
fi

if [ -x "${ZHIZHI_SRC}/deploy/healthcheck.sh" ]; then
  bash "${ZHIZHI_SRC}/deploy/healthcheck.sh" || die "健康检查失败"
fi

log "部署完成  http://$(hostname -I 2>/dev/null | awk '{print $1}')/zhiliang/"
