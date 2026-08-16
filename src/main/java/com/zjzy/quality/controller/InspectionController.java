package com.zjzy.quality.controller;

import com.zjzy.quality.entity.InspectionRecord;
import com.zjzy.quality.service.InspectionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

/**
 * 质检数据REST接口
 * 支持日期筛选、删除记录、上传人/上传时间
 */
@RestController
@RequestMapping("/api/inspection")
public class InspectionController {

    @Autowired
    private InspectionService inspectionService;

    /**
     * 提交质检数据
     * POST /api/inspection/submit
     */
    @PostMapping("/submit")
    public Map<String, Object> submit(@RequestBody InspectionRecord record) {
        return inspectionService.submit(record);
    }

    /**
     * 查询全量质检历史数据（支持日期+牌号+合作生产点筛选）
     * GET /api/inspection/list?startDate=&endDate=&brand=&partnerSite=
     */
    @Transactional(readOnly = true)
    @GetMapping("/list")
    public List<InspectionRecord> list(
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(required = false) String brand,
            @RequestParam(required = false) String partnerSite,
            @RequestParam(required = false) String shift,
            @RequestParam(required = false) String team) {
        return inspectionService.listByFilter(startDate, endDate, brand, partnerSite, shift, team, null);
    }

    /**
     * 更新质检记录基础信息
     * PUT /api/inspection/{id}
     */
    @PutMapping("/{id}")
    public Map<String, Object> update(@PathVariable Long id, @RequestBody InspectionRecord record) {
        return inspectionService.updateHeader(id, record);
    }

    /**
     * 删除质检记录
     * DELETE /api/inspection/{id}
     */
    @DeleteMapping("/{id}")
    public Map<String, Object> delete(@PathVariable Long id) {
        inspectionService.deleteById(id);
        Map<String, Object> result = new java.util.HashMap<>();
        result.put("success", true);
        result.put("message", "记录已删除");
        return result;
    }
}
