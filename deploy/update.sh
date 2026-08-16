#!/bin/bash
# 全量更新：拉代码 → 前端 → 后端 → 健康检查
# 用法：zhizhi-update
#    或：bash /opt/zhizhi/src/deploy/update.sh
#        bash /opt/zhizhi/src/deploy/update.sh --no-sync   # 不拉 Git，只构建
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$(readlink -f "$0")")" && pwd)"
# shellcheck source=common.sh
. "${SCRIPT_DIR}/common.sh"

require_root
ensure_dirs
install_cli

SKIP_PULL="${1:-}"
if [ "$SKIP_PULL" != "--no-sync" ]; then
  bash "${SCRIPT_DIR}/sync.sh"
  # 拉完后执行仓库里的新脚本
  exec bash "${ZHIZHI_SRC}/deploy/update.sh" --no-sync
fi

bash "${ZHIZHI_SRC}/deploy/deploy-frontend.sh"
bash "${ZHIZHI_SRC}/deploy/deploy-backend.sh"

if [ -x "${ZHIZHI_SRC}/deploy/healthcheck.sh" ]; then
  bash "${ZHIZHI_SRC}/deploy/healthcheck.sh" || die "健康检查失败"
fi

log "部署完成  http://$(hostname -I 2>/dev/null | awk '{print $1}')/zhiliang/"
