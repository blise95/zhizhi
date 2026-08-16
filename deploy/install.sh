#!/bin/bash
# 服务器首次安装（只需一次）：
#   git clone https://github.com/blise95/zhizhi.git /opt/zhizhi/src
#   bash /opt/zhizhi/src/deploy/install.sh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=common.sh
. "${SCRIPT_DIR}/common.sh"

require_root

log "======== 智·质 首次安装 ========"

# 如果当前就在 git 仓库里跑，同步到 /opt/zhizhi/src
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
if [ -d "${REPO_ROOT}/.git" ] && [ "${REPO_ROOT}" != "${ZHIZHI_SRC}" ]; then
  log "当前仓库在 ${REPO_ROOT}，将克隆/更新到 ${ZHIZHI_SRC}"
  mkdir -p "$(dirname "${ZHIZHI_SRC}")"
  if [ ! -d "${ZHIZHI_SRC}/.git" ]; then
    git clone --branch "${ZHIZHI_BRANCH}" "${REPO_ROOT}" "${ZHIZHI_SRC}" || \
      git clone --branch "${ZHIZHI_BRANCH}" "${ZHIZHI_REPO}" "${ZHIZHI_SRC}"
  fi
elif [ ! -d "${ZHIZHI_SRC}/.git" ]; then
  mkdir -p "$(dirname "${ZHIZHI_SRC}")"
  git clone --branch "${ZHIZHI_BRANCH}" "${ZHIZHI_REPO}" "${ZHIZHI_SRC}"
fi

cd "${ZHIZHI_SRC}"

bash "${ZHIZHI_SRC}/deploy/centos7/bootstrap.sh"
bash "${ZHIZHI_SRC}/deploy/centos7/install-node.sh"
bash "${ZHIZHI_SRC}/deploy/centos7/install-mysql.sh"

log "安装 Nginx 配置"
rm -f /etc/nginx/conf.d/default.conf
cp -f "${ZHIZHI_SRC}/deploy/nginx/zhizhi.conf" /etc/nginx/conf.d/zhizhi.conf
if ! nginx -t; then
  log "nginx -t 失败，尝试注释自带 default server"
  sed -i 's/listen       80 default_server/#listen       80 default_server/' /etc/nginx/nginx.conf || true
  nginx -t
fi
systemctl enable nginx
systemctl start nginx || systemctl restart nginx
systemctl is-active --quiet nginx || log "WARN: nginx 未处于 active，请稍后 systemctl status nginx"

log "安装 systemd 服务"
cp -f "${ZHIZHI_SRC}/deploy/systemd/zhizhi-api.service" /etc/systemd/system/zhizhi-api.service
systemctl daemon-reload
systemctl enable zhizhi-api

log "安装 logrotate / 备份 cron"
cp -f "${ZHIZHI_SRC}/deploy/logrotate/zhizhi" /etc/logrotate.d/zhizhi
echo "15 3 * * * root /bin/bash ${ZHIZHI_SRC}/deploy/backup-mysql.sh" > /etc/cron.d/zhizhi-backup
chmod 644 /etc/cron.d/zhizhi-backup

log "防火墙：只放行 22/80"
if systemctl is-active --quiet firewalld; then
  firewall-cmd --permanent --add-service=ssh || true
  firewall-cmd --permanent --add-service=http || true
  firewall-cmd --permanent --remove-service=mysql || true
  firewall-cmd --reload || true
fi

ln -sfn "${ZHIZHI_SRC}/deploy/update.sh" /usr/local/bin/zhizhi-update
chmod +x "${ZHIZHI_SRC}/deploy/update.sh" \
         "${ZHIZHI_SRC}/deploy/healthcheck.sh" \
         "${ZHIZHI_SRC}/deploy/backup-mysql.sh" \
         "${ZHIZHI_SRC}/deploy/centos7/"*.sh

log "首次构建并启动"
bash "${ZHIZHI_SRC}/deploy/update.sh" --no-sync
systemctl start zhizhi-api

log "======== 安装完成 ========"
log "以后每次发版只需一行："
log "  zhizhi-update"
log "访问： http://服务器IP/zhiliang/"
