package com.zjzy.quality.controller;

import com.zjzy.quality.constant.DefectConstants;
import com.zjzy.quality.constant.DefectCatalog;
import com.zjzy.quality.entity.InspectionRecord;
import com.zjzy.quality.service.InspectionService;
import com.zjzy.quality.service.PredictionService;
import com.zjzy.quality.service.SPCAnalysisService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

/**
 * 图表数据REST接口
 */
@RestController
@RequestMapping("/api/chart")
public class ChartController {

    @Autowired
    private SPCAnalysisService spcAnalysisService;

    @Autowired
    private InspectionService inspectionService;

    @Autowired
    private PredictionService predictionService;

    /**
     * SPC分析数据（支持日期+牌号+合作生产点筛选）
     * GET /api/chart/spc?startDate=&endDate=&brand=&partnerSite=
     */
    @Transactional(readOnly = true)
    @GetMapping("/spc")
    public Map<String, Object> spc(
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(required = false) String brand,
            @RequestParam(required = false) String partnerSite,
            @RequestParam(required = false) String shift,
            @RequestParam(required = false) String team) {
        List<InspectionRecord> records = inspectionService.listByFilter(startDate, endDate, brand, partnerSite, shift, team, null);
        Map<String, SPCAnalysisService.SPCResult> analysis = spcAnalysisService.analyzeFiltered(records);
        Map<String, Object> result = new LinkedHashMap<>();

        String[] keys = {"suction", "weight", "circumference", "ventilation"};
        String[] labels = {"吸阻", "单支重量", "圆周", "通风度/长度"};

        for (int i = 0; i < keys.length; i++) {
            SPCAnalysisService.SPCResult sr = analysis.get(keys[i]);
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("label", labels[i]);
            item.put("values", sr.values);
            item.put("center", sr.center);
            item.put("ucl", sr.ucl);
            item.put("lcl", sr.lcl);

            List<Map<String, Object>> severeList = new ArrayList<>();
            for (int j = 0; j < sr.severe.size(); j++) {
                Map<String, Object> pt = new HashMap<>();
                pt.put("index", sr.severe.get(j)[0]);
                pt.put("desc", sr.severeDesc.get(j));
                severeList.add(pt);
            }
            item.put("severe", severeList);

            List<Map<String, Object>> mildList = new ArrayList<>();
            for (int j = 0; j < sr.mild.size(); j++) {
                Map<String, Object> pt = new HashMap<>();
                pt.put("index", sr.mild.get(j)[0]);
                pt.put("desc", sr.mildDesc.get(j));
                mildList.add(pt);
            }
            item.put("mild", mildList);

            result.put(keys[i], item);
        }

        result.put("colorA", DefectConstants.COLOR_A);
        result.put("colorC", DefectConstants.COLOR_C);

        return result;
    }

    /**
     * 缺陷分析数据（支持日期+牌号+合作生产点筛选）
     * GET /api/chart/defect?startDate=&endDate=&brand=&partnerSite=
     */
    @GetMapping("/defect")
    public Map<String, Object> defect(
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(required = false) String brand,
            @RequestParam(required = false) String partnerSite,
            @RequestParam(required = false) String shift,
            @RequestParam(required = false) String team,
            @RequestParam(required = false) String machine) {
        Map<String, Object> result = inspectionService.getDefectAnalysis(startDate, endDate, brand, partnerSite, shift, team, machine);
        result.put("colorA", DefectConstants.COLOR_A);
        result.put("colorB", DefectConstants.COLOR_B);
        result.put("colorC", DefectConstants.COLOR_C);
        result.put("colorD", DefectConstants.COLOR_D);
        return result;
    }

    /**
     * 综合质量汇总分析（KPI指标卡 + 多维分析 + 预警中心）
     * GET /api/chart/summary?startDate=&endDate=&brand=&partnerSite=&shift=&team=&machine=
     */
    @GetMapping("/summary")
    public Map<String, Object> summary(
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(required = false) String brand,
            @RequestParam(required = false) String partnerSite,
            @RequestParam(required = false) String shift,
            @RequestParam(required = false) String team,
            @RequestParam(required = false) String machine) {
        Map<String, Object> result = inspectionService.getQualitySummary(startDate, endDate, brand, partnerSite, shift, team, machine);
        result.put("colorA", DefectConstants.COLOR_A);
        result.put("colorB", DefectConstants.COLOR_B);
        result.put("colorC", DefectConstants.COLOR_C);
        result.put("colorD", DefectConstants.COLOR_D);
        return result;
    }

    /**
     * 质量分析结论（环比对比 + 总结性文字）
     * GET /api/chart/conclusion?startDate=&endDate=&brand=&partnerSite=&shift=&team=&machine=
     */
    @GetMapping("/conclusion")
    public Map<String, Object> conclusion(
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(required = false) String brand,
            @RequestParam(required = false) String partnerSite,
            @RequestParam(required = false) String shift,
            @RequestParam(required = false) String team,
            @RequestParam(required = false) String machine) {
        Map<String, Object> result = inspectionService.getQualityConclusion(startDate, endDate, brand, partnerSite, shift, team, machine);
        result.put("colorA", DefectConstants.COLOR_A);
        result.put("colorB", DefectConstants.COLOR_B);
        result.put("colorSafe", DefectConstants.COLOR_SAFE);
        return result;
    }

    /**
     * 缺陷类型统计分析（跨4模块聚合TOP10高频缺陷）
     * GET /api/chart/top-defects?startDate=&endDate=&brand=&partnerSite=&shift=&team=&machine=
     */
    @GetMapping("/top-defects")
    public List<Map<String, Object>> topDefects(
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(required = false) String brand,
            @RequestParam(required = false) String partnerSite,
            @RequestParam(required = false) String shift,
            @RequestParam(required = false) String team,
            @RequestParam(required = false) String machine) {
        return inspectionService.getTopDefects(startDate, endDate, brand, partnerSite, shift, team, machine);
    }

    /**
     * AI预测数据
     * GET /api/chart/predict
     */
    @GetMapping("/predict")
    public Map<String, Object> predict() {
        PredictionService.PredictionResult pr = predictionService.predict();
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("historyDates", pr.historyDates);
        result.put("historyRates", pr.historyRates);
        result.put("predDates", pr.predDates);
        result.put("predYhat", pr.predYhat);
        result.put("predUpper", pr.predUpper);
        result.put("predLower", pr.predLower);
        result.put("hasRisk", pr.hasRisk);
        result.put("riskMsg", pr.riskMsg);
        result.put("colorA", DefectConstants.COLOR_A);
        return result;
    }

    /**
     * 缺陷目录
     * GET /api/chart/defectCatalog
     */
    @GetMapping("/defectCatalog")
    public Map<String, Object> defectCatalog() {
        return DefectCatalog.getCatalogForFrontend();
    }

    /**
     * 箱装外观缺陷分析数据（按部位×日期×缺陷折线图）
     * GET /api/chart/case-defect?startDate=&endDate=&brand=&partnerSite=
     */
    @GetMapping("/case-defect")
    public Map<String, Object> caseDefect(
            @RequestParam String startDate,
            @RequestParam String endDate,
            @RequestParam(required = false) String brand,
            @RequestParam(required = false) String partnerSite,
            @RequestParam(required = false) String shift,
            @RequestParam(required = false) String team) {
        return inspectionService.getCaseDefectAnalysis(startDate, endDate, brand, partnerSite, shift, team);
    }

    /**
     * 条装外观缺陷分析数据（按部位×日期×缺陷折线图）
     * GET /api/chart/carton-defect?startDate=&endDate=&brand=&partnerSite=
     */
    @GetMapping("/carton-defect")
    public Map<String, Object> cartonDefect(
            @RequestParam String startDate,
            @RequestParam String endDate,
            @RequestParam(required = false) String brand,
            @RequestParam(required = false) String partnerSite,
            @RequestParam(required = false) String shift,
            @RequestParam(required = false) String team) {
        return inspectionService.getCartonDefectAnalysis(startDate, endDate, brand, partnerSite, shift, team);
    }

    /**
     * 盒装外观缺陷分析数据（按部位×日期×缺陷折线图）
     * GET /api/chart/box-defect?startDate=&endDate=&brand=&partnerSite=
     */
    @GetMapping("/box-defect")
    public Map<String, Object> boxDefect(
            @RequestParam String startDate,
            @RequestParam String endDate,
            @RequestParam(required = false) String brand,
            @RequestParam(required = false) String partnerSite,
            @RequestParam(required = false) String shift,
            @RequestParam(required = false) String team) {
        return inspectionService.getBoxDefectAnalysis(startDate, endDate, brand, partnerSite, shift, team);
    }

    /**
     * 烟支外观缺陷分析数据（按部位×日期×缺陷折线图）
     * GET /api/chart/cig-defect?startDate=&endDate=&brand=&partnerSite=
     */
    @GetMapping("/cig-defect")
    public Map<String, Object> cigDefect(
            @RequestParam String startDate,
            @RequestParam String endDate,
            @RequestParam(required = false) String brand,
            @RequestParam(required = false) String partnerSite,
            @RequestParam(required = false) String shift,
            @RequestParam(required = false) String team) {
        return inspectionService.getCigDefectAnalysis(startDate, endDate, brand, partnerSite, shift, team);
    }
}
