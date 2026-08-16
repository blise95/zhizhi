package com.zjzy.quality.controller;

import com.zjzy.quality.entity.WarningLog;
import com.zjzy.quality.service.WarningService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

/**
 * 预警日志REST接口
 */
@RestController
@RequestMapping("/api/warning")
public class WarningController {

    @Autowired
    private WarningService warningService;

    /**
     * 获取当前风险横幅状态
     * GET /api/warning/banner
     */
    @GetMapping("/banner")
    public Map<String, Object> banner() {
        return warningService.getCurrentBanner();
    }

    /**
     * 查询全部预警日志（仅A/B/C类）
     * GET /api/warning/logs
     */
    @GetMapping({"/logs", "/list"})
    public List<WarningLog> logs() {
        return warningService.getAllWarnings();
    }
}
