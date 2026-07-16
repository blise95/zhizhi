package com.zjzy.quality.entity;

import javax.persistence.*;

/**
 * 预警日志实体类 (JPA Entity)
 * 仅记录触发A/B/C类的预警信息，文本格式可直接用于QC和质量追溯报告
 */
@Entity
@Table(name = "warning_log")
public class WarningLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "occur_time", length = 20)
    private String occurTime;

    @Column(length = 10)
    private String date;

    @Column(length = 20)
    private String team;

    @Column(name = "machine_id", length = 20)
    private String machineId;

    @Column(name = "defect_level", length = 2)
    private String defectLevel;

    @Column(name = "defect_count")
    private Integer defectCount;

    @Column(length = 500)
    private String description;

    // ==================== Getter & Setter ====================

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getOccurTime() { return occurTime; }
    public void setOccurTime(String occurTime) { this.occurTime = occurTime; }

    public String getDate() { return date; }
    public void setDate(String date) { this.date = date; }

    public String getTeam() { return team; }
    public void setTeam(String team) { this.team = team; }

    public String getMachineId() { return machineId; }
    public void setMachineId(String machineId) { this.machineId = machineId; }

    public String getDefectLevel() { return defectLevel; }
    public void setDefectLevel(String defectLevel) { this.defectLevel = defectLevel; }

    public Integer getDefectCount() { return defectCount; }
    public void setDefectCount(Integer defectCount) { this.defectCount = defectCount; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
}
