package com.yixinjr.loanminiapp.security;

import com.yixinjr.loanminiapp.service.TokenService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.util.List;
import java.util.Map;

/**
 * JWT认证拦截器（基于Redis）
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class JwtAuthenticationInterceptor implements HandlerInterceptor {

    private final TokenService tokenService;
    private final JwtUtil jwtUtil;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        // 从请求头获取Token
        String token = request.getHeader("X-Token");
        
        if (token == null || token.isEmpty()) {
            log.warn("请求未携带Token: {}", request.getRequestURI());
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json;charset=UTF-8");
            response.getWriter().write("{\"code\":401,\"message\":\"未登录或登录已过期\"}");
            return false;
        }

        try {
            // 验证Token（检查JWT和Redis）
            if (!tokenService.validateToken(token)) {
                log.warn("Token无效或已过期: {}", token.substring(0, Math.min(20, token.length())));
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                response.setContentType("application/json;charset=UTF-8");
                response.getWriter().write("{\"code\":401,\"message\":\"登录已过期，请重新登录\"}");
                return false;
            }

            // 从Redis获取Token信息
            Map<Object, Object> tokenInfo = tokenService.getTokenInfo(token);
            Long userId = ((Number) tokenInfo.get("userId")).longValue();
            @SuppressWarnings("unchecked")
            List<String> roles = (List<String>) tokenInfo.get("roles");
            @SuppressWarnings("unchecked")
            List<String> permissions = (List<String>) tokenInfo.get("permissions");

            // 设置到上下文
            CurrentUser currentUser = new CurrentUser();
            currentUser.setToken(token);
            currentUser.setUserId(userId);
            currentUser.setRoles(roles);
            currentUser.setPermissions(permissions);

            CurrentUserContext.set(currentUser);
            
            // 如果Token即将过期（5分钟内），自动刷新
            if (tokenService.isTokenExpiringSoon(token)) {
                tokenService.refreshToken(token);
                log.info("Token即将过期，已自动刷新: userId={}", userId);
            }
            
            log.debug("Token验证成功: userId={}, roles={}", userId, roles);
            return true;

        } catch (Exception e) {
            log.error("Token验证失败: {}", e.getMessage());
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json;charset=UTF-8");
            response.getWriter().write("{\"code\":401,\"message\":\"Token无效\"}");
            return false;
        }
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) {
        CurrentUserContext.clear();
    }
}

