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
ZHIPU_API_KEY="$(printf '%s' "${ZHIPU_API_KEY:-}" | tr -d '\r' | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//' -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//")"
ZHIPU_BASE_URL="${ZHIPU_BASE_URL:-https://open.bigmodel.cn/api/paas/v4}"
ZHIPU_BASE_URL="${ZHIPU_BASE_URL%/}"
if [ -z "${ZHIPU_API_KEY:-}" ] || [[ "${ZHIPU_API_KEY}" == *"在这里填"* ]] || [[ "${ZHIPU_API_KEY}" == your-* ]]; then
  die "请在 $ENV_FILE 填入真实的智谱 API Key（ZHIPU_API_KEY）"
fi

log "校验智谱 Embedding API Key"
probe_body="/tmp/zhihe-emb-probe.json"
probe_code="$(
  curl -sS -o "$probe_body" -w '%{http_code}' \
    --connect-timeout 15 --max-time 30 \
    -H "Authorization: Bearer ${ZHIPU_API_KEY}" \
    -H "Content-Type: application/json" \
    -d "{\"model\":\"${ZHIPU_EMBEDDING_MODEL:-embedding-2}\",\"input\":\"ping\"}" \
    "${ZHIPU_BASE_URL}/embeddings" || echo 000
)"
if [ "$probe_code" != "200" ]; then
  die "智谱 Embedding 鉴权失败 HTTP ${probe_code}。请到 https://open.bigmodel.cn/usercenter/apikeys 重新创建 API Key，写入 ${ENV_FILE}（不要加引号或空格）。响应：$(head -c 300 "$probe_body" 2>/dev/null || true)"
fi
log "智谱 API Key 有效"

mkdir -p "${ZHIZHI_LOGS}/zhihe" "${ZHIZHI_HOME}/zhihe-data"

log "创建/更新 Python 虚拟环境 $VENV"
if [ ! -x "${VENV}/bin/python" ]; then
  "$PY_BIN" -m venv "$VENV"
fi
"${VENV}/bin/python" -m pip install -q -U pip setuptools wheel -i "$PIP_MIRROR"
log "安装智合依赖（优先预编译包，tiktoken 固定 0.7.0 以适配 CentOS 7）"
# 独立 Python 的 sysconfig 可能指向 clang；即便回退编译也用 gcc
export CC="${CC:-gcc}"
export CXX="${CXX:-g++}"
if ! "${VENV}/bin/python" -m pip install --prefer-binary --only-binary=tiktoken -r "$REQ" -i "$PIP_MIRROR"; then
  log "清华镜像安装失败，改走官方 PyPI"
  "${VENV}/bin/python" -m pip install --prefer-binary --only-binary=tiktoken -r "$REQ"
fi

DOC_RATING="${DOC_RATING:-${AI_DIR}/docs/卷烟外在质量分级及评级规定.pdf}"
DOC_DEFECT="${DOC_DEFECT:-${AI_DIR}/docs/卷烟外在质量缺陷判定.pdf}"
VECTOR_STORE_PATH="${VECTOR_STORE_PATH:-${ZHIZHI_HOME}/zhihe-data/vector_store}"
KNOWLEDGE_CHUNKS_PATH="${KNOWLEDGE_CHUNKS_PATH:-${ZHIZHI_HOME}/zhihe-data/knowledge_chunks.json}"
export DOC_RATING DOC_DEFECT VECTOR_STORE_PATH KNOWLEDGE_CHUNKS_PATH
export EMBEDDING_PROVIDER="${EMBEDDING_PROVIDER:-zhipu}"
export ZHIPU_EMBEDDING_MODEL="${ZHIPU_EMBEDDING_MODEL:-embedding-2}"
export LLM_PROVIDER="${LLM_PROVIDER:-zhipu}"
export ZHIPU_API_KEY ZHIPU_BASE_URL ZHIPU_CHAT_MODEL

if [ ! -f "$DOC_RATING" ] || [ ! -f "$DOC_DEFECT" ]; then
  die "缺少企业标准 PDF，请确认仓库包含 ai-assistant/docs/ 下两份文件后再执行 zhizhi-zhihe"
fi

INDEX_FILE="${VECTOR_STORE_PATH}/index.json.gz"
need_index=1
if [ "${FORCE_REINDEX:-0}" != "1" ] && [ -f "$INDEX_FILE" ]; then
  need_index=0
  if [ "$DOC_RATING" -nt "$INDEX_FILE" ] || [ "$DOC_DEFECT" -nt "$INDEX_FILE" ]; then
    need_index=1
  fi
fi

if [ "$need_index" = "1" ]; then
  log "构建质量知识向量库（智谱 embedding，写入 $VECTOR_STORE_PATH）"
  mkdir -p "$VECTOR_STORE_PATH"
  (
    cd "$AI_DIR"
    "${VENV}/bin/python" scripts/index_documents.py --require-vector --force
  )
else
  log "向量库已存在且文档未更新，跳过重建（FORCE_REINDEX=1 可强制重建）"
fi

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
