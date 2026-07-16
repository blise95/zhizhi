package com.zjzy.quality.repository;

import com.zjzy.quality.entity.WarningLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * 预警日志 Repository
 */
@Repository
public interface WarningRepository extends JpaRepository<WarningLog, Long> {
}
