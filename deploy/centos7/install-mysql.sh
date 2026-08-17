#!/bin/bash
# 安装 MySQL 8 或回退 MariaDB 10.5；库只监听 127.0.0.1；innodb_buffer_pool ≤ 512M
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$(readlink -f "$0")")" && pwd)"
# shellcheck source=../common.sh
. "${SCRIPT_DIR}/../common.sh"

require_root

ENV_FILE="${ZHIZHI_CONF}/zhizhi.env"
ensure_dirs

detect_mysql_cli() {
  if command -v mysql >/dev/null 2>&1; then
    command -v mysql
    return
  fi
  return 1
}

write_memory_cnf() {
  local cnf_dir="$1"
  mkdir -p "$cnf_dir"
  cat > "${cnf_dir}/zz-zhizhi.cnf" <<'EOF'
[mysqld]
bind-address = 127.0.0.1
innodb_buffer_pool_size = 256M
max_connections = 50
skip-name-resolve
character-set-server = utf8mb4
collation-server = utf8mb4_general_ci
EOF
}

if detect_mysql_cli >/dev/null; then
  log "已检测到 mysql 客户端，跳过安装"
else
  log "尝试安装 MySQL 8 Community"
  if wget -q -O /tmp/mysql80.rpm https://dev.mysql.com/get/mysql80-community-release-el7-11.noarch.rpm \
     && yum localinstall -y /tmp/mysql80.rpm \
     && yum install -y mysql-community-server; then
    write_memory_cnf /etc/my.cnf.d
    systemctl enable mysqld
    systemctl start mysqld
  else
    log "MySQL 8 安装失败，回退 MariaDB 10.5"
    cat > /etc/yum.repos.d/MariaDB.repo <<'EOF'
[mariadb]
name = MariaDB
baseurl = https://archive.mariadb.org/mariadb-10.5/yum/centos7-amd64
gpgcheck = 0
enabled = 1
EOF
    yum install -y MariaDB-server MariaDB-client
    write_memory_cnf /etc/my.cnf.d
    systemctl enable mariadb
    systemctl start mariadb
  fi
fi

systemctl enable mysqld >/dev/null 2>&1 || systemctl enable mariadb >/dev/null 2>&1 || true
systemctl start mysqld >/dev/null 2>&1 || systemctl start mariadb >/dev/null 2>&1 || true

MYSQL_CLI="$(detect_mysql_cli)" || die "mysql 客户端不可用"

if [ ! -f "$ENV_FILE" ]; then
  # MySQL 8 validate_password=MEDIUM：大小写+数字+特殊字符；避免 # 以免 env 被截断
  DB_PASS="Aa1!$(openssl rand -base64 12 | tr -d '/+=#' | cut -c1-12)"
  cat > "$ENV_FILE" <<EOF
SPRING_PROFILES_ACTIVE=prod
ZHIZHI_DB_URL=jdbc:mysql://127.0.0.1:3306/quality_inspection?useUnicode=true&characterEncoding=utf-8&serverTimezone=Asia/Dubai&allowPublicKeyRetrieval=true&useSSL=false
ZHIZHI_DB_USER=zhizhi
ZHIZHI_DB_PASSWORD=${DB_PASS}
ZHIZHI_LOG_FILE=/opt/zhizhi/logs/zhizhi-api.log
EOF
  chmod 600 "$ENV_FILE"
  log "已生成 ${ENV_FILE}（权限 600）"
else
  # shellcheck disable=SC1090
  . "$ENV_FILE"
  DB_PASS="${ZHIZHI_DB_PASSWORD}"
fi

# shellcheck disable=SC1090
. "$ENV_FILE"

log "创建数据库用户（若已存在则忽略错误）"
mysql --protocol=socket -uroot <<SQL || mysql -uroot -e "SELECT 1" >/dev/null 2>&1 || true
CREATE DATABASE IF NOT EXISTS quality_inspection DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
CREATE USER IF NOT EXISTS 'zhizhi'@'localhost' IDENTIFIED BY '${ZHIZHI_DB_PASSWORD}';
GRANT ALL PRIVILEGES ON quality_inspection.* TO 'zhizhi'@'localhost';
FLUSH PRIVILEGES;
SQL

# MySQL 8 首次 root 可能有临时密码；MariaDB 默认空密码。再试一次 socket。
if ! mysql --protocol=socket -uroot -e "SELECT 1" >/dev/null 2>&1; then
  log "root 免密失败。若是 MySQL 8，请用 grep 'temporary password' /var/log/mysqld.log 取出临时密码，手动改密后再跑："
  log "  mysql -uroot -p -e \"ALTER USER 'root'@'localhost' IDENTIFIED BY '你的root密码';\""
  log "然后： mysql -uroot -p < ${ZHIZHI_SRC}/src/main/resources/schema.sql"
else
  mysql --protocol=socket -uroot < "${ZHIZHI_SRC}/src/main/resources/schema.sql" || true
fi

log "MySQL/MariaDB 准备完成"
