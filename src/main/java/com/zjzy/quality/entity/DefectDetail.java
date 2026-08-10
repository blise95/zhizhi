package com.zjzy.quality.entity;

import javax.persistence.*;

/**
 * 缺陷明细实体类 (JPA Entity)
 * 对应 defect_detail 表，1:N 关联 inspection_record
 */
@Entity
@Table(name = "defect_detail")
public class DefectDetail {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "inspection_id", nullable = false)
    private InspectionRecord inspection;

    @Column(length = 20)
    private String module;

    @Column(name = "body_part", length = 50)
    private String bodyPart;

    @Column(length = 10)
    private String code;

    @Column(length = 100)
    private String name;

    @Column(length = 2)
    private String grade;

    private Integer count = 1;

    // ==================== Getter & Setter ====================

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public InspectionRecord getInspection() { return inspection; }
    public void setInspection(InspectionRecord inspection) { this.inspection = inspection; }

    public String getModule() { return module; }
    public void setModule(String module) { this.module = module; }

    public String getBodyPart() { return bodyPart; }
    public void setBodyPart(String bodyPart) { this.bodyPart = bodyPart; }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getGrade() { return grade; }
    public void setGrade(String grade) { this.grade = grade; }

    public Integer getCount() { return count; }
    public void setCount(Integer count) { this.count = count; }
}
