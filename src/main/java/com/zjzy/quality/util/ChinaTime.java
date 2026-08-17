package com.zjzy.quality.util;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;

/**
 * 业务时钟：阿联酋（Asia/Dubai，UTC+4），比北京时间晚 4 小时。
 */
public final class ChinaTime {

    public static final ZoneId ZONE = ZoneId.of("Asia/Dubai");
    private static final DateTimeFormatter DATE_TIME = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
    private static final DateTimeFormatter DATE = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    private ChinaTime() {}

    public static String nowDateTime() {
        return LocalDateTime.now(ZONE).format(DATE_TIME);
    }

    public static String nowDate() {
        return LocalDate.now(ZONE).format(DATE);
    }

    public static String format(LocalDateTime value) {
        if (value == null) {
            return null;
        }
        return value.format(DATE_TIME);
    }
}
