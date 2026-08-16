package com.zjzy.quality.repository;

import com.zjzy.quality.entity.SysUserSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface SysUserSessionRepository extends JpaRepository<SysUserSession, Long> {
    Optional<SysUserSession> findByToken(String token);
    void deleteByToken(String token);
    void deleteByExpireAtBefore(LocalDateTime time);
}
