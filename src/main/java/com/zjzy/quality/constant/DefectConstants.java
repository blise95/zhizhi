package com.zjzy.quality.constant;

/**
 * 缺陷分级阈值与物测指标常量
 * ★★★ 修改下方数值即可调整内控限，无需改动其他代码 ★★★
 */
public class DefectConstants {

    // ==================== 缺陷分级触发阈值 ====================

    /** A类触发阈值：任意层级A类缺陷>=1即触发高风险预警 */
    public static final int A_TRIGGER = 1;

    /** B类触发阈值：所有层级B类缺陷合计>=3触发中度预警 */
    public static final int B_TRIGGER = 3;

    /** C类连续班次数：连续N班次C类总数严格递增则触发一般预警 */
    public static final int C_CONSECUTIVE = 3;

    // ==================== 物测指标内控标准 ====================
    // ★★★ 按车间内控标准修改下方数值 ★★★

    /** 吸阻(Pa) - 中心线 */
    public static final double SUCTION_CENTER = 1150.0;
    /** 吸阻(Pa) - 上控制限UCL */
    public static final double SUCTION_UCL = 1350.0;
    /** 吸阻(Pa) - 下控制限LCL */
    public static final double SUCTION_LCL = 950.0;

    /** 单支重量(g) - 中心线 */
    public static final double WEIGHT_CENTER = 0.850;
    /** 单支重量(g) - 上控制限UCL */
    public static final double WEIGHT_UCL = 0.920;
    /** 单支重量(g) - 下控制限LCL */
    public static final double WEIGHT_LCL = 0.780;

    /** 圆周(mm) - 中心线 */
    public static final double CIRCUM_CENTER = 24.20;
    /** 圆周(mm) - 上控制限UCL */
    public static final double CIRCUM_UCL = 24.40;
    /** 圆周(mm) - 下控制限LCL */
    public static final double CIRCUM_LCL = 24.00;

    /** 通风度/长度 - 中心线 */
    public static final double VENTILATION_CENTER = 50.0;
    /** 通风度/长度 - 上控制限UCL */
    public static final double VENTILATION_UCL = 70.0;
    /** 通风度/长度 - 下控制限LCL */
    public static final double VENTILATION_LCL = 30.0;

    // ==================== 预警配色（乔布斯风格Apple色系） ====================

    /** A类-严重缺陷：Apple红 */
    public static final String COLOR_A = "#FF3B30";
    /** B类-较重缺陷：Apple橙 */
    public static final String COLOR_B = "#FF9500";
    /** C类-一般缺陷：Apple黄 */
    public static final String COLOR_C = "#FFCC00";
    /** D类-轻微缺陷：Apple灰 */
    public static final String COLOR_D = "#C7C7CC";
    /** 无风险-安全：Apple绿 */
    public static final String COLOR_SAFE = "#34C759";

    // ==================== 风险等级文本 ====================

    /** 高风险 */
    public static final String RISK_HIGH = "高风险";
    /** 中度风险 */
    public static final String RISK_MEDIUM = "中度风险";
    /** 一般风险 */
    public static final String RISK_LOW = "一般风险";
    /** 平稳 */
    public static final String RISK_SAFE = "平稳";

    // ==================== 四个外观模块名称 ====================

    public static final String[] MODULE_NAMES = {"cigarette", "boxSmall", "carton", "caseA"};
    public static final String[] MODULE_LABELS = {"烟支", "小盒", "条盒", "箱装"};
    public static final String[] LEVEL_SUFFIX = {"A", "B", "C", "D"};

    private DefectConstants() {}
}
