#!/bin/bash
# 启用智合（智谱远程 API）。不要在本机跑 Ollama。
# 用法：zhizhi-zhihe
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$(readlink -f "$0")")" && pwd)"
# shellcheck source=common.sh
. "${SCRIPT_DIR}/common.sh"

require_root
ensure_dirs
install_cli

ENV_FILE="${ZHIZHI_CONF}/zhihe.env"
VENV="${ZHIZHI_HOME}/zhihe-venv"
AI_DIR="${ZHIZHI_SRC}/ai-assistant"
REQ="${AI_DIR}/requirements-prod.txt"
PIP_MIRROR="${PIP_MIRROR:-https://pypi.tuna.tsinghua.edu.cn/simple}"

bash "${SCRIPT_DIR}/centos7/install-python.sh"
PY_BIN="${ZHIZHI_PYTHON}/bin/python3"
[ -x "$PY_BIN" ] || die "未找到 $PY_BIN"

if [ ! -f "$ENV_FILE" ]; then
  cp -f "${SCRIPT_DIR}/conf/zhihe.env.example" "$ENV_FILE"
  chmod 600 "$ENV_FILE"
  die "请先编辑 $ENV_FILE ，填入智谱 ZHIPU_API_KEY 后再执行 zhizhi-zhihe"
fi

# shellcheck disable=SC1090
. "$ENV_FILE"
if [ -z "${ZHIPU_API_KEY:-}" ] || [[ "${ZHIPU_API_KEY}" == *"在这里填"* ]] || [[ "${ZHIPU_API_KEY}" == your-* ]]; then
  die "请在 $ENV_FILE 填入真实的智谱 API Key（ZHIPU_API_KEY）"
fi

mkdir -p "${ZHIZHI_LOGS}/zhihe" "${ZHIZHI_HOME}/zhihe-data"

log "创建/更新 Python 虚拟环境 $VENV"
if [ ! -x "${VENV}/bin/python" ]; then
  "$PY_BIN" -m venv "$VENV"
fi
"${VENV}/bin/python" -m pip install -q -U pip -i "$PIP_MIRROR"
log "安装智合依赖（走清华 PyPI 镜像）"
"${VENV}/bin/python" -m pip install -q -r "$REQ" -i "$PIP_MIRROR"

log "安装 systemd 服务"
cp -f "${SCRIPT_DIR}/systemd/zhizhi-zhihe.service" /etc/systemd/system/zhizhi-zhihe.service
systemctl daemon-reload
systemctl enable zhizhi-zhihe
systemctl restart zhizhi-zhihe

ok=0
for i in $(seq 1 30); do
  code="$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8000/health || echo 000)"
  if [ "$code" = "200" ]; then
    ok=1
    break
  fi
  sleep 1
done
if [ "$ok" != "1" ]; then
  journalctl -u zhizhi-zhihe -n 60 --no-pager || true
  die "智合启动失败，请看上面日志。常见原因：API Key 无效、出网被拦"
fi

log "智合已启动  http://127.0.0.1:8000/health  （对外路径 /zhihe/ask）"
curl -s http://127.0.0.1:8000/health || true
echo
