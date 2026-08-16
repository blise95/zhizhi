# 智·质 — CentOS 7 香草云部署

目标机：CentOS 7.6 / 4 vCPU / 8GB / 40GB / 5Mbps  
仓库：https://github.com/blise95/zhizhi.git

日常发版**只需要一行**：

```bash
zhizhi-update
```

它会：`git pull` → 构建 React → `mvn -Pprod package` → 替换 JAR → 重启 → 健康检查。

---

## 第一次（只做一次）

用 root：

```bash
# 1. 如 yum 报 mirror 错，先不用管，install 脚本会切 vault
yum install -y git
mkdir -p /opt/zhizhi
git clone https://github.com/blise95/zhizhi.git /opt/zhizhi/src
bash /opt/zhizhi/src/deploy/install.sh
```

若仓库是私有的，先把部署密钥放到 `/opt/zhizhi/conf/deploy_key`（chmod 600），再把 clone 地址改成 SSH：

```bash
git clone git@github.com:blise95/zhizhi.git /opt/zhizhi/src
```

装完后浏览器打开：`http://服务器IP/zhiliang/`

数据库密码在 `/opt/zhizhi/conf/zhizhi.env`（权限 600，不要提交到 Git）。

---

## 以后每次改代码

在本机把功能推到 GitHub `main`，然后 SSH 到服务器：

```bash
zhizhi-update
```

回滚上一版 JAR：

```bash
cp -f /opt/zhizhi/app/quality-inspection.jar.bak /opt/zhizhi/app/quality-inspection.jar
systemctl restart zhizhi-api
```

---

## 目录

| 路径 | 用途 |
|------|------|
| `/opt/zhizhi/src` | Git 工作副本 |
| `/opt/zhizhi/app/quality-inspection.jar` | 正在运行的包 |
| `/opt/zhizhi/conf/zhizhi.env` | 数据库密码等 |
| `/opt/zhizhi/logs` | 应用日志 |
| `/opt/zhizhi/backup` | MySQL 每日备份（保留 7 份） |
| `/opt/zhizhi/node` | 适配 CentOS 7 glibc 的 Node 20 |

---

## 为什么服务器上能编前端

CentOS 7 的 glibc 太旧，官方 Node 20 跑不起来。安装脚本会下载 [unofficial-builds](https://unofficial-builds.nodejs.org/) 的 `linux-x64-glibc-217`。Maven 解压到 **`/opt/zhizhi/apache-maven-3.9.6`**，不要解压进 git 目录，否则 `git pull` 会冲突。

**不要在服务器上跑 Ollama / 7B 模型**，8GB 内存不够和 Java、MySQL 共存。智合默认不上；聊天失败不影响主站。

---

## 注意

- CentOS 7 已停止安全更新，防火墙只开 22/80，MySQL/Java 只绑 `127.0.0.1`。
- 首次 `git clone` + `npm ci` 走 5Mbps 会比较慢，属正常。
- 不要把整个开发机目录（含 `node_modules`）用 U 盘/scp 拷上去，用 Git。
- 生产 `sql.init.mode=never`，不会在重启时灌开发种子数据。
