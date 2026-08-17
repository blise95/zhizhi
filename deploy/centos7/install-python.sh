#!/bin/bash
# 为智合安装 Python 3.11（CentOS 7 glibc 2.17 可用的独立构建）
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$(readlink -f "$0")")" && pwd)"
# shellcheck source=../common.sh
. "${SCRIPT_DIR}/../common.sh"

require_root
ensure_dirs

PY_HOME="${ZHIZHI_PYTHON}"
PY_BIN="${PY_HOME}/bin/python3"

python_ok() {
  local bin="$1"
  [ -x "$bin" ] || return 1
  "$bin" - <<'PY'
import sys
raise SystemExit(0 if sys.version_info >= (3, 9) else 1)
PY
}

if python_ok "$PY_BIN"; then
  log "已有 Python：$($PY_BIN -V)"
  exit 0
fi

for cand in python3.11 python3.10 python3.9; do
  if command -v "$cand" >/dev/null 2>&1 && python_ok "$(command -v "$cand")"; then
    log "使用系统 $($cand -V)"
    mkdir -p "${PY_HOME}/bin"
    ln -sfn "$(command -v "$cand")" "$PY_BIN"
    exit 0
  fi
done

VER="3.11.10"
TAG="20241016"
FILE="cpython-${VER}+${TAG}-x86_64-unknown-linux-gnu-install_only.tar.gz"
URLS=(
  "https://github.com/astral-sh/python-build-standalone/releases/download/${TAG}/${FILE}"
  "https://ghfast.top/https://github.com/astral-sh/python-build-standalone/releases/download/${TAG}/${FILE}"
)

mkdir -p /tmp
TAR="/tmp/${FILE}"
ok=0
for u in "${URLS[@]}"; do
  log "下载 Python ${VER}：$u"
  if wget -q -O "$TAR" "$u"; then
    ok=1
    break
  fi
done
[ "$ok" = "1" ] || die "下载 Python 失败，请检查服务器出网后重试"

rm -rf "${PY_HOME}.tmp"
mkdir -p "${PY_HOME}.tmp"
tar -xzf "$TAR" -C "${PY_HOME}.tmp"
if [ -d "${PY_HOME}.tmp/python" ]; then
  rm -rf "$PY_HOME"
  mv "${PY_HOME}.tmp/python" "$PY_HOME"
else
  rm -rf "$PY_HOME"
  mv "${PY_HOME}.tmp" "$PY_HOME"
fi
rm -rf "${PY_HOME}.tmp" "$TAR"

python_ok "$PY_BIN" || die "安装后的 Python 不可用：$PY_BIN"
log "Python 已安装：$($PY_BIN -V)  -> $PY_BIN"
