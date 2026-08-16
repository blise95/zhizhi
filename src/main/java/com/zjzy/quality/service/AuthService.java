package com.zjzy.quality.service;

import com.zjzy.quality.entity.SysUser;
import com.zjzy.quality.entity.SysUserSession;
import com.zjzy.quality.repository.SysUserRepository;
import com.zjzy.quality.repository.SysUserSessionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.annotation.PostConstruct;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
public class AuthService {

    public static final String DEFAULT_USERNAME = "chenyu";
    public static final String DEFAULT_PASSWORD = "chenyu312";

    @Autowired
    private SysUserRepository userRepository;

    @Autowired
    private SysUserSessionRepository sessionRepository;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @PostConstruct
    public void init() {
        jdbcTemplate.execute(
                "CREATE TABLE IF NOT EXISTS sys_user (" +
                        "id BIGINT NOT NULL AUTO_INCREMENT," +
                        "username VARCHAR(50) NOT NULL," +
                        "password VARCHAR(100) NOT NULL," +
                        "display_name VARCHAR(50) NOT NULL DEFAULT ''," +
                        "role VARCHAR(20) NOT NULL DEFAULT '用户'," +
                        "enabled TINYINT NOT NULL DEFAULT 1," +
                        "created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP," +
                        "PRIMARY KEY (id)," +
                        "UNIQUE KEY uk_username (username)" +
                        ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
        );
        jdbcTemplate.execute(
                "CREATE TABLE IF NOT EXISTS sys_user_session (" +
                        "id BIGINT NOT NULL AUTO_INCREMENT," +
                        "token VARCHAR(64) NOT NULL," +
                        "user_id BIGINT NOT NULL," +
                        "expire_at DATETIME NOT NULL," +
                        "created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP," +
                        "PRIMARY KEY (id)," +
                        "UNIQUE KEY uk_token (token)," +
                        "INDEX idx_user (user_id)," +
                        "INDEX idx_expire (expire_at)" +
                        ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
        );
        try {
            jdbcTemplate.execute(
                    "ALTER TABLE sys_user CHANGE COLUMN password_hash password VARCHAR(100) NOT NULL"
            );
        } catch (Exception ignored) {
            // 新表已是 password 列
        }
        if (userRepository.count() == 0) {
            SysUser admin = new SysUser();
            admin.setUsername(DEFAULT_USERNAME);
            admin.setPassword(DEFAULT_PASSWORD);
            admin.setDisplayName("陈宇");
            admin.setRole("管理员");
            admin.setEnabled(true);
            userRepository.save(admin);
        } else {
            userRepository.findByUsername(DEFAULT_USERNAME).ifPresent(user -> {
                String stored = user.getPassword();
                if (stored != null && stored.startsWith("$2")) {
                    user.setPassword(DEFAULT_PASSWORD);
                    userRepository.save(user);
                }
            });
        }
    }

    @Transactional
    public Map<String, Object> login(String username, String password, boolean rememberMe) {
        Map<String, Object> result = new LinkedHashMap<>();
        if (username == null || password == null || username.trim().isEmpty() || password.isEmpty()) {
            result.put("success", false);
            result.put("message", "请输入用户名和密码");
            return result;
        }

        Optional<SysUser> found = userRepository.findByUsername(username.trim());
        if (!found.isPresent() || !Boolean.TRUE.equals(found.get().getEnabled())
                || found.get().getPassword() == null
                || !found.get().getPassword().equals(password)) {
            result.put("success", false);
            result.put("message", "用户名或密码错误");
            return result;
        }

        SysUser user = found.get();
        sessionRepository.deleteByExpireAtBefore(LocalDateTime.now());

        String token = UUID.randomUUID().toString().replace("-", "")
                + UUID.randomUUID().toString().replace("-", "").substring(0, 16);
        SysUserSession session = new SysUserSession();
        session.setToken(token);
        session.setUserId(user.getId());
        session.setExpireAt(LocalDateTime.now().plusDays(rememberMe ? 30 : 7));
        sessionRepository.save(session);

        result.put("success", true);
        result.put("token", token);
        result.put("username", user.getUsername());
        result.put("displayName", user.getDisplayName() == null || user.getDisplayName().isEmpty()
                ? user.getUsername() : user.getDisplayName());
        result.put("role", user.getRole());
        return result;
    }

    @Transactional(readOnly = true)
    public Optional<SysUser> findUserByToken(String token) {
        if (token == null || token.trim().isEmpty()) {
            return Optional.empty();
        }
        Optional<SysUserSession> session = sessionRepository.findByToken(token.trim());
        if (!session.isPresent() || session.get().getExpireAt().isBefore(LocalDateTime.now())) {
            return Optional.empty();
        }
        return userRepository.findById(session.get().getUserId())
                .filter(u -> Boolean.TRUE.equals(u.getEnabled()));
    }

    @Transactional
    public void logout(String token) {
        if (token != null && !token.trim().isEmpty()) {
            sessionRepository.deleteByToken(token.trim());
        }
    }

    public Map<String, Object> toProfile(SysUser user) {
        Map<String, Object> profile = new LinkedHashMap<>();
        profile.put("success", true);
        profile.put("username", user.getUsername());
        profile.put("displayName", user.getDisplayName() == null || user.getDisplayName().isEmpty()
                ? user.getUsername() : user.getDisplayName());
        profile.put("role", user.getRole());
        return profile;
    }
}
