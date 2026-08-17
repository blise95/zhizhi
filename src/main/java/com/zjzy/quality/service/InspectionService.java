package com.zjzy.quality.service;

import com.zjzy.quality.constant.DefectCatalog;
import com.zjzy.quality.entity.DefectDetail;
import com.zjzy.quality.entity.InspectionRecord;
import com.zjzy.quality.entity.PhysicalMeasurement;
import com.zjzy.quality.entity.WarningLog;
import com.zjzy.quality.repository.DefectDetailRepository;
import com.zjzy.quality.repository.InspectionRepository;
import com.zjzy.quality.repository.WarningRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.annotation.PostConstruct;

import java.text.SimpleDateFormat;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

/**
 * 质检数据业务逻辑服务
 * 数据CRUD + 预警判定 + 日志写入 一站式编排
 */
@Service
public class InspectionService {

    @Autowired
    private InspectionRepository inspectionRepo;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private WarningRepository warningRepo;

    @Autowired
    private WarningService warningService;

    @Autowired
    private DefectDetailRepository defectDetailRepo;

    @PostConstruct
    public void ensureExtraColumns() {
        try {
            jdbcTemplate.execute("ALTER TABLE inspection_record ADD COLUMN steel_stamp VARCHAR(50) NULL COMMENT '条盒钢印'");
        } catch (Exception ignored) {
            // 列已存在
        }
        try {
            jdbcTemplate.execute("ALTER TABLE inspection_record ADD COLUMN tobacco_batch VARCHAR(50) NULL COMMENT '烟丝批次'");
        } catch (Exception ignored) {
            // 列已存在
        }
    }

    /**
     * 提交质检数据（核心业务入口）
     */
    @Transactional
    public Map<String, Object> submit(InspectionRecord record) {
        // 0. 设置上传时间和上传人
        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
        if (record.getUploadTime() == null || record.getUploadTime().isEmpty()) {
            record.setUploadTime(sdf.format(new Date()));
        }
        if (record.getUploader() == null || record.getUploader().isEmpty()) {
            record.setUploader("未知用户");
        }

        // 1. 读取历史数据
        List<InspectionRecord> history = inspectionRepo.findAll();

        // 2. 判定预警
        Map<String, Object> judgeResult = warningService.judge(record, history);
        record.setRiskLevel((String) judgeResult.get("riskLevel"));

        // 2.5 设置缺陷明细的 inspection 回引（Jackson 反序列化后为 null）
        if (record.getDefectDetails() != null) {
            for (DefectDetail d : record.getDefectDetails()) {
                d.setInspection(record);
            }
        }

        // 2.6 设置物测指标的 inspection 回引
        if (record.getPhysicalMeasurements() != null) {
            for (PhysicalMeasurement pm : record.getPhysicalMeasurements()) {
                pm.setInspection(record);
            }
        }

        // 3. 保存质检记录（自动级联保存 defectDetails）
        inspectionRepo.save(record);

        // 4. 写入预警日志
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> warns = (List<Map<String, Object>>) judgeResult.get("warnings");
        writeWarningLogs(warns, record);

        // 5. 返回结果
        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("riskLevel", judgeResult.get("riskLevel"));
        result.put("bannerText", judgeResult.get("bannerText"));
        result.put("bannerColor", judgeResult.get("bannerColor"));
        result.put("warnings", warns);
        result.put("message", "数据提交成功，风险等级：" + judgeResult.get("riskLevel"));
        return result;
    }

    /**
     * 查询全量质检历史数据（按ID降序，最新在前）
     */
    public List<InspectionRecord> listAll() {
        return inspectionRepo.findAllByOrderByIdDesc();
    }

    /**
     * 按日期范围查询（降序）
     */
    public List<InspectionRecord> listByDateRange(String startDate, String endDate) {
        return inspectionRepo.findByDateBetweenOrderByIdDesc(startDate, endDate);
    }

    /**
     * 多条件组合筛选：日期范围 + 牌号 + 合作生产点
     */
    public List<InspectionRecord> listByFilter(String startDate, String endDate, String brand, String partnerSite, String shift, String team, String machine) {
        List<InspectionRecord> records;
        if (startDate != null && !startDate.isEmpty() && endDate != null && !endDate.isEmpty()) {
            records = inspectionRepo.findByDateBetweenOrderByIdDesc(startDate, endDate);
        } else {
            records = inspectionRepo.findAllByOrderByIdDesc();
        }

        if (brand != null && !brand.isEmpty()) {
            records = records.stream().filter(r -> brand.equals(r.getBrand())).collect(Collectors.toList());
        }
        if (partnerSite != null && !partnerSite.isEmpty()) {
            records = records.stream().filter(r -> partnerSite.equals(r.getPartnerSite())).collect(Collectors.toList());
        }
        if (shift != null && !shift.isEmpty()) {
            records = records.stream().filter(r -> shift.equals(r.getShift())).collect(Collectors.toList());
        }
        if (team != null && !team.isEmpty()) {
            records = records.stream().filter(r -> team.equals(r.getTeam())).collect(Collectors.toList());
        }
        if (machine != null && !machine.isEmpty()) {
            records = records.stream().filter(r -> machine.equals(r.getMachineId())).collect(Collectors.toList());
        }

        return records;
    }

    /**
     * 更新质检记录基础信息（不改缺陷明细）
     */
    @Transactional
    public Map<String, Object> updateHeader(Long id, InspectionRecord incoming) {
        InspectionRecord existing = inspectionRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("记录不存在"));
        if (incoming.getDate() != null) existing.setDate(incoming.getDate());
        if (incoming.getShift() != null) existing.setShift(incoming.getShift());
        if (incoming.getMachineId() != null) existing.setMachineId(incoming.getMachineId());
        if (incoming.getTeam() != null) existing.setTeam(incoming.getTeam());
        if (incoming.getPartnerSite() != null) existing.setPartnerSite(incoming.getPartnerSite());
        if (incoming.getBrand() != null) existing.setBrand(incoming.getBrand());
        if (incoming.getSampleTime() != null) existing.setSampleTime(incoming.getSampleTime());
        if (incoming.getSampleTicketNo() != null) existing.setSampleTicketNo(incoming.getSampleTicketNo());
        if (incoming.getSteelStamp() != null) existing.setSteelStamp(incoming.getSteelStamp());
        if (incoming.getTobaccoBatch() != null) existing.setTobaccoBatch(incoming.getTobaccoBatch());
        if (incoming.getUploader() != null) existing.setUploader(incoming.getUploader());
        inspectionRepo.save(existing);
        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("message", "记录已更新");
        return result;
    }

    /**
     * 删除质检记录（级联删除缺陷明细）
     */
    @Transactional
    public void deleteById(Long id) {
        inspectionRepo.deleteById(id);
    }

    /**
     * 获取缺陷分析数据（支持日期+牌号+合作生产点筛选）
     */
    public Map<String, Object> getDefectAnalysis(String startDate, String endDate, String brand, String partnerSite, String shift, String team, String machine) {
        List<InspectionRecord> all = listByFilter(startDate, endDate, brand, partnerSite, shift, team, machine);
        Map<String, Object> result = new HashMap<>();

        // 1. 饼图：全部历史A/B/C/D总量
        int aSum = 0, bSum = 0, cSum = 0, dSum = 0;
        for (InspectionRecord r : all) {
            aSum += r.getTotalA();
            bSum += r.getTotalB();
            cSum += r.getTotalC();
            dSum += r.getTotalD();
        }
        Map<String, Integer> pie = new LinkedHashMap<>();
        pie.put("a", aSum);
        pie.put("b", bSum);
        pie.put("c", cSum);
        pie.put("d", dSum);
        result.put("pie", pie);

        // 2. 四层模块缺陷分布
        int[] cigaretteABCD = new int[4];
        int[] boxSmallABCD = new int[4];
        int[] cartonABCD = new int[4];
        int[] caseABCD = new int[4];

        for (InspectionRecord r : all) {
            cigaretteABCD[0] += safe(r.getCigaretteA());
            cigaretteABCD[1] += safe(r.getCigaretteB());
            cigaretteABCD[2] += safe(r.getCigaretteC());
            cigaretteABCD[3] += safe(r.getCigaretteD());

            boxSmallABCD[0] += safe(r.getBoxSmallA());
            boxSmallABCD[1] += safe(r.getBoxSmallB());
            boxSmallABCD[2] += safe(r.getBoxSmallC());
            boxSmallABCD[3] += safe(r.getBoxSmallD());

            cartonABCD[0] += safe(r.getCartonA());
            cartonABCD[1] += safe(r.getCartonB());
            cartonABCD[2] += safe(r.getCartonC());
            cartonABCD[3] += safe(r.getCartonD());

            caseABCD[0] += safe(r.getCaseAa());
            caseABCD[1] += safe(r.getCaseAb());
            caseABCD[2] += safe(r.getCaseAc());
            caseABCD[3] += safe(r.getCaseAd());
        }

        Map<String, Object> modules = new LinkedHashMap<>();
        modules.put("cigarette", cigaretteABCD);
        modules.put("boxSmall", boxSmallABCD);
        modules.put("carton", cartonABCD);
        modules.put("caseA", caseABCD);
        result.put("modules", modules);

        // 3. 机台质量趋势：选中的单个机台按日期+班次展示A/B/C/D缺陷趋势
        List<InspectionRecord> machineRecords = new ArrayList<>();
        if (machine != null && !machine.isEmpty()) {
            machineRecords = all;
        } else {
            // 未选机台时，使用所有记录
            machineRecords = all;
        }
        List<InspectionRecord> trendTail = machineRecords.subList(Math.max(0, machineRecords.size() - 20), machineRecords.size());
        List<String> trendLabels = new ArrayList<>();
        List<Integer> trendA = new ArrayList<>();
        List<Integer> trendB = new ArrayList<>();
        List<Integer> trendC = new ArrayList<>();
        List<Integer> trendD = new ArrayList<>();
        for (InspectionRecord r : trendTail) {
            String date = r.getDate() != null && r.getDate().length() >= 5
                    ? r.getDate().substring(5) : r.getDate();
            trendLabels.add(date + "\n" + r.getShift() + "\n" + (r.getMachineId() != null ? r.getMachineId() : ""));
            trendA.add(r.getTotalA());
            trendB.add(r.getTotalB());
            trendC.add(r.getTotalC());
            trendD.add(r.getTotalD());
        }
        Map<String, Object> machineTrend = new LinkedHashMap<>();
        machineTrend.put("labels", trendLabels);
        machineTrend.put("a", trendA);
        machineTrend.put("b", trendB);
        machineTrend.put("c", trendC);
        machineTrend.put("d", trendD);
        result.put("machineTrend", machineTrend);

        // 4. 同班次机台对比：按机台分组汇总缺陷总数（用于柱状图横向对比）
        Map<String, int[]> machineDefects = new LinkedHashMap<>();
        String[] machineOrder = {"1#","2#","3#","4#","5#","6#","7#","8#","9#","10#","11#","12#","13#","14#","15#","16#","17#","18#","19#","20#"};
        for (String m : machineOrder) {
            machineDefects.put(m, new int[]{0,0,0,0});
        }
        for (InspectionRecord r : all) {
            String mid = r.getMachineId();
            if (mid == null || mid.isEmpty()) continue;
            int[] arr = machineDefects.get(mid);
            if (arr != null) {
                arr[0] += r.getTotalA();
                arr[1] += r.getTotalB();
                arr[2] += r.getTotalC();
                arr[3] += r.getTotalD();
            }
        }
        result.put("machineComparison", machineDefects);

        // 5. 热力图数据
        List<List<Integer>> heatmap = new ArrayList<>();
        heatmap.add(Arrays.asList(cigaretteABCD[0], cigaretteABCD[1], cigaretteABCD[2], cigaretteABCD[3]));
        heatmap.add(Arrays.asList(boxSmallABCD[0], boxSmallABCD[1], boxSmallABCD[2], boxSmallABCD[3]));
        heatmap.add(Arrays.asList(cartonABCD[0], cartonABCD[1], cartonABCD[2], cartonABCD[3]));
        heatmap.add(Arrays.asList(caseABCD[0], caseABCD[1], caseABCD[2], caseABCD[3]));
        result.put("heatmap", heatmap);
        result.put("heatmapLabels", new String[]{"烟支外观", "小盒外观", "条盒外观", "箱装外观"});

        return result;
    }

    /**
     * 综合质量汇总分析（KPI指标卡 + 多维度分析图表 + 预警中心）
     * 复用 listByFilter 数据源，一次查询返回全部统计数据
     */
    public Map<String, Object> getQualitySummary(String startDate, String endDate, String brand, String partnerSite, String shift, String team, String machine) {
        List<InspectionRecord> all = listByFilter(startDate, endDate, brand, partnerSite, shift, team, machine);
        Map<String, Object> result = new LinkedHashMap<>();

        int totalSamples = all.size();
        int totalDefects = 0, totalA = 0, totalB = 0, totalC = 0, totalD = 0;
        int qualifiedCount = 0;

        for (InspectionRecord r : all) {
            int a = r.getTotalA(), b = r.getTotalB(), c = r.getTotalC(), d = r.getTotalD();
            totalA += a; totalB += b; totalC += c; totalD += d;
            int recDefects = a + b + c + d;
            totalDefects += recDefects;
            if (recDefects == 0) qualifiedCount++;
        }

        // 1. KPI 指标卡
        Map<String, Object> kpi = new LinkedHashMap<>();
        int defectiveSamples = totalSamples - qualifiedCount;
        kpi.put("qualityRate", totalSamples > 0 ? Math.round((double) qualifiedCount / totalSamples * 10000.0) / 100.0 : 0);
        kpi.put("defectRate", totalSamples > 0 ? Math.round((double) defectiveSamples / totalSamples * 10000.0) / 100.0 : 0);
        kpi.put("sampleCount", totalSamples);
        kpi.put("warningCount", totalDefects);
        result.put("kpi", kpi);

        // 2. ABCD 环形图
        Map<String, Integer> pie = new LinkedHashMap<>();
        pie.put("a", totalA); pie.put("b", totalB); pie.put("c", totalC); pie.put("d", totalD);
        result.put("pie", pie);

        // 3~5. 合作生产点 / 牌号 / 机台 质量分析
        result.put("partnerAnalysis", computeDimAnalysis(all, "partner"));
        result.put("brandAnalysis", computeDimAnalysis(all, "brand"));
        result.put("machineAnalysis", computeDimAnalysis(all, "machine"));

        // 6. ABCD 缺陷趋势（按日期+班次排序聚合，取最近20个）
        Map<String, Integer> shiftOrder = new LinkedHashMap<>();
        shiftOrder.put("早班", 1); shiftOrder.put("中班", 2); shiftOrder.put("晚班", 3);
        List<InspectionRecord> sorted = new ArrayList<>(all);
        sorted.sort(Comparator.comparing((InspectionRecord r) -> r.getDate() != null ? r.getDate() : "", Comparator.nullsLast(Comparator.naturalOrder()))
                .thenComparing(r -> shiftOrder.getOrDefault(r.getShift(), 99)));

        List<String> trendLabels = new ArrayList<>();
        List<Integer> trendA = new ArrayList<>(), trendB = new ArrayList<>(), trendC = new ArrayList<>(), trendD = new ArrayList<>();
        Map<String, int[]> trendGroup = new LinkedHashMap<>();
        List<String> trendKeys = new ArrayList<>();
        for (InspectionRecord r : sorted) {
            String key = (r.getDate() != null ? r.getDate() : "") + "|" + (r.getShift() != null ? r.getShift() : "");
            if (!trendGroup.containsKey(key)) {
                trendGroup.put(key, new int[4]);
                trendKeys.add(key);
            }
            int[] tv = trendGroup.get(key);
            tv[0] += r.getTotalA(); tv[1] += r.getTotalB(); tv[2] += r.getTotalC(); tv[3] += r.getTotalD();
        }
        if (trendKeys.size() > 20) {
            trendKeys = trendKeys.subList(trendKeys.size() - 20, trendKeys.size());
        }
        for (String key : trendKeys) {
            String[] parts = key.split("\\|");
            String label = parts[0].length() >= 5 ? parts[0].substring(5) : parts[0];
            if (parts.length > 1) label += "\n" + parts[1];
            trendLabels.add(label);
            int[] tv = trendGroup.get(key);
            trendA.add(tv[0]); trendB.add(tv[1]); trendC.add(tv[2]); trendD.add(tv[3]);
        }
        Map<String, Object> defectTrend = new LinkedHashMap<>();
        defectTrend.put("labels", trendLabels);
        defectTrend.put("a", trendA); defectTrend.put("b", trendB); defectTrend.put("c", trendC); defectTrend.put("d", trendD);
        result.put("defectTrend", defectTrend);

        // 7. 预警记录（最近20条有缺陷的记录）
        List<Map<String, Object>> warnings = new ArrayList<>();
        int warnCount = 0;
        for (InspectionRecord r : all) {
            if (warnCount >= 20) break;
            int a = r.getTotalA(), b = r.getTotalB(), c = r.getTotalC(), d = r.getTotalD();
            if (a + b + c + d == 0) continue;
            Map<String, Object> warn = new LinkedHashMap<>();
            warn.put("time", (r.getDate() != null ? r.getDate() : "") + " " + (r.getShift() != null ? r.getShift() : ""));
            warn.put("partner", r.getPartnerSite());
            warn.put("brand", r.getBrand());
            warn.put("machine", r.getMachineId());
            String defectType = "综合";
            if (safe(r.getCigaretteA()) + safe(r.getCigaretteB()) + safe(r.getCigaretteC()) + safe(r.getCigaretteD()) > 0) defectType = "烟支外观";
            else if (safe(r.getBoxSmallA()) + safe(r.getBoxSmallB()) + safe(r.getBoxSmallC()) + safe(r.getBoxSmallD()) > 0) defectType = "小盒外观";
            else if (safe(r.getCartonA()) + safe(r.getCartonB()) + safe(r.getCartonC()) + safe(r.getCartonD()) > 0) defectType = "条盒外观";
            else if (safe(r.getCaseAa()) + safe(r.getCaseAb()) + safe(r.getCaseAc()) + safe(r.getCaseAd()) > 0) defectType = "箱装外观";
            String maxGrade = "D";
            if (a > 0) maxGrade = "A"; else if (b > 0) maxGrade = "B"; else if (c > 0) maxGrade = "C";
            warn.put("defectType", defectType);
            warn.put("defectLevel", maxGrade);
            warn.put("count", a + b + c + d);
            warn.put("riskLevel", r.getRiskLevel());
            warnings.add(warn);
            warnCount++;
        }
        result.put("warnings", warnings);

        return result;
    }

    /**
     * 质量分析结论（环比上月对比 + 各维度洞察，生成总结性文字）
     */
    public Map<String, Object> getQualityConclusion(String startDate, String endDate, String brand, String partnerSite, String shift, String team, String machine) {
        Map<String, Object> result = new LinkedHashMap<>();

        // ===== 本月数据 =====
        Map<String, Object> currSummary = getQualitySummary(startDate, endDate, brand, partnerSite, shift, team, machine);
        @SuppressWarnings("unchecked")
        Map<String, Object> currKpi = (Map<String, Object>) currSummary.get("kpi");
        double currQuality = ((Number) currKpi.get("qualityRate")).doubleValue();
        double currDefect = ((Number) currKpi.get("defectRate")).doubleValue();
        int currSamples = ((Number) currKpi.get("sampleCount")).intValue();
        int currWarnings = ((Number) currKpi.get("warningCount")).intValue();

        @SuppressWarnings("unchecked")
        Map<String, Integer> pie = (Map<String, Integer>) currSummary.get("pie");
        int totalABCD = (pie.get("a") != null ? pie.get("a") : 0) + (pie.get("b") != null ? pie.get("b") : 0)
                + (pie.get("c") != null ? pie.get("c") : 0) + (pie.get("d") != null ? pie.get("d") : 0);

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> partnerAnalysis = (List<Map<String, Object>>) currSummary.get("partnerAnalysis");
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> brandAnalysis = (List<Map<String, Object>>) currSummary.get("brandAnalysis");
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> machineAnalysis = (List<Map<String, Object>>) currSummary.get("machineAnalysis");

        // ===== 上月数据（等长周期）=====
        double prevQuality = 0, prevDefect = 0;
        int prevSamples = 0, prevWarnings = 0;
        try {
            LocalDate start = LocalDate.parse(startDate);
            LocalDate end = LocalDate.parse(endDate);
            long days = Math.max(ChronoUnit.DAYS.between(start, end) + 1, 1);
            LocalDate prevEnd = start.minusDays(1);
            LocalDate prevStart = prevEnd.minusDays(Math.max(days - 1, 0));

            Map<String, Object> prevSummary = getQualitySummary(prevStart.toString(), prevEnd.toString(), brand, partnerSite, shift, team, machine);
            @SuppressWarnings("unchecked")
            Map<String, Object> prevKpi = (Map<String, Object>) prevSummary.get("kpi");
            prevQuality = ((Number) prevKpi.get("qualityRate")).doubleValue();
            prevDefect = ((Number) prevKpi.get("defectRate")).doubleValue();
            prevSamples = ((Number) prevKpi.get("sampleCount")).intValue();
            prevWarnings = ((Number) prevKpi.get("warningCount")).intValue();
        } catch (Exception e) {
            // 无上月数据时使用0值
        }

        double qualityDelta = Math.round((currQuality - prevQuality) * 100.0) / 100.0;
        double defectDelta = Math.round((currDefect - prevDefect) * 100.0) / 100.0;
        int samplesDelta = currSamples - prevSamples;
        int warningsDelta = currWarnings - prevWarnings;

        // ===== 生成结论文本 =====
        List<String> conclusions = new ArrayList<>();

        // 1. 整体质量概况
        String trendWord = defectDelta < -0.5 ? "下降" : (defectDelta > 0.5 ? "上升" : "持平");
        String trendArrow = defectDelta < -0.5 ? "↓" : (defectDelta > 0.5 ? "↑" : "→");
        String evalWord = defectDelta < -1 ? "，质量有所改善" : (defectDelta > 1 ? "，需引起重视" : "");
        conclusions.add(String.format(
                "本月共抽检 %d 个样本，优质率 %.1f%%，缺陷率 %.1f%%；较上月，缺陷率%s %.1f 个百分点%s%s",
                currSamples, currQuality, currDefect, trendWord, Math.abs(defectDelta), evalWord, trendArrow));

        // 2. 缺陷等级分布
        if (totalABCD > 0) {
            int a = pie.get("a") != null ? pie.get("a") : 0;
            int b = pie.get("b") != null ? pie.get("b") : 0;
            int c = pie.get("c") != null ? pie.get("c") : 0;
            int d = pie.get("d") != null ? pie.get("d") : 0;
            double aPct = a * 100.0 / totalABCD, bPct = b * 100.0 / totalABCD;
            double cPct = c * 100.0 / totalABCD, dPct = d * 100.0 / totalABCD;
            String maxLevel; double maxPct;
            if (aPct >= bPct && aPct >= cPct && aPct >= dPct) { maxLevel = "A类(严重)"; maxPct = aPct; }
            else if (bPct >= cPct && bPct >= dPct) { maxLevel = "B类(较重)"; maxPct = bPct; }
            else if (cPct >= dPct) { maxLevel = "C类(一般)"; maxPct = cPct; }
            else { maxLevel = "D类(轻微)"; maxPct = dPct; }
            conclusions.add(String.format(
                    "缺陷等级分布：A类严重 %d个(%.1f%%)，B类较重 %d个(%.1f%%)，C类一般 %d个(%.1f%%)，D类轻微 %d个(%.1f%%)；以%s为主（占%.1f%%）",
                    a, aPct, b, bPct, c, cPct, d, dPct, maxLevel, maxPct));
        }

        // 3. 维度分析：问题最突出的维度
        appendDimConclusion(conclusions, partnerAnalysis, "合作生产点");
        appendDimConclusion(conclusions, brandAnalysis, "牌号");
        appendDimConclusion(conclusions, machineAnalysis, "机台");

        // 4. 高频缺陷警示
        List<Map<String, Object>> topDefects = getTopDefects(startDate, endDate, brand, partnerSite, shift, team, machine);
        if (topDefects != null && !topDefects.isEmpty()) {
            Map<String, Object> top1 = topDefects.get(0);
            String defName = (String) top1.get("name");
            String modName = (String) top1.get("moduleName");
            int defCount = (int) top1.get("count");
            double defRatio = ((Number) top1.get("ratio")).doubleValue();
            conclusions.add(String.format(
                    "高频缺陷TOP1：「%s」(属于%s)，出现 %d 次，占总缺陷 %.1f%%，需重点排查",
                    defName, modName, defCount, defRatio));
        }

        // 5. 综合判断
        String overallTrend, overallLabel;
        if (defectDelta < -1) { overallTrend = "improving"; overallLabel = "质量改善"; }
        else if (defectDelta > 1) { overallTrend = "declining"; overallLabel = "质量下滑"; }
        else { overallTrend = "stable"; overallLabel = "质量平稳"; }

        // 构造返回
        Map<String, Object> current = new LinkedHashMap<>();
        current.put("qualityRate", currQuality);
        current.put("defectRate", currDefect);
        current.put("sampleCount", currSamples);
        current.put("warningCount", currWarnings);

        Map<String, Object> previous = new LinkedHashMap<>();
        previous.put("qualityRate", prevQuality);
        previous.put("defectRate", prevDefect);
        previous.put("sampleCount", prevSamples);
        previous.put("warningCount", prevWarnings);

        Map<String, Object> deltas = new LinkedHashMap<>();
        deltas.put("qualityRateDelta", qualityDelta);
        deltas.put("defectRateDelta", defectDelta);
        deltas.put("sampleCountDelta", samplesDelta);
        deltas.put("warningCountDelta", warningsDelta);

        result.put("current", current);
        result.put("previous", previous);
        result.put("deltas", deltas);
        result.put("conclusions", conclusions);
        result.put("overallTrend", overallTrend);
        result.put("overallLabel", overallLabel);
        result.put("periodLabel", startDate + " ~ " + endDate);

        return result;
    }

    /**
     * 帮 getQualityConclusion 提取维度最突出项
     */
    private void appendDimConclusion(List<String> conclusions,
                                      List<Map<String, Object>> dimData, String dimLabel) {
        if (dimData == null || dimData.size() <= 1) return;
        Map<String, Object> worst = dimData.get(0);
        Map<String, Object> best = dimData.get(0);
        double maxDefect = -1, minDefect = Double.MAX_VALUE;
        for (Map<String, Object> d : dimData) {
            double dr = ((Number) d.get("defectRate")).doubleValue();
            if (dr > maxDefect) { maxDefect = dr; worst = d; }
            if (dr < minDefect) { minDefect = dr; best = d; }
        }
        String wName = (String) worst.get("name");
        String bName = (String) best.get("name");

        if (maxDefect > 50 && Math.abs(maxDefect - minDefect) > 30) {
            conclusions.add(String.format(
                    "%s：「%s」缺陷率最高(%.1f%%)，「%s」最稳定(%.1f%%)",
                    dimLabel, wName, maxDefect, bName, minDefect));
        } else if (dimData.size() >= 3 && maxDefect > 0) {
            conclusions.add(String.format(
                    "%s：「%s」缺陷率最高(%.1f%%)，整体差异不大",
                    dimLabel, wName, maxDefect));
        }
    }

    /**
     * 缺陷类型统计分析（跨4个模块聚合TOP10高频缺陷）
     * 复用 listByFilter 筛选结果，查询 DefectDetail 按缺陷名称聚合排序
     */
    public List<Map<String, Object>> getTopDefects(String startDate, String endDate, String brand, String partnerSite, String shift, String team, String machine) {
        List<InspectionRecord> records = listByFilter(startDate, endDate, brand, partnerSite, shift, team, machine);
        List<Long> ids = records.stream().map(InspectionRecord::getId).collect(Collectors.toList());
        if (ids.isEmpty()) return Collections.emptyList();

        List<DefectDetail> allDefects = defectDetailRepo.findByInspectionIdIn(ids);

        // 模块名映射（code → 中文）
        Map<String, String> moduleNameMap = new LinkedHashMap<>();
        moduleNameMap.put("case", "箱装外观");
        moduleNameMap.put("carton", "条装外观");
        moduleNameMap.put("boxSmall", "盒装外观");
        moduleNameMap.put("cigarette", "烟支外观");

        // 聚合: key = module|code|name
        Map<String, Map<String, Object>> aggMap = new LinkedHashMap<>();
        int totalCount = 0;

        for (DefectDetail d : allDefects) {
            String module = d.getModule() != null ? d.getModule() : "";
            String code = d.getCode() != null ? d.getCode() : "";
            String name = d.getName() != null ? d.getName() : code;
            String key = module + "|" + code + "|" + name;

            Map<String, Object> item = aggMap.get(key);
            if (item == null) {
                item = new LinkedHashMap<>();
                item.put("module", module);
                item.put("moduleName", moduleNameMap.getOrDefault(module, module));
                item.put("code", code);
                item.put("name", name);
                item.put("count", 0);
                aggMap.put(key, item);
            }
            int cnt = d.getCount() != null ? d.getCount() : 1;
            item.put("count", (int) item.get("count") + cnt);
            totalCount += cnt;
        }

        // 按 count 降序排序，取 TOP 10
        List<Map<String, Object>> sorted = new ArrayList<>(aggMap.values());
        sorted.sort((a, b) -> Integer.compare((int) b.get("count"), (int) a.get("count")));

        List<Map<String, Object>> result = new ArrayList<>();
        for (int i = 0; i < Math.min(10, sorted.size()); i++) {
            Map<String, Object> item = sorted.get(i);
            int cnt = (int) item.get("count");
            item.put("ratio", totalCount > 0 ? Math.round((double) cnt / totalCount * 10000.0) / 100.0 : 0);
            result.add(item);
        }

        return result;
    }

    /**
     * 按维度（合作点/牌号/机台）分组计算优质率、缺陷率、预警数量
     */
    private List<Map<String, Object>> computeDimAnalysis(List<InspectionRecord> records, String dimension) {
        Map<String, int[]> dimMap = new LinkedHashMap<>();
        for (InspectionRecord r : records) {
            String name;
            switch (dimension) {
                case "partner": name = r.getPartnerSite(); break;
                case "brand": name = r.getBrand(); break;
                case "machine": name = r.getMachineId(); break;
                default: name = "";
            }
            if (name == null || name.isEmpty()) continue;
            int[] arr = dimMap.get(name);
            if (arr == null) { arr = new int[3]; dimMap.put(name, arr); }
            arr[0]++;
            int d = r.getTotalA() + r.getTotalB() + r.getTotalC() + r.getTotalD();
            arr[1] += d;
            if (d == 0) arr[2]++;
        }
        List<Map<String, Object>> list = new ArrayList<>();
        for (Map.Entry<String, int[]> e : dimMap.entrySet()) {
            int[] v = e.getValue();
            int sampleCount = v[0], defectCount = v[1], qualifiedCount = v[2];
            int defectiveSampleCount = sampleCount - qualifiedCount;
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("name", e.getKey());
            item.put("sampleCount", sampleCount);
            item.put("defectCount", defectCount);
            item.put("qualifiedCount", qualifiedCount);
            item.put("qualityRate", sampleCount > 0 ? Math.round((double) qualifiedCount / sampleCount * 10000.0) / 100.0 : 0);
            item.put("defectRate", sampleCount > 0 ? Math.round((double) defectiveSampleCount / sampleCount * 10000.0) / 100.0 : 0);
            item.put("warningCount", defectCount);
            list.add(item);
        }
        return list;
    }

    /**
     * 获取箱装外观缺陷分析数据（按部位×日期×缺陷编码聚合）
     * @param startDate 起始日期 yyyy-MM-dd
     * @param endDate   结束日期 yyyy-MM-dd
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getCaseDefectAnalysis(String startDate, String endDate, String brand, String partnerSite, String shift, String team) {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("module", "箱装外观");

        // 获取箱装外观的缺陷目录信息
        DefectCatalog.ModuleDefects caseCatalog = DefectCatalog.CATALOG.get("case");
        if (caseCatalog == null) {
            result.put("bodyParts", Collections.emptyList());
            result.put("data", Collections.emptyMap());
            return result;
        }

        List<String> bodyParts = caseCatalog.bodyParts;
        result.put("bodyParts", bodyParts);

        // 建立 code -> {name, grade} 的快速索引
        Map<String, DefectCatalog.DefectEntry> codeIndex = new LinkedHashMap<>();
        for (DefectCatalog.DefectEntry e : caseCatalog.defects) {
            codeIndex.put(e.code, e);
        }

        // 查询该日期范围内所有箱装外观缺陷明细
        List<DefectDetail> allDetails = defectDetailRepo.findByModule("case");
        List<DefectDetail> details = new ArrayList<>();
        for (DefectDetail d : allDetails) {
            InspectionRecord inspection = d.getInspection();
            String dDate = inspection.getDate();
            if (dDate != null && dDate.compareTo(startDate) >= 0 && dDate.compareTo(endDate) <= 0) {
                if (brand != null && !brand.isEmpty() && !brand.equals(inspection.getBrand())) continue;
                if (partnerSite != null && !partnerSite.isEmpty() && !partnerSite.equals(inspection.getPartnerSite())) continue;
                if (shift != null && !shift.isEmpty() && !shift.equals(inspection.getShift())) continue;
                if (team != null && !team.isEmpty() && !team.equals(inspection.getTeam())) continue;
                details.add(d);
            }
        }

        // 收集所有出现的日期（去重、排序）
        Set<String> dateSet = new LinkedHashSet<>();
        for (DefectDetail d : details) {
            String date = d.getInspection().getDate();
            if (date != null) dateSet.add(date);
        }
        List<String> dates = new ArrayList<>(dateSet);
        Collections.sort(dates);  // 按日期升序排列

        // 按 bodyPart -> date -> code 聚合 count
        // structure: bodyPartData[bodyPart][date][code] = countSum
        Map<String, Map<String, Map<String, Integer>>> bodyPartData = new LinkedHashMap<>();
        for (String bp : bodyParts) {
            bodyPartData.put(bp, new LinkedHashMap<>());
        }

        for (DefectDetail d : details) {
            String bp = d.getBodyPart();
            if (bp == null || !bodyPartData.containsKey(bp)) continue;
            String date = d.getInspection().getDate();
            if (date == null) continue;
            String code = d.getCode();
            if (code == null) continue;
            int count = d.getCount() != null ? d.getCount() : 1;

            Map<String, Map<String, Integer>> dateMap = bodyPartData.get(bp);
            dateMap.putIfAbsent(date, new LinkedHashMap<>());
            Map<String, Integer> codeMap = dateMap.get(date);
            codeMap.put(code, codeMap.getOrDefault(code, 0) + count);
        }

        // 构建每个部位的输出数据
        Map<String, Object> data = new LinkedHashMap<>();
        for (String bp : bodyParts) {
            Map<String, Object> partData = new LinkedHashMap<>();
            partData.put("dates", dates);

            // 收集该部位下出现过的所有缺陷编码
            Set<String> codesInPart = new LinkedHashSet<>();
            Map<String, Map<String, Integer>> dateMap = bodyPartData.get(bp);
            for (Map<String, Integer> codeMap : dateMap.values()) {
                codesInPart.addAll(codeMap.keySet());
            }

            // 如果没有任何缺陷数据，series 为空
            List<Map<String, Object>> series = new ArrayList<>();
            for (String code : codesInPart) {
                DefectCatalog.DefectEntry entry = codeIndex.get(code);
                String name = entry != null ? entry.name : code;
                String grade = entry != null ? entry.grade : "";

                List<Integer> values = new ArrayList<>();
                for (String date : dates) {
                    Map<String, Integer> codeMap = dateMap.get(date);
                    Integer val = (codeMap != null) ? codeMap.get(code) : null;
                    values.add(val != null ? val : 0);
                }

                Map<String, Object> seriesItem = new LinkedHashMap<>();
                seriesItem.put("code", code);
                seriesItem.put("name", name);
                seriesItem.put("grade", grade);
                seriesItem.put("values", values);
                series.add(seriesItem);
            }
            partData.put("series", series);
            data.put(bp, partData);
        }

        result.put("data", data);
        return result;
    }

    /**
     * 获取条装外观缺陷分析数据（按部位×日期×缺陷编码聚合）
     * @param startDate 起始日期 yyyy-MM-dd
     * @param endDate   结束日期 yyyy-MM-dd
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getCartonDefectAnalysis(String startDate, String endDate, String brand, String partnerSite, String shift, String team) {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("module", "条装外观");

        DefectCatalog.ModuleDefects cartonCatalog = DefectCatalog.CATALOG.get("carton");
        if (cartonCatalog == null) {
            result.put("bodyParts", Collections.emptyList());
            result.put("data", Collections.emptyMap());
            return result;
        }

        List<String> bodyParts = cartonCatalog.bodyParts;
        result.put("bodyParts", bodyParts);

        // 建立 code -> {name, grade} 的快速索引
        Map<String, DefectCatalog.DefectEntry> codeIndex = new LinkedHashMap<>();
        for (DefectCatalog.DefectEntry e : cartonCatalog.defects) {
            codeIndex.put(e.code, e);
        }

        // 查询日期范围内所有条装外观缺陷明细
        List<DefectDetail> allDetails = defectDetailRepo.findByModule("carton");
        List<DefectDetail> details = new ArrayList<>();
        for (DefectDetail d : allDetails) {
            InspectionRecord inspection = d.getInspection();
            String dDate = inspection.getDate();
            if (dDate != null && dDate.compareTo(startDate) >= 0 && dDate.compareTo(endDate) <= 0) {
                if (brand != null && !brand.isEmpty() && !brand.equals(inspection.getBrand())) continue;
                if (partnerSite != null && !partnerSite.isEmpty() && !partnerSite.equals(inspection.getPartnerSite())) continue;
                if (shift != null && !shift.isEmpty() && !shift.equals(inspection.getShift())) continue;
                if (team != null && !team.isEmpty() && !team.equals(inspection.getTeam())) continue;
                details.add(d);
            }
        }

        // 收集所有出现的日期（去重、排序）
        Set<String> dateSet = new LinkedHashSet<>();
        for (DefectDetail d : details) {
            String date = d.getInspection().getDate();
            if (date != null) dateSet.add(date);
        }
        List<String> dates = new ArrayList<>(dateSet);
        Collections.sort(dates);  // 按日期升序排列

        // 按 bodyPart -> date -> code 聚合 count
        Map<String, Map<String, Map<String, Integer>>> bodyPartData = new LinkedHashMap<>();
        for (String bp : bodyParts) {
            bodyPartData.put(bp, new LinkedHashMap<>());
        }

        for (DefectDetail d : details) {
            String bp = d.getBodyPart();
            if (bp == null || !bodyPartData.containsKey(bp)) continue;
            String date = d.getInspection().getDate();
            if (date == null) continue;
            String code = d.getCode();
            if (code == null) continue;
            int count = d.getCount() != null ? d.getCount() : 1;

            Map<String, Map<String, Integer>> dateMap = bodyPartData.get(bp);
            dateMap.putIfAbsent(date, new LinkedHashMap<>());
            Map<String, Integer> codeMap = dateMap.get(date);
            codeMap.put(code, codeMap.getOrDefault(code, 0) + count);
        }

        // 构建每个部位的输出数据
        Map<String, Object> data = new LinkedHashMap<>();
        for (String bp : bodyParts) {
            Map<String, Object> partData = new LinkedHashMap<>();
            partData.put("dates", dates);

            Set<String> codesInPart = new LinkedHashSet<>();
            Map<String, Map<String, Integer>> dateMap = bodyPartData.get(bp);
            for (Map<String, Integer> codeMap : dateMap.values()) {
                codesInPart.addAll(codeMap.keySet());
            }

            List<Map<String, Object>> series = new ArrayList<>();
            for (String code : codesInPart) {
                DefectCatalog.DefectEntry entry = codeIndex.get(code);
                String name = entry != null ? entry.name : code;
                String grade = entry != null ? entry.grade : "";

                List<Integer> values = new ArrayList<>();
                for (String date : dates) {
                    Map<String, Integer> codeMap = dateMap.get(date);
                    Integer val = (codeMap != null) ? codeMap.get(code) : null;
                    values.add(val != null ? val : 0);
                }

                Map<String, Object> seriesItem = new LinkedHashMap<>();
                seriesItem.put("code", code);
                seriesItem.put("name", name);
                seriesItem.put("grade", grade);
                seriesItem.put("values", values);
                series.add(seriesItem);
            }
            partData.put("series", series);
            data.put(bp, partData);
        }

        result.put("data", data);
        return result;
    }

    /**
     * 获取盒装外观缺陷分析数据（按部位×日期×缺陷编码聚合）
     * @param startDate 起始日期 yyyy-MM-dd
     * @param endDate   结束日期 yyyy-MM-dd
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getBoxDefectAnalysis(String startDate, String endDate, String brand, String partnerSite, String shift, String team) {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("module", "盒装外观");

        DefectCatalog.ModuleDefects boxCatalog = DefectCatalog.CATALOG.get("boxSmall");
        if (boxCatalog == null) {
            result.put("bodyParts", Collections.emptyList());
            result.put("data", Collections.emptyMap());
            return result;
        }

        List<String> bodyParts = boxCatalog.bodyParts;
        result.put("bodyParts", bodyParts);

        Map<String, DefectCatalog.DefectEntry> codeIndex = new LinkedHashMap<>();
        for (DefectCatalog.DefectEntry e : boxCatalog.defects) {
            codeIndex.put(e.code, e);
        }

        List<DefectDetail> allDetails = defectDetailRepo.findByModule("boxSmall");
        List<DefectDetail> details = new ArrayList<>();
        for (DefectDetail d : allDetails) {
            InspectionRecord inspection = d.getInspection();
            String dDate = inspection.getDate();
            if (dDate != null && dDate.compareTo(startDate) >= 0 && dDate.compareTo(endDate) <= 0) {
                if (brand != null && !brand.isEmpty() && !brand.equals(inspection.getBrand())) continue;
                if (partnerSite != null && !partnerSite.isEmpty() && !partnerSite.equals(inspection.getPartnerSite())) continue;
                if (shift != null && !shift.isEmpty() && !shift.equals(inspection.getShift())) continue;
                if (team != null && !team.isEmpty() && !team.equals(inspection.getTeam())) continue;
                details.add(d);
            }
        }

        Set<String> dateSet = new LinkedHashSet<>();
        for (DefectDetail d : details) {
            String date = d.getInspection().getDate();
            if (date != null) dateSet.add(date);
        }
        List<String> dates = new ArrayList<>(dateSet);
        Collections.sort(dates);

        Map<String, Map<String, Map<String, Integer>>> bodyPartData = new LinkedHashMap<>();
        for (String bp : bodyParts) {
            bodyPartData.put(bp, new LinkedHashMap<>());
        }

        for (DefectDetail d : details) {
            String bp = d.getBodyPart();
            if (bp == null || !bodyPartData.containsKey(bp)) continue;
            String date = d.getInspection().getDate();
            if (date == null) continue;
            String code = d.getCode();
            if (code == null) continue;
            int count = d.getCount() != null ? d.getCount() : 1;

            Map<String, Map<String, Integer>> dateMap = bodyPartData.get(bp);
            dateMap.putIfAbsent(date, new LinkedHashMap<>());
            Map<String, Integer> codeMap = dateMap.get(date);
            codeMap.put(code, codeMap.getOrDefault(code, 0) + count);
        }

        Map<String, Object> data = new LinkedHashMap<>();
        for (String bp : bodyParts) {
            Map<String, Object> partData = new LinkedHashMap<>();
            partData.put("dates", dates);

            Set<String> codesInPart = new LinkedHashSet<>();
            Map<String, Map<String, Integer>> dateMap = bodyPartData.get(bp);
            for (Map<String, Integer> codeMap : dateMap.values()) {
                codesInPart.addAll(codeMap.keySet());
            }

            List<Map<String, Object>> series = new ArrayList<>();
            for (String code : codesInPart) {
                DefectCatalog.DefectEntry entry = codeIndex.get(code);
                String name = entry != null ? entry.name : code;
                String grade = entry != null ? entry.grade : "";

                List<Integer> values = new ArrayList<>();
                for (String date : dates) {
                    Map<String, Integer> codeMap = dateMap.get(date);
                    Integer val = (codeMap != null) ? codeMap.get(code) : null;
                    values.add(val != null ? val : 0);
                }

                Map<String, Object> seriesItem = new LinkedHashMap<>();
                seriesItem.put("code", code);
                seriesItem.put("name", name);
                seriesItem.put("grade", grade);
                seriesItem.put("values", values);
                series.add(seriesItem);
            }
            partData.put("series", series);
            data.put(bp, partData);
        }

        result.put("data", data);
        return result;
    }

    /**
     * 获取烟支外观缺陷分析数据（按部位×日期×缺陷编码聚合）
     * @param startDate 起始日期 yyyy-MM-dd
     * @param endDate   结束日期 yyyy-MM-dd
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getCigDefectAnalysis(String startDate, String endDate, String brand, String partnerSite, String shift, String team) {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("module", "烟支外观");

        DefectCatalog.ModuleDefects cigCatalog = DefectCatalog.CATALOG.get("cigarette");
        if (cigCatalog == null) {
            result.put("bodyParts", Collections.emptyList());
            result.put("data", Collections.emptyMap());
            return result;
        }

        List<String> bodyParts = cigCatalog.bodyParts;
        result.put("bodyParts", bodyParts);

        Map<String, DefectCatalog.DefectEntry> codeIndex = new LinkedHashMap<>();
        for (DefectCatalog.DefectEntry e : cigCatalog.defects) {
            codeIndex.put(e.code, e);
        }

        List<DefectDetail> allDetails = defectDetailRepo.findByModule("cigarette");
        List<DefectDetail> details = new ArrayList<>();
        for (DefectDetail d : allDetails) {
            InspectionRecord inspection = d.getInspection();
            String dDate = inspection.getDate();
            if (dDate != null && dDate.compareTo(startDate) >= 0 && dDate.compareTo(endDate) <= 0) {
                if (brand != null && !brand.isEmpty() && !brand.equals(inspection.getBrand())) continue;
                if (partnerSite != null && !partnerSite.isEmpty() && !partnerSite.equals(inspection.getPartnerSite())) continue;
                if (shift != null && !shift.isEmpty() && !shift.equals(inspection.getShift())) continue;
                if (team != null && !team.isEmpty() && !team.equals(inspection.getTeam())) continue;
                details.add(d);
            }
        }

        Set<String> dateSet = new LinkedHashSet<>();
        for (DefectDetail d : details) {
            String date = d.getInspection().getDate();
            if (date != null) dateSet.add(date);
        }
        List<String> dates = new ArrayList<>(dateSet);
        Collections.sort(dates);

        Map<String, Map<String, Map<String, Integer>>> bodyPartData = new LinkedHashMap<>();
        for (String bp : bodyParts) {
            bodyPartData.put(bp, new LinkedHashMap<>());
        }

        for (DefectDetail d : details) {
            String bp = d.getBodyPart();
            if (bp == null || !bodyPartData.containsKey(bp)) continue;
            String date = d.getInspection().getDate();
            if (date == null) continue;
            String code = d.getCode();
            if (code == null) continue;
            int count = d.getCount() != null ? d.getCount() : 1;

            Map<String, Map<String, Integer>> dateMap = bodyPartData.get(bp);
            dateMap.putIfAbsent(date, new LinkedHashMap<>());
            Map<String, Integer> codeMap = dateMap.get(date);
            codeMap.put(code, codeMap.getOrDefault(code, 0) + count);
        }

        Map<String, Object> data = new LinkedHashMap<>();
        for (String bp : bodyParts) {
            Map<String, Object> partData = new LinkedHashMap<>();
            partData.put("dates", dates);

            Set<String> codesInPart = new LinkedHashSet<>();
            Map<String, Map<String, Integer>> dateMap = bodyPartData.get(bp);
            for (Map<String, Integer> codeMap : dateMap.values()) {
                codesInPart.addAll(codeMap.keySet());
            }

            List<Map<String, Object>> series = new ArrayList<>();
            for (String code : codesInPart) {
                DefectCatalog.DefectEntry entry = codeIndex.get(code);
                String name = entry != null ? entry.name : code;
                String grade = entry != null ? entry.grade : "";

                List<Integer> values = new ArrayList<>();
                for (String date : dates) {
                    Map<String, Integer> codeMap = dateMap.get(date);
                    Integer val = (codeMap != null) ? codeMap.get(code) : null;
                    values.add(val != null ? val : 0);
                }

                Map<String, Object> seriesItem = new LinkedHashMap<>();
                seriesItem.put("code", code);
                seriesItem.put("name", name);
                seriesItem.put("grade", grade);
                seriesItem.put("values", values);
                series.add(seriesItem);
            }
            partData.put("series", series);
            data.put(bp, partData);
        }

        result.put("data", data);
        return result;
    }

    /**
     * 将预警写入日志
     */
    private void writeWarningLogs(List<Map<String, Object>> warns, InspectionRecord record) {
        if (warns == null || warns.isEmpty()) return;
        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
        String now = sdf.format(new Date());

        for (Map<String, Object> w : warns) {
            WarningLog log = new WarningLog();
            log.setOccurTime(now);
            log.setDate(record.getDate());
            log.setTeam(record.getTeam());
            log.setMachineId(record.getMachineId());
            log.setDefectLevel((String) w.get("level"));
            log.setDefectCount((Integer) w.get("count"));
            log.setDescription((String) w.get("desc"));
            warningRepo.save(log);
        }
    }

    private int safe(Integer val) {
        return val == null ? 0 : val;
    }
}
