# 智·质 — CentOS 7 香草云部署

目标机：CentOS 7.6 / 4 vCPU / 8GB / 40GB / 5Mbps  
仓库：https://github.com/blise95/zhizhi.git

日常发版（root）：

```bash
zhizhi-sync        # 只拉 GitHub 最新代码（reset --hard，不构建）
zhizhi-frontend    # 只发前端（Nginx 静态资源，不重启 Java）
zhizhi-backend     # 只打 JAR 并重启 Java（不跑 npm）
zhizhi-update      # 上面三步一起做
zhizhi-zhihe       # 启用智合（智谱远程 API，可选）
```

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

**不要在服务器上跑 Ollama / 7B 模型**，8GB 内存不够和 Java、MySQL 共存。

### 启用智合（智谱 API）

主站不依赖智合。要让右下角聊天能回答，用智谱远程接口：

```bash
# 1. 拉最新代码
zhizhi-sync

# 2. 写入 API Key（只做一次）
cp -n /opt/zhizhi/src/deploy/conf/zhihe.env.example /opt/zhizhi/conf/zhihe.env
chmod 600 /opt/zhizhi/conf/zhihe.env
vi /opt/zhizhi/conf/zhihe.env    # 把 ZHIPU_API_KEY 换成智谱控制台的 Key

# 3. 安装 Python 依赖并启动
zhizhi-zhihe
```

Key 在 [智谱开放平台](https://open.bigmodel.cn/) 创建。模型默认 `glm-4-flash`。聊天走 `http://服务器/zhihe/ask`，质量数据由网页随问题提交，不读浏览器。

`zhizhi-zhihe` 会在服务器上解析 `ai-assistant/docs/` 里的两份企业标准 PDF，用智谱 `embedding-2` 生成向量库，写到 `/opt/zhizhi/zhihe-data/vector_store/`。不要在 8GB 机器上跑 Ollama 或本地 Embedding 模型。文档更新后再次执行 `zhizhi-zhihe` 会自动重建；强制重建：

```bash
FORCE_REINDEX=1 zhizhi-zhihe
```

`/health` 里 `vector_store_exists: true` 表示知识库已就绪。

---

## 注意

- CentOS 7 已停止安全更新，防火墙只开 22/80，MySQL/Java 只绑 `127.0.0.1`。
- 首次 `git clone` + `npm ci` 走 5Mbps 会比较慢，属正常。
- 不要把整个开发机目录（含 `node_modules`）用 U 盘/scp 拷上去，用 Git。
- 生产 `sql.init.mode=never`，不会在重启时灌开发种子数据。
