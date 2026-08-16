#!/bin/bash
# CentOS 7.6 基础软件：vault yum、JDK 8、git、nginx、firewalld
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=../common.sh
. "${SCRIPT_DIR}/../common.sh"

require_root

log "切换 yum 源到 vault.centos.org（CentOS 7 已 EOL）"
for f in /etc/yum.repos.d/CentOS-*.repo; do
  [ -f "$f" ] || continue
  sed -i -e 's/^mirrorlist=/#mirrorlist=/g' \
         -e 's|^#baseurl=http://mirror.centos.org|baseurl=http://vault.centos.org|g' \
         -e 's|^baseurl=http://mirror.centos.org|baseurl=http://vault.centos.org|g' "$f"
done

yum clean all
yum makecache || true

log "安装 JDK 8、git、nginx、工具包"
yum install -y java-1.8.0-openjdk java-1.8.0-openjdk-devel git wget curl tar gzip unzip \
  firewalld cronie || yum install -y epel-release || true

if ! command -v nginx >/dev/null 2>&1; then
  yum install -y epel-release || true
  if [ -f /etc/yum.repos.d/epel.repo ]; then
    sed -i -e 's/^metalink=/#metalink=/g' \
           -e 's|^#baseurl=https://download.fedoraproject.org/pub/epel|baseurl=https://archives.fedoraproject.org/pub/archive/epel|g' \
           /etc/yum.repos.d/epel.repo || true
  fi
  yum install -y nginx
fi

ensure_dirs
systemctl enable firewalld cronie >/dev/null 2>&1 || true
systemctl start firewalld || true
systemctl enable nginx
systemctl start nginx || true

log "bootstrap 完成"
java -version
git --version
nginx -v
