#!/bin/bash
# CentOS 7.6 基础软件：vault yum、JDK 8、git、nginx、firewalld
# 不使用 EPEL（EOL 后 metalink 失效，会把整个 yum 卡死）
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=../common.sh
. "${SCRIPT_DIR}/../common.sh"

require_root

log "关闭失效的 EPEL，避免 yum 无法继续"
shopt -s nullglob
for f in /etc/yum.repos.d/epel*.repo; do
  sed -i -e 's/^enabled=1/enabled=0/' "$f" || true
done
shopt -u nullglob

log "切换 yum 源到 vault.centos.org（CentOS 7 已 EOL）"
for f in /etc/yum.repos.d/CentOS-*.repo; do
  [ -f "$f" ] || continue
  sed -i -e 's/^mirrorlist=/#mirrorlist=/g' \
         -e 's|^#baseurl=http://mirror.centos.org|baseurl=http://vault.centos.org|g' \
         -e 's|^baseurl=http://mirror.centos.org|baseurl=http://vault.centos.org|g' "$f"
done

yum clean all
yum makecache --disablerepo=epel || yum makecache || true

log "安装 JDK 8、git、工具包（禁用 epel）"
yum --disablerepo=epel install -y \
  java-1.8.0-openjdk java-1.8.0-openjdk-devel \
  git wget curl tar gzip unzip firewalld cronie

if ! command -v nginx >/dev/null 2>&1; then
  log "从 nginx.org 安装 Nginx（不走 EPEL）"
  cat > /etc/yum.repos.d/nginx.repo <<'EOF'
[nginx]
name=nginx repo
baseurl=http://nginx.org/packages/centos/7/$basearch/
gpgcheck=0
enabled=1
EOF
  yum --disablerepo=epel install -y nginx
fi

ensure_dirs
systemctl enable firewalld crond >/dev/null 2>&1 || systemctl enable cronie >/dev/null 2>&1 || true
systemctl start firewalld || true
systemctl enable nginx
systemctl start nginx || true

log "bootstrap 完成"
java -version
git --version
nginx -v
