# 智·质 部署公共变量。由 install.sh / update.sh 调用。

ZHIZHI_HOME="${ZHIZHI_HOME:-/opt/zhizhi}"
ZHIZHI_SRC="${ZHIZHI_SRC:-${ZHIZHI_HOME}/src}"
ZHIZHI_APP="${ZHIZHI_APP:-${ZHIZHI_HOME}/app}"
ZHIZHI_CONF="${ZHIZHI_CONF:-${ZHIZHI_HOME}/conf}"
ZHIZHI_LOGS="${ZHIZHI_LOGS:-${ZHIZHI_HOME}/logs}"
ZHIZHI_BACKUP="${ZHIZHI_BACKUP:-${ZHIZHI_HOME}/backup}"
ZHIZHI_NODE="${ZHIZHI_NODE:-${ZHIZHI_HOME}/node}"
ZHIZHI_M2="${ZHIZHI_M2:-${ZHIZHI_HOME}/.m2}"

ZHIZHI_REPO="${ZHIZHI_REPO:-https://github.com/blise95/zhizhi.git}"
ZHIZHI_BRANCH="${ZHIZHI_BRANCH:-main}"
ZHIZHI_JAR_NAME="${ZHIZHI_JAR_NAME:-quality-inspection.jar}"
ZHIZHI_ARTIFACT="${ZHIZHI_ARTIFACT:-quality-inspection-1.0.0.jar}"

NODE_VERSION="${NODE_VERSION:-20.19.0}"
NODE_FALLBACK_VERSION="${NODE_FALLBACK_VERSION:-20.18.2}"

log() { echo "[zhizhi] $*"; }
die() { echo "[zhizhi] ERROR: $*" >&2; exit 1; }

require_root() {
  if [ "$(id -u)" -ne 0 ]; then
    die "请用 root 执行（sudo -i 后再跑）"
  fi
}

ensure_dirs() {
  mkdir -p "$ZHIZHI_APP" "$ZHIZHI_CONF" "$ZHIZHI_LOGS" "$ZHIZHI_BACKUP" "$ZHIZHI_M2"
}

setup_path() {
  export JAVA_HOME="${JAVA_HOME:-$(dirname "$(dirname "$(readlink -f "$(command -v javac)" 2>/dev/null)" 2>/dev/null)" 2>/dev/null)}"
  if [ -x "${ZHIZHI_NODE}/bin/node" ]; then
    export PATH="${ZHIZHI_NODE}/bin:${PATH}"
  fi
  if [ -x "${ZHIZHI_SRC}/apache-maven-3.9.6/bin/mvn" ]; then
    chmod +x "${ZHIZHI_SRC}/apache-maven-3.9.6/bin/mvn" "${ZHIZHI_SRC}/apache-maven-3.9.6/bin/mvnDebug" 2>/dev/null || true
    export PATH="${ZHIZHI_SRC}/apache-maven-3.9.6/bin:${PATH}"
  fi
  export MAVEN_OPTS="${MAVEN_OPTS:--Xms128m -Xmx512m}"
}
