package com.zjzy.quality.controller;

import com.zjzy.quality.entity.SysUser;
import com.zjzy.quality.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthService authService;

    @PostMapping("/login")
    public Map<String, Object> login(@RequestBody Map<String, Object> body) {
        String username = body.get("username") == null ? "" : String.valueOf(body.get("username"));
        String password = body.get("password") == null ? "" : String.valueOf(body.get("password"));
        boolean rememberMe = Boolean.TRUE.equals(body.get("rememberMe"))
                || "true".equalsIgnoreCase(String.valueOf(body.get("rememberMe")));
        return authService.login(username, password, rememberMe);
    }

    @GetMapping("/me")
    public ResponseEntity<Map<String, Object>> me(
            @RequestHeader(value = "Authorization", required = false) String authorization) {
        Optional<SysUser> user = authService.findUserByToken(extractToken(authorization));
        if (!user.isPresent()) {
            Map<String, Object> err = new LinkedHashMap<>();
            err.put("success", false);
            err.put("message", "未登录或登录已过期");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(err);
        }
        return ResponseEntity.ok(authService.toProfile(user.get()));
    }

    @PostMapping("/logout")
    public Map<String, Object> logout(
            @RequestHeader(value = "Authorization", required = false) String authorization) {
        authService.logout(extractToken(authorization));
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("success", true);
        return result;
    }

    public static String extractToken(String authorization) {
        if (authorization == null) {
            return null;
        }
        String value = authorization.trim();
        if (value.regionMatches(true, 0, "Bearer ", 0, 7)) {
            return value.substring(7).trim();
        }
        return value;
    }
}
