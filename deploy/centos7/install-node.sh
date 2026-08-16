#!/bin/bash
# CentOS 7 glibc 2.17 无法直接用官方 Node 20。安装 unofficial-builds glibc-217 包。
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=../common.sh
. "${SCRIPT_DIR}/../common.sh"

require_root
ensure_dirs

install_node() {
  local ver="$1"
  local name="node-v${ver}-linux-x64-glibc-217"
  local url="https://unofficial-builds.nodejs.org/download/release/v${ver}/${name}.tar.gz"
  local tmp="/tmp/${name}.tar.gz"

  log "下载 Node ${ver} (glibc-217): $url"
  if ! wget -q -O "$tmp" "$url"; then
    return 1
  fi
  rm -rf "${ZHIZHI_NODE}"
  mkdir -p "${ZHIZHI_HOME}"
  tar -xzf "$tmp" -C "${ZHIZHI_HOME}"
  mv "${ZHIZHI_HOME}/${name}" "${ZHIZHI_NODE}"
  rm -f "$tmp"
  "${ZHIZHI_NODE}/bin/node" -v
}

if [ -x "${ZHIZHI_NODE}/bin/node" ]; then
  log "已存在 ${ZHIZHI_NODE}/bin/node = $("${ZHIZHI_NODE}/bin/node" -v)"
  exit 0
fi

if ! install_node "${NODE_VERSION}"; then
  log "主版本 ${NODE_VERSION} 不可用，尝试 ${NODE_FALLBACK_VERSION}"
  install_node "${NODE_FALLBACK_VERSION}" || die "无法下载 Node glibc-217 构建，请检查外网"
fi

log "Node 安装完成"
