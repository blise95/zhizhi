package com.zjzy.quality.config;

import com.zjzy.quality.controller.AuthController;
import com.zjzy.quality.entity.SysUser;
import com.zjzy.quality.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Optional;

@Component
public class AuthInterceptor implements HandlerInterceptor {

    @Autowired
    private AuthService authService;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler)
            throws IOException {
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            return true;
        }
        String uri = request.getRequestURI();
        String context = request.getContextPath() == null ? "" : request.getContextPath();
        String path = uri.startsWith(context) ? uri.substring(context.length()) : uri;
        if (path.startsWith("/api/auth/login") || path.startsWith("/api/auth/logout")) {
            return true;
        }

        Optional<SysUser> user = authService.findUserByToken(
                AuthController.extractToken(request.getHeader("Authorization")));
        if (!user.isPresent()) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json;charset=UTF-8");
            response.getWriter().write("{\"success\":false,\"message\":\"未登录或登录已过期\"}");
            return false;
        }
        request.setAttribute("currentUser", user.get());
        return true;
    }
}
