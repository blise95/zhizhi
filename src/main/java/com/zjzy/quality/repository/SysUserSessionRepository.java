package com.zjzy.quality.repository;

import com.zjzy.quality.entity.SysUserSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface SysUserSessionRepository extends JpaRepository<SysUserSession, Long> {
    Optional<SysUserSession> findByToken(String token);

    @Modifying(clearAutomatically = true)
    @Query("delete from SysUserSession s where s.token = ?1")
    void deleteByToken(String token);

    @Modifying(clearAutomatically = true)
    @Query("delete from SysUserSession s where s.expireAt < ?1")
    void deleteByExpireAtBefore(LocalDateTime time);
}
