## 1. 使用的系统与方式
- 框架：Spring Boot 2.7.x（`spring-boot-starter-web`），默认自带 SLF4J + Logback，但代码中未显式使用任何日志门面或实现。
- 实际做法：全项目未见 `org.slf4j.Logger`、`java.util.logging` 或 `ch.qos.logback` 的导入与调用；运行期日志主要依赖 Spring Boot 默认控制台输出，应用自身通过 `System.out.println` / `System.err.println` 输出少量信息。
- 结构化/落盘：无结构化日志字段规范，无自定义日志格式、无日志文件 Sink 配置；“预警日志”以业务数据形式写入 JSON 文件（`data/warning_log.json`），不属于技术层面的日志系统。

## 2. 关键文件与位置
- `src/main/resources/application.yml`：仅配置了日志级别策略（见下）。
- `src/main/java/com/zjzy/quality/util/JsonDataStore.java`：使用 `System.out.println` 输出初始化信息，使用 `System.err.println` 输出加载/保存异常提示。
- `pom.xml`：依赖中未引入额外日志框架，依赖 Spring Boot 父 POM 提供的默认日志栈（SLF4J + Logback）。

## 3. 架构与约定（现状）
- 日志级别策略（在 `application.yml` 中）：
  - `com.zjzy.quality: INFO`
  - `org.springframework: WARN`
- 输出通道：默认控制台（Spring Boot 默认行为）；未配置文件追加器、滚动策略、JSON 布局等。
- 应用内日志产生方式：仅在数据层工具类中使用标准输出/错误流打印启动与异常摘要，其余业务代码（Controller/Service）未产生日志。
- “预警日志”是业务实体持久化（`WarningLog` → JSON 文件），并非日志系统的日志记录；不应混同为技术日志方案。

## 4. 开发者应遵循的规则与建议
- 若需新增日志：
  - 优先使用 SLF4J 门面（例如 `org.slf4j.LoggerFactory.getLogger(...)`），避免直接使用 `System.out/err`。
  - 保持现有级别策略：业务包 `com.zjzy.quality` 使用 `INFO` 及以上，第三方框架噪声用 `WARN` 抑制。
- 日志内容建议：
  - 关键路径（数据加载、预警判定、接口入口/出口）记录 INFO 级摘要。
  - 异常与失败场景记录 ERROR 级并携带上下文（日期、班组、机台、缺陷等级等）。
- 如需落盘或结构化：
  - 在 `application.yml` 中扩展 `logging.file.name` 或 Logback 配置，增加文件 Sink 与滚动策略。
  - 如需结构化，可引入 JSON layout（如 logback-json-classic）并统一关键字段（traceId、userId、machineId、defectLevel 等）。
- 注意区分：业务“预警日志”（JSON 文件）与技术日志（SLF4J/Logback）是两条不同链路，避免将业务数据写入技术日志造成重复或泄露敏感信息。