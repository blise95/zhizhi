-- 已有库升级：系统登录用户表（密码明文）
USE quality_inspection;

CREATE TABLE IF NOT EXISTS sys_user (
    id              BIGINT          NOT NULL AUTO_INCREMENT,
    username        VARCHAR(50)     NOT NULL,
    password        VARCHAR(100)    NOT NULL,
    display_name    VARCHAR(50)     NOT NULL DEFAULT '',
    role            VARCHAR(20)     NOT NULL DEFAULT '用户',
    enabled         TINYINT         NOT NULL DEFAULT 1,
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='系统登录用户';

-- 旧列 password_hash 迁成明文列（没有该列时忽略报错）
-- ALTER TABLE sys_user CHANGE COLUMN password_hash password VARCHAR(100) NOT NULL;

INSERT INTO sys_user (username, password, display_name, role, enabled)
SELECT 'chenyu', 'chenyu312', '陈宇', '管理员', 1
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM sys_user WHERE username = 'chenyu');

UPDATE sys_user SET password = 'chenyu312' WHERE username = 'chenyu' AND password LIKE '$2%';

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
