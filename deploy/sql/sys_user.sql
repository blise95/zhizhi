-- 已有库升级：系统登录用户表（应用启动时也会自动建表并写入默认账号）
USE quality_inspection;

CREATE TABLE IF NOT EXISTS sys_user (
    id              BIGINT          NOT NULL AUTO_INCREMENT,
    username        VARCHAR(50)     NOT NULL,
    password_hash   VARCHAR(100)    NOT NULL,
    display_name    VARCHAR(50)     NOT NULL DEFAULT '',
    role            VARCHAR(20)     NOT NULL DEFAULT '用户',
    enabled         TINYINT         NOT NULL DEFAULT 1,
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='系统登录用户';

CREATE TABLE IF NOT EXISTS sys_user_session (
    id              BIGINT          NOT NULL AUTO_INCREMENT,
    token           VARCHAR(64)     NOT NULL,
    user_id         BIGINT          NOT NULL,
    expire_at       DATETIME        NOT NULL,
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_token (token),
    INDEX idx_user (user_id),
    INDEX idx_expire (expire_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='登录会话';
