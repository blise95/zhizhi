package com.zjzy.quality.repository;

import com.zjzy.quality.entity.DefectDetail;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * 缺陷明细 Repository
 * 用于按模块、日期范围查询 defect_detail 详细数据
 */
@Repository
public interface DefectDetailRepository extends JpaRepository<DefectDetail, Long> {

    /**
     * 按模块查询所有缺陷明细
     */
    List<DefectDetail> findByModule(String module);

    /**
     * 按质检记录 ID 列表批量查询缺陷明细（用于筛选后的TOP缺陷统计）
     */
    @Query("SELECT d FROM DefectDetail d WHERE d.inspection.id IN :ids")
    List<DefectDetail> findByInspectionIdIn(@Param("ids") List<Long> ids);
}
