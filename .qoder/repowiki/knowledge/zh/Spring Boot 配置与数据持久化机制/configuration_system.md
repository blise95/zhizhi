## 1. 系统与方法
本项目采用 **Spring Boot** 框架的标准配置体系，结合 **YAML** 格式进行应用级参数管理。数据存储层面未使用传统关系型数据库，而是通过自定义的 **JSON 文件持久化方案**（`JsonDataStore`）实现轻量级数据管理，支持 Mock 数据自动生成与历史数据加载。

## 2. 核心文件与包
- **`src/main/resources/application.yml`**: 全局配置文件，定义了服务器端口、上下文路径、静态资源映射及日志级别。
- **`pom.xml`**: Maven 依赖管理文件，指定了 Spring Boot 版本（2.7.18）、JDK 版本（1.8）以及核心依赖（Web, Gson, Commons Math3）。
- **`src/main/java/com/zjzy/quality/util/JsonDataStore.java`**: 核心数据工具类，负责 JSON 文件的读写、内存缓存管理及 ID 自增生成。
- **`src/main/java/com/zjzy/quality/QualityApplication.java`**: 应用启动入口，在 Spring 容器初始化前调用 `JsonDataStore.init()` 完成数据预热。

## 3. 架构与约定
- **配置分层**：遵循 Spring Boot 约定，使用 `application.yml` 管理基础设施配置（如 `server.port: 8080`）。静态资源通过 `spring.mvc.static-path-pattern` 映射至 `/static/**`。
- **文件化存储架构**：
  - 数据目录位于项目根目录下的 `data/` 文件夹。
  - 质检记录保存为 `inspection_data.json`，预警日志保存为 `warning_log.json`。
  - 采用 **内存缓存 + 磁盘同步** 模式：所有读写操作先在 `List` 缓存中执行，随后异步或同步写入 JSON 文件，确保读取性能。
- **Mock 数据机制**：若启动时检测到数据文件不存在或为空，`JsonDataStore` 会自动生成 30 条模拟卷烟质检数据，便于系统演示与功能验证。

## 4. 开发者规则
- **配置修改**：如需更改服务端口或日志级别，直接编辑 `application.yml`。新增配置项应遵循 YAML 缩进规范。
- **数据迁移注意**：当前 `JsonDataStore` 硬编码了文件路径（基于 `user.dir`）。若需迁移至 MySQL，需重构该工具类并引入 `spring-boot-starter-data-jpa` 或 MyBatis。
- **并发安全**：`JsonDataStore` 中的关键方法已使用 `synchronized` 关键字保护，开发者在扩展新功能时应保持线程安全意识，避免直接操作底层 `cache` 列表。
- **环境兼容性**：项目针对 JDK 1.8 优化，打包时使用 `spring-boot-maven-plugin`，确保生成的 JAR 包包含所有依赖。