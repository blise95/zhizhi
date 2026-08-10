package com.zjzy.quality.service;

import com.zjzy.quality.constant.DefectConstants;
import com.zjzy.quality.entity.InspectionRecord;
import com.zjzy.quality.repository.InspectionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.text.SimpleDateFormat;
import java.util.*;

/**
 * AI预测服务
 * 使用Holt双参数指数平滑进行时序预测
 */
@Service
public class PredictionService {

    @Autowired
    private InspectionRepository inspectionRepo;

    private static final double ALPHA = 0.3;
    private static final double BETA = 0.1;
    private static final int PREDICT_DAYS = 7;

    public static class PredictionResult {
        public List<String> historyDates;
        public List<Double> historyRates;
        public List<String> predDates;
        public List<Double> predYhat;
        public List<Double> predUpper;
        public List<Double> predLower;
        public boolean hasRisk;
        public String riskMsg;

        public PredictionResult() {
            historyDates = new ArrayList<>();
            historyRates = new ArrayList<>();
            predDates = new ArrayList<>();
            predYhat = new ArrayList<>();
            predUpper = new ArrayList<>();
            predLower = new ArrayList<>();
            hasRisk = false;
            riskMsg = "";
        }
    }

    public PredictionResult predict() {
        PredictionResult result = new PredictionResult();
        List<InspectionRecord> all = inspectionRepo.findAll();
        if (all.size() < 2) return result;

        Map<String, DaySummary> dailyMap = new LinkedHashMap<>();
        for (InspectionRecord r : all) {
            String date = r.getDate();
            DaySummary ds = dailyMap.get(date);
            if (ds == null) {
                ds = new DaySummary();
                ds.date = date;
                dailyMap.put(date, ds);
            }
            ds.totalDefects += r.getTotalDefects();
            ds.abDefects += r.getTotalA() + r.getTotalB();
        }

        List<DaySummary> dailyList = new ArrayList<>(dailyMap.values());
        if (dailyList.size() < 2) return result;

        List<Double> rates = new ArrayList<>();
        List<String> dates = new ArrayList<>();
        List<Double> abRates = new ArrayList<>();
        for (DaySummary ds : dailyList) {
            dates.add(ds.date);
            double rate = ds.totalDefects;
            rates.add(rate);
            double abRate = ds.abDefects;
            abRates.add(abRate);
        }

        result.historyDates = dates;
        result.historyRates = rates;

        double level = rates.get(0);
        double trend = rates.size() > 1 ? rates.get(1) - rates.get(0) : 0.0;

        List<Double> fitted = new ArrayList<>();
        fitted.add(level);
        for (int i = 1; i < rates.size(); i++) {
            double newLevel = ALPHA * rates.get(i) + (1 - ALPHA) * (level + trend);
            double newTrend = BETA * (newLevel - level) + (1 - BETA) * trend;
            level = newLevel;
            trend = newTrend;
            fitted.add(level);
        }

        double sse = 0.0;
        for (int i = 0; i < rates.size(); i++) {
            double residual = rates.get(i) - fitted.get(i);
            sse += residual * residual;
        }
        double se = Math.sqrt(sse / Math.max(1, rates.size() - 1));

        Calendar cal = Calendar.getInstance();
        try {
            SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd");
            cal.setTime(sdf.parse(dates.get(dates.size() - 1)));
        } catch (Exception e) {
            cal.setTime(new Date());
        }

        for (int i = 1; i <= PREDICT_DAYS; i++) {
            cal.add(Calendar.DAY_OF_MONTH, 1);
            SimpleDateFormat sdf2 = new SimpleDateFormat("yyyy-MM-dd");
            result.predDates.add(sdf2.format(cal.getTime()));

            double yhat = Math.max(0, level + trend * i);
            result.predYhat.add(yhat);
            result.predUpper.add(yhat + 1.96 * se);
            result.predLower.add(Math.max(0, yhat - 1.96 * se));
        }

        double recentAvgRate = 0;
        int recentN = Math.min(5, rates.size());
        for (int i = rates.size() - recentN; i < rates.size(); i++) {
            recentAvgRate += rates.get(i);
        }
        recentAvgRate /= recentN;

        double recentAvgAB = 0;
        for (int i = abRates.size() - recentN; i < abRates.size(); i++) {
            recentAvgAB += abRates.get(i);
        }
        recentAvgAB /= recentN;

        double predMax = 0;
        for (double v : result.predUpper) {
            if (v > predMax) predMax = v;
        }

        if (predMax > recentAvgRate * 1.5 && recentAvgAB > 0) {
            result.hasRisk = true;
            result.riskMsg = "预判存在批量质量风险";
        }

        return result;
    }

    private static class DaySummary {
        String date;
        int totalDefects = 0;
        int abDefects = 0;
    }
}
