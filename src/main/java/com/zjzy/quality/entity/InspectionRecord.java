package com.zjzy.quality.entity;

import com.fasterxml.jackson.annotation.JsonProperty;
import org.hibernate.annotations.Fetch;
import org.hibernate.annotations.FetchMode;

import javax.persistence.*;
import java.util.ArrayList;
import java.util.List;

/**
 * 质检记录实体类 (JPA Entity)
 * 对应 inspection_record 表
 */
@Entity
@Table(name = "inspection_record")
public class InspectionRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 10)
    private String date;

    @Column(length = 10)
    private String shift;

    @Column(name = "machine_id", length = 20)
    private String machineId;

    @Column(length = 20)
    private String team;

    @Column(name = "partner_site", length = 50)
    private String partnerSite;

    @Column(length = 50)
    private String brand;

    @Column(name = "sample_time", length = 10)
    private String sampleTime;

    @Column(name = "sample_ticket_no", length = 50)
    private String sampleTicketNo;

    @Column(name = "steel_stamp", length = 50)
    private String steelStamp;

    @Column(name = "tobacco_batch", length = 50)
    private String tobaccoBatch;

    // 烟支内在物测指标（1:N 拆分为子表）
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    @OneToMany(mappedBy = "inspection", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<PhysicalMeasurement> physicalMeasurements = new ArrayList<>();

    // 烟支外观缺陷
    @Column(name = "cigarette_a")
    private Integer cigaretteA;
    @Column(name = "cigarette_b")
    private Integer cigaretteB;
    @Column(name = "cigarette_c")
    private Integer cigaretteC;
    @Column(name = "cigarette_d")
    private Integer cigaretteD;

    // 盒装外观缺陷
    @Column(name = "box_small_a")
    private Integer boxSmallA;
    @Column(name = "box_small_b")
    private Integer boxSmallB;
    @Column(name = "box_small_c")
    private Integer boxSmallC;
    @Column(name = "box_small_d")
    private Integer boxSmallD;

    // 条装外观缺陷
    @Column(name = "carton_a")
    private Integer cartonA;
    @Column(name = "carton_b")
    private Integer cartonB;
    @Column(name = "carton_c")
    private Integer cartonC;
    @Column(name = "carton_d")
    private Integer cartonD;

    // 箱装外观缺陷
    @Column(name = "case_aa")
    private Integer caseAa;
    @Column(name = "case_ab")
    private Integer caseAb;
    @Column(name = "case_ac")
    private Integer caseAc;
    @Column(name = "case_ad")
    private Integer caseAd;

    @Column(name = "risk_level", length = 20)
    private String riskLevel;

    @Column(length = 50)
    private String uploader;

    @Column(name = "upload_time", length = 20)
    private String uploadTime;

    @OneToMany(mappedBy = "inspection", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @Fetch(FetchMode.SUBSELECT)
    private List<DefectDetail> defectDetails = new ArrayList<>();

    // ==================== 辅助方法 ====================

    public void addDefectDetail(DefectDetail detail) {
        defectDetails.add(detail);
        detail.setInspection(this);
    }

    public void addPhysicalMeasurement(PhysicalMeasurement pm) {
        physicalMeasurements.add(pm);
        pm.setInspection(this);
    }

    public int getTotalA() {
        return safe(cigaretteA) + safe(boxSmallA) + safe(cartonA) + safe(caseAa);
    }

    public int getTotalB() {
        return safe(cigaretteB) + safe(boxSmallB) + safe(cartonB) + safe(caseAb);
    }

    public int getTotalC() {
        return safe(cigaretteC) + safe(boxSmallC) + safe(cartonC) + safe(caseAc);
    }

    public int getTotalD() {
        return safe(cigaretteD) + safe(boxSmallD) + safe(cartonD) + safe(caseAd);
    }

    public int getTotalDefects() {
        return getTotalA() + getTotalB() + getTotalC() + getTotalD();
    }

    private int safe(Integer val) {
        return val == null ? 0 : val;
    }

    // ==================== Getter & Setter ====================

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getDate() { return date; }
    public void setDate(String date) { this.date = date; }

    public String getShift() { return shift; }
    public void setShift(String shift) { this.shift = shift; }

    public String getMachineId() { return machineId; }
    public void setMachineId(String machineId) { this.machineId = machineId; }

    public String getTeam() { return team; }
    public void setTeam(String team) { this.team = team; }

    public String getPartnerSite() { return partnerSite; }
    public void setPartnerSite(String partnerSite) { this.partnerSite = partnerSite; }

    public String getBrand() { return brand; }
    public void setBrand(String brand) { this.brand = brand; }

    public String getSampleTime() { return sampleTime; }
    public void setSampleTime(String sampleTime) { this.sampleTime = sampleTime; }

    public String getSampleTicketNo() { return sampleTicketNo; }
    public void setSampleTicketNo(String sampleTicketNo) { this.sampleTicketNo = sampleTicketNo; }

    public String getSteelStamp() { return steelStamp; }
    public void setSteelStamp(String steelStamp) { this.steelStamp = steelStamp; }

    public String getTobaccoBatch() { return tobaccoBatch; }
    public void setTobaccoBatch(String tobaccoBatch) { this.tobaccoBatch = tobaccoBatch; }

    public List<PhysicalMeasurement> getPhysicalMeasurements() { return physicalMeasurements; }
    public void setPhysicalMeasurements(List<PhysicalMeasurement> physicalMeasurements) { this.physicalMeasurements = physicalMeasurements; }

    public Integer getCigaretteA() { return cigaretteA; }
    public void setCigaretteA(Integer cigaretteA) { this.cigaretteA = cigaretteA; }
    public Integer getCigaretteB() { return cigaretteB; }
    public void setCigaretteB(Integer cigaretteB) { this.cigaretteB = cigaretteB; }
    public Integer getCigaretteC() { return cigaretteC; }
    public void setCigaretteC(Integer cigaretteC) { this.cigaretteC = cigaretteC; }
    public Integer getCigaretteD() { return cigaretteD; }
    public void setCigaretteD(Integer cigaretteD) { this.cigaretteD = cigaretteD; }

    public Integer getBoxSmallA() { return boxSmallA; }
    public void setBoxSmallA(Integer boxSmallA) { this.boxSmallA = boxSmallA; }
    public Integer getBoxSmallB() { return boxSmallB; }
    public void setBoxSmallB(Integer boxSmallB) { this.boxSmallB = boxSmallB; }
    public Integer getBoxSmallC() { return boxSmallC; }
    public void setBoxSmallC(Integer boxSmallC) { this.boxSmallC = boxSmallC; }
    public Integer getBoxSmallD() { return boxSmallD; }
    public void setBoxSmallD(Integer boxSmallD) { this.boxSmallD = boxSmallD; }

    public Integer getCartonA() { return cartonA; }
    public void setCartonA(Integer cartonA) { this.cartonA = cartonA; }
    public Integer getCartonB() { return cartonB; }
    public void setCartonB(Integer cartonB) { this.cartonB = cartonB; }
    public Integer getCartonC() { return cartonC; }
    public void setCartonC(Integer cartonC) { this.cartonC = cartonC; }
    public Integer getCartonD() { return cartonD; }
    public void setCartonD(Integer cartonD) { this.cartonD = cartonD; }

    public Integer getCaseAa() { return caseAa; }
    public void setCaseAa(Integer caseAa) { this.caseAa = caseAa; }
    public Integer getCaseAb() { return caseAb; }
    public void setCaseAb(Integer caseAb) { this.caseAb = caseAb; }
    public Integer getCaseAc() { return caseAc; }
    public void setCaseAc(Integer caseAc) { this.caseAc = caseAc; }
    public Integer getCaseAd() { return caseAd; }
    public void setCaseAd(Integer caseAd) { this.caseAd = caseAd; }

    public String getRiskLevel() { return riskLevel; }
    public void setRiskLevel(String riskLevel) { this.riskLevel = riskLevel; }

    public String getUploader() { return uploader; }
    public void setUploader(String uploader) { this.uploader = uploader; }

    public String getUploadTime() { return uploadTime; }
    public void setUploadTime(String uploadTime) { this.uploadTime = uploadTime; }

    public List<DefectDetail> getDefectDetails() { return defectDetails; }
    public void setDefectDetails(List<DefectDetail> defectDetails) { this.defectDetails = defectDetails; }
}
