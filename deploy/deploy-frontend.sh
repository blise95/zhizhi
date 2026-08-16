#!/bin/bash
# 只重新构建并发布前端（Nginx 直接出静态资源，不重启 Java）。
# 用法：zhizhi-frontend
#    或：bash /opt/zhizhi/src/deploy/deploy-frontend.sh
# 加 --ci 会强制 npm ci（依赖变了时用）
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$(readlink -f "$0")")" && pwd)"
# shellcheck source=common.sh
. "${SCRIPT_DIR}/common.sh"

require_root
ensure_dirs
install_cli
setup_path

FORCE_CI="${1:-}"
cd "${ZHIZHI_SRC}"

command -v node >/dev/null || die "未找到 node，请先跑 deploy/install.sh"
export npm_config_registry="${NPM_REGISTRY:-https://registry.npmmirror.com}"
log "node=$(node -v)  npm=$(npm -v)  源=${npm_config_registry}"

if [ "$FORCE_CI" = "--ci" ] || [ ! -d node_modules ]; then
  log "安装前端依赖 npm ci（5Mbps 首次可能要 10～20 分钟）"
  if [ -f package-lock.json ]; then
    npm ci --no-audit --no-fund
  else
    npm install --no-audit --no-fund
  fi
else
  log "已有 node_modules，跳过 npm ci（需要重装请加 --ci）"
fi

log "构建 React（base=/zhiliang/）"
export VITE_ZHIHE_API_URL="${VITE_ZHIHE_API_URL:-/zhihe}"
npm run build:prod
[ -f dist/index.html ] || die "前端构建失败：没有 dist/index.html"

log "发布静态资源 → ${ZHIZHI_WEB}"
WEB_TMP="${ZHIZHI_WEB}.tmp"
rm -rf "$WEB_TMP"
mkdir -p "$WEB_TMP"
cp -a dist/. "$WEB_TMP/"
rm -rf "${ZHIZHI_WEB}"
mv "$WEB_TMP" "${ZHIZHI_WEB}"

log "更新 Nginx 配置（/zhiliang/ 走静态，/zhiliang/api/ 走 Java）"
cp -f "${ZHIZHI_SRC}/deploy/nginx/zhizhi.conf" /etc/nginx/conf.d/zhizhi.conf
nginx -t
systemctl reload nginx || systemctl restart nginx

log "前端已发布  http://$(hostname -I 2>/dev/null | awk '{print $1}')/zhiliang/"
