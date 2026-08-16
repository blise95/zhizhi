#!/bin/bash
# 只拉 GitHub 最新代码，不构建、不重启。
# 用法：zhizhi-sync
#    或：bash /opt/zhizhi/src/deploy/sync.sh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$(readlink -f "$0")")" && pwd)"
# shellcheck source=common.sh
. "${SCRIPT_DIR}/common.sh"

require_root
ensure_dirs
install_cli
setup_git_ssh

if [ ! -d "${ZHIZHI_SRC}/.git" ]; then
  die "未找到仓库 ${ZHIZHI_SRC}。请先执行：bash deploy/install.sh"
fi

log "拉取 ${ZHIZHI_BRANCH}（以 GitHub 为准，丢弃服务器本地改动）..."
cd "${ZHIZHI_SRC}"
git merge --abort >/dev/null 2>&1 || true
git rebase --abort >/dev/null 2>&1 || true
git fetch origin
# 不要 git pull：有冲突/未合并文件时会失败
git reset --hard "origin/${ZHIZHI_BRANCH}"
git checkout -B "${ZHIZHI_BRANCH}" "origin/${ZHIZHI_BRANCH}" >/dev/null
git log -1 --oneline
git status -sb
log "代码已对齐 origin/${ZHIZHI_BRANCH}"
log "接下来按需执行：zhizhi-frontend  和/或  zhizhi-backend"
