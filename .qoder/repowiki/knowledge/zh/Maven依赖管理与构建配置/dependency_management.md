## 1. 核心系统与工具
本项目采用 **Apache Maven** 作为标准的依赖管理和构建工具。通过继承 `spring-boot-starter-parent` (版本 2.7.18) 来统一管理 Spring Boot 生态及相关第三方库的版本，确保了依赖的兼容性和稳定性。

## 2. 关键文件与配置
- **`pom.xml`**: 项目的核心依赖描述文件。
  - **坐标信息**: `com.zjzy:quality-inspection:1.0.0`。
  - **核心依赖**:
    - `spring-boot-starter-web`: 提供 Web 服务支持。
    - `commons-math3` (3.6.1): 用于实现 SPC 统计分析及 Holt 时序预测算法。
    - `gson` (2.10.1): 处理 JSON 数据的序列化与反序列化。
    - `spring-boot-devtools`: 开发环境下的热部署支持（运行时可选）。
  - **构建插件**: 使用 `spring-boot-maven-plugin` 进行可执行 JAR 包的打包。
- **`.mvn/wrapper/maven-wrapper.properties`**: 配置了 Maven Wrapper，指定了 Maven 发行版 (3.9.6) 和 Wrapper Jar 的下载地址，确保在不同环境下构建的一致性。
- **`run.bat`**: Windows 环境下的启动脚本，集成了 Java 环境检查并调用 `mvnw.cmd` 自动下载依赖并启动应用，降低了环境配置门槛。

## 3. 架构与约定
- **单体架构依赖管理**: 作为一个基于 Spring Boot 的单体应用，所有依赖均声明在根目录的 `pom.xml` 中，没有多模块（Multi-module）的复杂依赖关系。
- **版本锁定策略**: 通过 Spring Boot Parent POM 隐式管理大部分依赖版本，仅对非 Spring 生态的库（如 `commons-math3` 和 `gson`）显式声明版本号，遵循了“约定优于配置”的原则。
- **环境隔离**: 利用 Maven 的 `scope` 属性（如 `runtime`, `test`）区分开发、运行和测试阶段的依赖，避免将不必要的库打入生产包中。

## 4. 开发者规范
- **新增依赖**: 应在 `pom.xml` 的 `<dependencies>` 节点中添加，优先查找 Spring Boot Parent 是否已管理版本，若未管理则需显式指定稳定版本号。
- **构建方式**: 推荐使用项目自带的 Maven Wrapper (`mvnw.cmd` 或 `./mvnw`) 进行构建，以确保使用统一的 Maven 版本（3.9.6）。
- **环境要求**: 必须安装 JDK 1.8，并通过 `JAVA_HOME` 环境变量正确配置。