# 智·质 部署公共变量。由 install.sh / update.sh 调用。

ZHIZHI_HOME="${ZHIZHI_HOME:-/opt/zhizhi}"
ZHIZHI_SRC="${ZHIZHI_SRC:-${ZHIZHI_HOME}/src}"
ZHIZHI_APP="${ZHIZHI_APP:-${ZHIZHI_HOME}/app}"
ZHIZHI_CONF="${ZHIZHI_CONF:-${ZHIZHI_HOME}/conf}"
ZHIZHI_LOGS="${ZHIZHI_LOGS:-${ZHIZHI_HOME}/logs}"
ZHIZHI_BACKUP="${ZHIZHI_BACKUP:-${ZHIZHI_HOME}/backup}"
ZHIZHI_NODE="${ZHIZHI_NODE:-${ZHIZHI_HOME}/node}"
ZHIZHI_MAVEN="${ZHIZHI_MAVEN:-${ZHIZHI_HOME}/apache-maven-3.9.6}"
ZHIZHI_M2="${ZHIZHI_M2:-${ZHIZHI_HOME}/.m2}"
ZHIZHI_WEB="${ZHIZHI_WEB:-${ZHIZHI_HOME}/web}"

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
  mkdir -p "$ZHIZHI_APP" "$ZHIZHI_CONF" "$ZHIZHI_LOGS" "$ZHIZHI_BACKUP" "$ZHIZHI_M2" "$ZHIZHI_WEB"
}

install_cli() {
  # 不要用软链接：脚本会 source 同目录 common.sh，软链接会去 /usr/local/bin 找
  cat > /usr/local/bin/zhizhi-sync <<EOF
#!/bin/bash
exec bash "${ZHIZHI_SRC}/deploy/sync.sh" "\$@"
EOF
  cat > /usr/local/bin/zhizhi-frontend <<EOF
#!/bin/bash
exec bash "${ZHIZHI_SRC}/deploy/deploy-frontend.sh" "\$@"
EOF
  cat > /usr/local/bin/zhizhi-backend <<EOF
#!/bin/bash
exec bash "${ZHIZHI_SRC}/deploy/deploy-backend.sh" "\$@"
EOF
  cat > /usr/local/bin/zhizhi-update <<EOF
#!/bin/bash
exec bash "${ZHIZHI_SRC}/deploy/update.sh" "\$@"
EOF
  chmod +x /usr/local/bin/zhizhi-sync /usr/local/bin/zhizhi-frontend \
           /usr/local/bin/zhizhi-backend /usr/local/bin/zhizhi-update
}

setup_git_ssh() {
  if [ -f "${ZHIZHI_CONF}/deploy_key" ]; then
    chmod 600 "${ZHIZHI_CONF}/deploy_key"
    export GIT_SSH_COMMAND="ssh -i ${ZHIZHI_CONF}/deploy_key -o StrictHostKeyChecking=accept-new"
  fi
}

ensure_maven() {
  # Maven 必须装在 Git 仓库外面，否则 unzip 会改脏 src，导致 git pull 冲突
  local mvn_home="${ZHIZHI_MAVEN}"
  local mvn_bin="${mvn_home}/bin/mvn"
  local zip="${ZHIZHI_SRC}/apache-maven-3.9.6-bin.zip"
  local core_jar
  core_jar=""
  if [ -d "${mvn_home}/lib" ]; then
    core_jar="$(find "${mvn_home}/lib" -maxdepth 1 -name 'maven-core-*.jar' -print 2>/dev/null | head -1 || true)"
  fi

  if [ -z "$core_jar" ]; then
    command -v unzip >/dev/null || yum --disablerepo=epel install -y unzip
    mkdir -p "${ZHIZHI_HOME}"
    if [ -f "$zip" ]; then
      log "解压 Maven 到 ${mvn_home}（不写入 git 目录）"
      unzip -o -q "$zip" -d "${ZHIZHI_HOME}"
    else
      log "仓库无 zip，改为下载 Apache Maven 3.9.6"
      wget -q -O /tmp/apache-maven-3.9.6-bin.zip \
        "https://repo.maven.apache.org/maven2/org/apache/maven/apache-maven/3.9.6/apache-maven-3.9.6-bin.zip"
      unzip -o -q /tmp/apache-maven-3.9.6-bin.zip -d "${ZHIZHI_HOME}"
      rm -f /tmp/apache-maven-3.9.6-bin.zip
    fi
  fi

  [ -f "$mvn_bin" ] || die "未找到 $mvn_bin"
  chmod +x "$mvn_bin" "${mvn_home}/bin/mvnDebug" 2>/dev/null || true
  export PATH="${mvn_home}/bin:${PATH}"
}

setup_path() {
  local javac_bin
  javac_bin="$(command -v javac 2>/dev/null || true)"
  if [ -n "$javac_bin" ]; then
    export JAVA_HOME="${JAVA_HOME:-$(dirname "$(dirname "$(readlink -f "$javac_bin")")")}"
  fi
  if [ -x "${ZHIZHI_NODE}/bin/node" ]; then
    export PATH="${ZHIZHI_NODE}/bin:${PATH}"
  fi
  ensure_maven
  export MAVEN_OPTS="${MAVEN_OPTS:--Xms128m -Xmx512m}"
}
