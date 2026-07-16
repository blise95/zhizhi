package com.zjzy.quality.service;

import com.zjzy.quality.constant.DefectConstants;
import com.zjzy.quality.entity.DefectDetail;
import com.zjzy.quality.entity.InspectionRecord;
import com.zjzy.quality.entity.WarningLog;
import com.zjzy.quality.repository.InspectionRepository;
import com.zjzy.quality.repository.WarningRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.SimpleDateFormat;
import java.util.*;
import java.util.stream.Collectors;

/**
 * 预警判定服务
 * 严格按照缺陷分级标准执行A/B/C/D四级判定
 */
@Service
public class WarningService {

    @Autowired
    private InspectionRepository inspectionRepo;

    @Autowired
    private WarningRepository warningRepo;

    /**
     * 判定预警等级
     */
    public Map<String, Object> judge(InspectionRecord record, List<InspectionRecord> history) {
        List<Map<String, Object>> warns = new ArrayList<>();

        // 从 defectDetails 中提取缺陷明细
        List<DefectDetail> details = record.getDefectDetails();

        // A类判定
        int aTotal = record.getTotalA();
        if (aTotal >= DefectConstants.A_TRIGGER) {
            List<DefectDetail> aDefects = details != null
                    ? details.stream().filter(d -> "A".equals(d.getGrade())).collect(Collectors.toList())
                    : Collections.emptyList();
            String defectDesc = buildDefectDesc(aDefects);
            Map<String, Object> w = new HashMap<>();
            w.put("level", "A");
            w.put("count", aTotal);
            w.put("desc", defectDesc.isEmpty() ? "A类严重缺陷" + aTotal + "个" : defectDesc);
            w.put("defects", buildDefectList(aDefects));
            warns.add(w);
        }

        // B类判定
        int bTotal = record.getTotalB();
        if (bTotal >= DefectConstants.B_TRIGGER) {
            List<DefectDetail> bDefects = details != null
                    ? details.stream().filter(d -> "B".equals(d.getGrade())).collect(Collectors.toList())
                    : Collections.emptyList();
            String defectDesc = buildDefectDesc(bDefects);
            Map<String, Object> w = new HashMap<>();
            w.put("level", "B");
            w.put("count", bTotal);
            w.put("desc", defectDesc.isEmpty() ? "B类缺陷合计" + bTotal + "个" : defectDesc);
            w.put("defects", buildDefectList(bDefects));
            warns.add(w);
        }

        // C类判定：连续3班次C类总数持续上涨
        int cTotal = record.getTotalC();
        int consecutive = DefectConstants.C_CONSECUTIVE;
        if (history.size() >= consecutive - 1) {
            List<Integer> recentC = new ArrayList<>();
            int start = Math.max(0, history.size() - consecutive + 1);
            for (int i = start; i < history.size(); i++) {
                recentC.add(history.get(i).getTotalC());
            }
            recentC.add(cTotal);

            if (recentC.size() >= consecutive) {
                boolean increasing = true;
                for (int i = 1; i < recentC.size(); i++) {
                    if (recentC.get(i) <= recentC.get(i - 1)) {
                        increasing = false;
                        break;
                    }
                }
                if (increasing) {
                    List<DefectDetail> cDefects = details != null
                            ? details.stream().filter(d -> "C".equals(d.getGrade())).collect(Collectors.toList())
                            : Collections.emptyList();
                    String defectDesc = buildDefectDesc(cDefects);
                    Map<String, Object> w = new HashMap<>();
                    w.put("level", "C");
                    w.put("count", cTotal);
                    w.put("desc", defectDesc.isEmpty() ? "C类缺陷连续" + recentC.size() + "班次上涨" : defectDesc);
                    w.put("defects", buildDefectList(cDefects));
                    warns.add(w);
                }
            }
        }

        // 构建字段信息字符串（班组 班次 机台 牌号 取样件号）
        String fieldInfo = buildFieldInfo(record);

        // 汇总判定结果
        Map<String, Object> result = new HashMap<>();
        if (warns.stream().anyMatch(w -> "A".equals(w.get("level")))) {
            result.put("riskLevel", DefectConstants.RISK_HIGH);
            result.put("bannerText", fieldInfo + " — 高风险：" + buildAllDefectSummary(warns));
            result.put("bannerColor", DefectConstants.COLOR_A);
        } else if (warns.stream().anyMatch(w -> "B".equals(w.get("level")))) {
            result.put("riskLevel", DefectConstants.RISK_MEDIUM);
            result.put("bannerText", fieldInfo + " — 中度风险：" + buildAllDefectSummary(warns));
            result.put("bannerColor", DefectConstants.COLOR_B);
        } else if (warns.stream().anyMatch(w -> "C".equals(w.get("level")))) {
            result.put("riskLevel", DefectConstants.RISK_LOW);
            result.put("bannerText", fieldInfo + " — 一般风险：" + buildAllDefectSummary(warns));
            result.put("bannerColor", DefectConstants.COLOR_C);
        } else {
            result.put("riskLevel", DefectConstants.RISK_SAFE);
            result.put("bannerText", fieldInfo + "：质检数据平稳");
            result.put("bannerColor", DefectConstants.COLOR_SAFE);
        }

        result.put("warnings", warns);
        return result;
    }

    /** 构建字段信息：班组 班次 机台 牌号 取样件号 */
    private String buildFieldInfo(InspectionRecord record) {
        String team = nvl(record.getTeam());
        String shift = nvl(record.getShift());
        String machine = nvl(record.getMachineId());
        String brand = nvl(record.getBrand());
        String ticket = nvl(record.getSampleTicketNo());
        return team + " " + shift + " " + machine + " " + brand + " " + ticket;
    }

    /** 构建单个等级的缺陷描述 */
    private String buildDefectDesc(List<DefectDetail> defects) {
        if (defects == null || defects.isEmpty()) return "";
        return defects.stream()
                .map(d -> d.getName() + " " + d.getGrade() + "类 " + d.getCount() + "个")
                .collect(Collectors.joining("、"));
    }

    /** 构建缺陷列表用于前端展示 */
    private List<Map<String, Object>> buildDefectList(List<DefectDetail> defects) {
        if (defects == null) return Collections.emptyList();
        return defects.stream().map(d -> {
            Map<String, Object> m = new HashMap<>();
            m.put("name", d.getName());
            m.put("grade", d.getGrade());
            m.put("count", d.getCount());
            return m;
        }).collect(Collectors.toList());
    }

    /** 汇总所有等级的缺陷摘要 */
    private String buildAllDefectSummary(List<Map<String, Object>> warns) {
        List<String> parts = new ArrayList<>();
        for (Map<String, Object> w : warns) {
            String desc = (String) w.get("desc");
            if (desc != null && !desc.isEmpty()) {
                parts.add(desc);
            }
        }
        return parts.isEmpty() ? "无具体缺陷" : String.join("；", parts);
    }

    private String nvl(String s) {
        return s != null && !s.isEmpty() ? s : "--";
    }

    /**
     * 将预警写入日志
     */
    public void writeWarningLogs(List<Map<String, Object>> warns, InspectionRecord record) {
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

    /**
     * 获取当前横幅状态
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getCurrentBanner() {
        List<InspectionRecord> all = inspectionRepo.findAll();
        if (all.isEmpty()) {
            Map<String, Object> result = new HashMap<>();
            result.put("riskLevel", DefectConstants.RISK_SAFE);
            result.put("bannerText", "质检数据平稳");
            result.put("bannerColor", DefectConstants.COLOR_SAFE);
            return result;
        }
        InspectionRecord latest = all.get(all.size() - 1);
        List<InspectionRecord> history = all.subList(0, all.size() - 1);
        return judge(latest, new ArrayList<>(history));
    }

    /**
     * 获取全量预警日志
     */
    public List<WarningLog> getAllWarnings() {
        return warningRepo.findAll();
    }
}
