package com.zjzy.quality.repository;

import com.zjzy.quality.entity.InspectionRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * 质检记录 Repository
 */
@Repository
public interface InspectionRepository extends JpaRepository<InspectionRecord, Long> {

    /** 按日期范围查询 */
    List<InspectionRecord> findByDateBetween(String startDate, String endDate);

    /** 按日期范围查询（降序） */
    List<InspectionRecord> findByDateBetweenOrderByIdDesc(String startDate, String endDate);

    /** 按日期查询（自然排序） */
    List<InspectionRecord> findByDateOrderByIdAsc(String date);

    /** 全量查询（降序） */
    List<InspectionRecord> findAllByOrderByIdDesc();

    /** 查询最新一条记录 */
    InspectionRecord findTopByOrderByIdDesc();
}
