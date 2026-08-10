package com.zjzy.quality.entity;

import com.fasterxml.jackson.annotation.JsonProperty;
import javax.persistence.*;

/**
 * 烟支内在物测指标子表（1:N 关联 InspectionRecord）
 * 每条记录 = 一次测量的全部4指标×4统计量（X/SD/MAX/MIN）
 */
@Entity
@Table(name = "physical_measurement")
public class PhysicalMeasurement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "inspection_id", nullable = false)
    private InspectionRecord inspection;

    @Column(name = "seq_no")
    private Integer seqNo;

    @Column(name = "measure_time", length = 10)
    private String measureTime;

    // ==================== 重量(g) ====================
    @Column(name = "weight_x")
    private Double weightX;
    @Column(name = "weight_sd")
    private Double weightSd;
    @Column(name = "weight_max")
    private Double weightMax;
    @Column(name = "weight_min")
    private Double weightMin;

    // ==================== 圆周(mm) ====================
    @Column(name = "circumference_x")
    private Double circumferenceX;
    @Column(name = "circumference_sd")
    private Double circumferenceSd;
    @Column(name = "circumference_max")
    private Double circumferenceMax;
    @Column(name = "circumference_min")
    private Double circumferenceMin;

    // ==================== 吸阻(Pa) ====================
    @Column(name = "suction_x")
    private Double suctionX;
    @Column(name = "suction_sd")
    private Double suctionSd;
    @Column(name = "suction_max")
    private Double suctionMax;
    @Column(name = "suction_min")
    private Double suctionMin;

    // ==================== 通风度/长度 ====================
    @Column(name = "ventilation_x")
    private Double ventilationX;
    @Column(name = "ventilation_sd")
    private Double ventilationSd;
    @Column(name = "ventilation_max")
    private Double ventilationMax;
    @Column(name = "ventilation_min")
    private Double ventilationMin;

    // ==================== Getter & Setter ====================

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public InspectionRecord getInspection() { return inspection; }
    public void setInspection(InspectionRecord inspection) { this.inspection = inspection; }

    public Integer getSeqNo() { return seqNo; }
    public void setSeqNo(Integer seqNo) { this.seqNo = seqNo; }

    public String getMeasureTime() { return measureTime; }
    public void setMeasureTime(String measureTime) { this.measureTime = measureTime; }

    public Double getWeightX() { return weightX; }
    public void setWeightX(Double weightX) { this.weightX = weightX; }
    public Double getWeightSd() { return weightSd; }
    public void setWeightSd(Double weightSd) { this.weightSd = weightSd; }
    public Double getWeightMax() { return weightMax; }
    public void setWeightMax(Double weightMax) { this.weightMax = weightMax; }
    public Double getWeightMin() { return weightMin; }
    public void setWeightMin(Double weightMin) { this.weightMin = weightMin; }

    public Double getCircumferenceX() { return circumferenceX; }
    public void setCircumferenceX(Double circumferenceX) { this.circumferenceX = circumferenceX; }
    public Double getCircumferenceSd() { return circumferenceSd; }
    public void setCircumferenceSd(Double circumferenceSd) { this.circumferenceSd = circumferenceSd; }
    public Double getCircumferenceMax() { return circumferenceMax; }
    public void setCircumferenceMax(Double circumferenceMax) { this.circumferenceMax = circumferenceMax; }
    public Double getCircumferenceMin() { return circumferenceMin; }
    public void setCircumferenceMin(Double circumferenceMin) { this.circumferenceMin = circumferenceMin; }

    public Double getSuctionX() { return suctionX; }
    public void setSuctionX(Double suctionX) { this.suctionX = suctionX; }
    public Double getSuctionSd() { return suctionSd; }
    public void setSuctionSd(Double suctionSd) { this.suctionSd = suctionSd; }
    public Double getSuctionMax() { return suctionMax; }
    public void setSuctionMax(Double suctionMax) { this.suctionMax = suctionMax; }
    public Double getSuctionMin() { return suctionMin; }
    public void setSuctionMin(Double suctionMin) { this.suctionMin = suctionMin; }

    public Double getVentilationX() { return ventilationX; }
    public void setVentilationX(Double ventilationX) { this.ventilationX = ventilationX; }
    public Double getVentilationSd() { return ventilationSd; }
    public void setVentilationSd(Double ventilationSd) { this.ventilationSd = ventilationSd; }
    public Double getVentilationMax() { return ventilationMax; }
    public void setVentilationMax(Double ventilationMax) { this.ventilationMax = ventilationMax; }
    public Double getVentilationMin() { return ventilationMin; }
    public void setVentilationMin(Double ventilationMin) { this.ventilationMin = ventilationMin; }
}
