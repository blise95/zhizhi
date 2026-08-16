package com.zjzy.quality.repository;

import com.zjzy.quality.entity.AppRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AppRecordRepository extends JpaRepository<AppRecord, Long> {
    List<AppRecord> findByRecordTypeOrderByIdDesc(String recordType);
}
