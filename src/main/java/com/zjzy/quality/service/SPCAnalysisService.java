package com.zjzy.quality.service;

import com.zjzy.quality.constant.DefectConstants;
import com.zjzy.quality.entity.InspectionRecord;
import com.zjzy.quality.entity.PhysicalMeasurement;
import com.zjzy.quality.repository.InspectionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;

/**
 * SPC八大判异算法服务
 */
@Service
public class SPCAnalysisService {

    @Autowired
    private InspectionRepository inspectionRepo;

    public static class SPCResult {
        public List<Double> values;
        public double center;
        public double ucl;
        public double lcl;
        public List<int[]> severe;
        public List<int[]> mild;
        public List<String> severeDesc;
        public List<String> mildDesc;

        public SPCResult(List<Double> values, double center, double ucl, double lcl) {
            this.values = values;
            this.center = center;
            this.ucl = ucl;
            this.lcl = lcl;
            this.severe = new ArrayList<>();
            this.mild = new ArrayList<>();
            this.severeDesc = new ArrayList<>();
            this.mildDesc = new ArrayList<>();
        }
    }

    public Map<String, SPCResult> analyzeAll() {
        List<InspectionRecord> records = inspectionRepo.findAll();
        return analyzeRecords(records);
    }

    /**
     * 对筛选后的记录进行SPC分析
     */
    public Map<String, SPCResult> analyzeFiltered(List<InspectionRecord> records) {
        return analyzeRecords(records);
    }

    private Map<String, SPCResult> analyzeRecords(List<InspectionRecord> records) {
        Map<String, SPCResult> results = new LinkedHashMap<>();

        // 从每个质检记录的物测子表中提取X均值
        List<Double> suctionVals = new ArrayList<>();
        for (InspectionRecord r : records) {
            double avg = avgX(r.getPhysicalMeasurements(), "suction");
            suctionVals.add(avg > 0 ? avg : DefectConstants.SUCTION_CENTER);
        }
        results.put("suction", analyze(suctionVals,
                DefectConstants.SUCTION_CENTER, DefectConstants.SUCTION_UCL, DefectConstants.SUCTION_LCL));

        List<Double> weightVals = new ArrayList<>();
        for (InspectionRecord r : records) {
            double avg = avgX(r.getPhysicalMeasurements(), "weight");
            weightVals.add(avg > 0 ? avg : DefectConstants.WEIGHT_CENTER);
        }
        results.put("weight", analyze(weightVals,
                DefectConstants.WEIGHT_CENTER, DefectConstants.WEIGHT_UCL, DefectConstants.WEIGHT_LCL));

        List<Double> circumVals = new ArrayList<>();
        for (InspectionRecord r : records) {
            double avg = avgX(r.getPhysicalMeasurements(), "circumference");
            circumVals.add(avg > 0 ? avg : DefectConstants.CIRCUM_CENTER);
        }
        results.put("circumference", analyze(circumVals,
                DefectConstants.CIRCUM_CENTER, DefectConstants.CIRCUM_UCL, DefectConstants.CIRCUM_LCL));

        List<Double> ventVals = new ArrayList<>();
        for (InspectionRecord r : records) {
            double avg = avgX(r.getPhysicalMeasurements(), "ventilation");
            ventVals.add(avg > 0 ? avg : DefectConstants.VENTILATION_CENTER);
        }
        results.put("ventilation", analyze(ventVals,
                DefectConstants.VENTILATION_CENTER, DefectConstants.VENTILATION_UCL, DefectConstants.VENTILATION_LCL));

        return results;
    }

    /** 取某个指标的所有测量的X均值 */
    private double avgX(List<PhysicalMeasurement> pms, String indicator) {
        if (pms == null || pms.isEmpty()) return 0;
        double sum = 0;
        int count = 0;
        for (PhysicalMeasurement pm : pms) {
            Double val = null;
            switch (indicator) {
                case "suction":       val = pm.getSuctionX();       break;
                case "weight":        val = pm.getWeightX();        break;
                case "circumference": val = pm.getCircumferenceX(); break;
                case "ventilation":   val = pm.getVentilationX();   break;
            }
            if (val != null && val != 0) { sum += val; count++; }
        }
        return count > 0 ? sum / count : 0;
    }

    private SPCResult analyze(List<Double> vals, double center, double ucl, double lcl) {
        SPCResult result = new SPCResult(vals, center, ucl, lcl);
        int n = vals.size();
        if (n == 0) return result;

        double sigma = (ucl - lcl) / 6.0;
        if (sigma <= 0) return result;

        double u2 = center + 2 * sigma;
        double l2 = center - 2 * sigma;
        double u1 = center + sigma;
        double l1 = center - sigma;

        Set<Integer> severeSet = new HashSet<>();
        Set<Integer> mildSet = new HashSet<>();

        // 规则1: 单点超出3σ控制限
        for (int i = 0; i < n; i++) {
            if (vals.get(i) > ucl || vals.get(i) < lcl) {
                severeSet.add(i);
                result.severe.add(new int[]{i, 1});
                result.severeDesc.add("规则1:超出3σ控制限");
            }
        }

        // 规则2: 连续9点在中心线同侧
        for (int i = 8; i < n; i++) {
            boolean allAbove = true, allBelow = true;
            for (int j = i - 8; j <= i; j++) {
                if (vals.get(j) <= center) allAbove = false;
                if (vals.get(j) >= center) allBelow = false;
            }
            if (allAbove || allBelow) {
                for (int j = i - 8; j <= i; j++) {
                    if (!severeSet.contains(j) && !mildSet.contains(j)) {
                        mildSet.add(j);
                        result.mild.add(new int[]{j, 2});
                        result.mildDesc.add("规则2:连续9点同侧");
                    }
                }
                break;
            }
        }

        // 规则3: 连续6点递增或递减
        for (int i = 5; i < n; i++) {
            boolean inc = true, dec = true;
            for (int j = i - 5; j < i; j++) {
                if (vals.get(j) >= vals.get(j + 1)) inc = false;
                if (vals.get(j) <= vals.get(j + 1)) dec = false;
            }
            if (inc || dec) {
                for (int j = i - 5; j <= i; j++) {
                    if (!severeSet.contains(j) && !mildSet.contains(j)) {
                        mildSet.add(j);
                        result.mild.add(new int[]{j, 3});
                        result.mildDesc.add(inc ? "规则3:连续6点上升趋势" : "规则3:连续6点下降趋势");
                    }
                }
                break;
            }
        }

        // 规则4: 连续14点交替升降
        for (int i = 13; i < n; i++) {
            boolean alt = true;
            for (int j = i - 12; j <= i - 1; j++) {
                double d1 = vals.get(j) - vals.get(j - 1);
                double d2 = vals.get(j + 1) - vals.get(j);
                if (d1 * d2 >= 0) { alt = false; break; }
            }
            if (alt) {
                for (int j = i - 13; j <= i; j++) {
                    if (!severeSet.contains(j) && !mildSet.contains(j)) {
                        mildSet.add(j);
                        result.mild.add(new int[]{j, 4});
                        result.mildDesc.add("规则4:连续交替升降");
                    }
                }
                break;
            }
        }

        // 规则5: 连续3点中2点超出2σ
        for (int i = 2; i < n; i++) {
            int above2 = 0, below2 = 0;
            for (int j = i - 2; j <= i; j++) {
                if (vals.get(j) > u2) above2++;
                if (vals.get(j) < l2) below2++;
            }
            if (above2 >= 2 || below2 >= 2) {
                for (int j = i - 2; j <= i; j++) {
                    if ((vals.get(j) > u2 || vals.get(j) < l2)
                            && !severeSet.contains(j) && !mildSet.contains(j)) {
                        mildSet.add(j);
                        result.mild.add(new int[]{j, 5});
                        result.mildDesc.add("规则5:3点中2点超2σ");
                    }
                }
                break;
            }
        }

        // 规则6: 连续5点中4点超出1σ
        for (int i = 4; i < n; i++) {
            int above1 = 0, below1 = 0;
            for (int j = i - 4; j <= i; j++) {
                if (vals.get(j) > u1) above1++;
                if (vals.get(j) < l1) below1++;
            }
            if (above1 >= 4 || below1 >= 4) {
                for (int j = i - 4; j <= i; j++) {
                    if ((vals.get(j) > u1 || vals.get(j) < l1)
                            && !severeSet.contains(j) && !mildSet.contains(j)) {
                        mildSet.add(j);
                        result.mild.add(new int[]{j, 6});
                        result.mildDesc.add("规则6:5点中4点超1σ");
                    }
                }
                break;
            }
        }

        // 规则7: 连续15点在1σ内
        for (int i = 14; i < n; i++) {
            boolean allIn = true;
            for (int j = i - 14; j <= i; j++) {
                if (vals.get(j) < l1 || vals.get(j) > u1) { allIn = false; break; }
            }
            if (allIn) {
                for (int j = i - 14; j <= i; j++) {
                    if (!severeSet.contains(j) && !mildSet.contains(j)) {
                        mildSet.add(j);
                        result.mild.add(new int[]{j, 7});
                        result.mildDesc.add("规则7:连续15点在1σ内");
                    }
                }
                break;
            }
        }

        // 规则8: 连续8点在1σ外两侧
        for (int i = 7; i < n; i++) {
            boolean allOut = true;
            for (int j = i - 7; j <= i; j++) {
                if (vals.get(j) >= l1 && vals.get(j) <= u1) { allOut = false; break; }
            }
            if (allOut) {
                for (int j = i - 7; j <= i; j++) {
                    if (!severeSet.contains(j) && !mildSet.contains(j)) {
                        mildSet.add(j);
                        result.mild.add(new int[]{j, 8});
                        result.mildDesc.add("规则8:连续8点在1σ外");
                    }
                }
                break;
            }
        }

        return result;
    }
}
