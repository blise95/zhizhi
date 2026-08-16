-- ============================================================
-- 卷包过程质量数智管控一体化平台 - 数据库建表脚本
-- MySQL 8.x
-- ============================================================

CREATE DATABASE IF NOT EXISTS quality_inspection
    DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;

USE quality_inspection;

-- ----------------------------
-- 1. 质检记录主表
-- ----------------------------
CREATE TABLE IF NOT EXISTS inspection_record (
    id              BIGINT          NOT NULL AUTO_INCREMENT  COMMENT '主键',
    date            VARCHAR(10)     NOT NULL                 COMMENT '日期 yyyy-MM-dd',
    shift           VARCHAR(10)     NOT NULL                 COMMENT '班次: 早班/中班/晚班',
    machine_id      VARCHAR(20)     NOT NULL                 COMMENT '机台编号',
    team            VARCHAR(20)     NOT NULL                 COMMENT '班组',
    partner_site    VARCHAR(50)     NULL                     COMMENT '合作生产点',
    brand           VARCHAR(50)     NULL                     COMMENT '牌号',
    sample_time     VARCHAR(10)     NULL                     COMMENT '取样时间',
    sample_ticket_no VARCHAR(50)    NULL                     COMMENT '取样件号',
    -- 烟支内在物测指标已拆分至 physical_measurement 子表

    -- 烟支外观缺陷 ABCD
    cigarette_a     INT             NOT NULL DEFAULT 0,
    cigarette_b     INT             NOT NULL DEFAULT 0,
    cigarette_c     INT             NOT NULL DEFAULT 0,
    cigarette_d     INT             NOT NULL DEFAULT 0,

    -- 盒装外观缺陷 ABCD
    box_small_a     INT             NOT NULL DEFAULT 0,
    box_small_b     INT             NOT NULL DEFAULT 0,
    box_small_c     INT             NOT NULL DEFAULT 0,
    box_small_d     INT             NOT NULL DEFAULT 0,

    -- 条装外观缺陷 ABCD
    carton_a        INT             NOT NULL DEFAULT 0,
    carton_b        INT             NOT NULL DEFAULT 0,
    carton_c        INT             NOT NULL DEFAULT 0,
    carton_d        INT             NOT NULL DEFAULT 0,

    -- 箱装外观缺陷 ABCD（字段名避免 case 关键字）
    case_aa         INT             NOT NULL DEFAULT 0,
    case_ab         INT             NOT NULL DEFAULT 0,
    case_ac         INT             NOT NULL DEFAULT 0,
    case_ad         INT             NOT NULL DEFAULT 0,

    risk_level      VARCHAR(20)     NOT NULL DEFAULT '平稳'  COMMENT '风险等级',
    uploader        VARCHAR(50)     NOT NULL DEFAULT ''      COMMENT '上传人',
    upload_time     VARCHAR(20)     NOT NULL DEFAULT ''      COMMENT '上传时间(精确到秒)',
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    INDEX idx_date (date),
    INDEX idx_risk (risk_level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='质检记录主表';

-- ----------------------------
-- 2. 物测指标子表（1:N 关联质检记录）
-- ----------------------------
CREATE TABLE IF NOT EXISTS physical_measurement (
    id                  BIGINT      NOT NULL AUTO_INCREMENT  COMMENT '主键',
    inspection_id       BIGINT      NOT NULL                 COMMENT '关联质检记录ID',
    seq_no              INT         NOT NULL DEFAULT 1       COMMENT '序号(1/2)',
    measure_time        VARCHAR(10) NULL                     COMMENT '测量时间',
    -- 重量(g)
    weight_x            DOUBLE      NULL                     COMMENT '重量-平均值',
    weight_sd           DOUBLE      NULL                     COMMENT '重量-标准偏差',
    weight_max          DOUBLE      NULL                     COMMENT '重量-最大值',
    weight_min          DOUBLE      NULL                     COMMENT '重量-最小值',
    -- 圆周(mm)
    circumference_x     DOUBLE      NULL                     COMMENT '圆周-平均值',
    circumference_sd    DOUBLE      NULL                     COMMENT '圆周-标准偏差',
    circumference_max   DOUBLE      NULL                     COMMENT '圆周-最大值',
    circumference_min   DOUBLE      NULL                     COMMENT '圆周-最小值',
    -- 吸阻(Pa)
    suction_x           DOUBLE      NULL                     COMMENT '吸阻-平均值',
    suction_sd          DOUBLE      NULL                     COMMENT '吸阻-标准偏差',
    suction_max         DOUBLE      NULL                     COMMENT '吸阻-最大值',
    suction_min         DOUBLE      NULL                     COMMENT '吸阻-最小值',
    -- 通风度/长度
    ventilation_x       DOUBLE      NULL                     COMMENT '通风度-平均值',
    ventilation_sd      DOUBLE      NULL                     COMMENT '通风度-标准偏差',
    ventilation_max     DOUBLE      NULL                     COMMENT '通风度-最大值',
    ventilation_min     DOUBLE      NULL                     COMMENT '通风度-最小值',

    PRIMARY KEY (id),
    INDEX idx_inspection_pm (inspection_id),
    CONSTRAINT fk_pm_inspection FOREIGN KEY (inspection_id)
        REFERENCES inspection_record(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='物测指标子表';

-- ----------------------------
-- 3. 缺陷明细子表（1:N 关联质检记录）
-- ----------------------------
CREATE TABLE IF NOT EXISTS defect_detail (
    id              BIGINT          NOT NULL AUTO_INCREMENT  COMMENT '主键',
    inspection_id   BIGINT          NOT NULL                 COMMENT '关联质检记录ID',
    module          VARCHAR(20)     NOT NULL                 COMMENT '模块: cigarette/boxSmall/carton/case',
    body_part       VARCHAR(50)     NOT NULL                 COMMENT '部位',
    code            VARCHAR(10)     NOT NULL                 COMMENT '缺陷编码',
    name            VARCHAR(100)    NOT NULL                 COMMENT '缺陷名称',
    grade           VARCHAR(2)      NOT NULL                 COMMENT '等级: A/B/C/D',
    count           INT             NOT NULL DEFAULT 1       COMMENT '数量',

    PRIMARY KEY (id),
    INDEX idx_inspection (inspection_id),
    CONSTRAINT fk_defect_inspection FOREIGN KEY (inspection_id)
        REFERENCES inspection_record(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='缺陷明细子表';

-- ----------------------------
-- 4. 预警日志表
-- ----------------------------
CREATE TABLE IF NOT EXISTS warning_log (
    id              BIGINT          NOT NULL AUTO_INCREMENT  COMMENT '主键',
    occur_time      VARCHAR(20)     NOT NULL                 COMMENT '发生时间',
    date            VARCHAR(10)     NOT NULL                 COMMENT '日期',
    team            VARCHAR(20)     NOT NULL                 COMMENT '班组',
    machine_id      VARCHAR(20)     NOT NULL                 COMMENT '机台',
    defect_level    VARCHAR(2)      NOT NULL                 COMMENT '缺陷等级: A/B/C',
    defect_count    INT             NOT NULL DEFAULT 0       COMMENT '缺陷数量',
    description     VARCHAR(500)    NOT NULL                 COMMENT '异常说明',
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    INDEX idx_date (date),
    INDEX idx_level (defect_level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='预警日志表';

-- ----------------------------
-- 5. 系统用户（网页登录，密码为 BCrypt）
-- ----------------------------
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
