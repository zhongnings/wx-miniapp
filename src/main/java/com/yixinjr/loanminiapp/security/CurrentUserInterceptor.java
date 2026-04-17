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
 * 用户上下文拦截器
 * 从请求头 X-Token 中解析 Token，通过 Redis 获取用户信息并写入 CurrentUserContext。
 * Token 无效或过期时返回 401，由前端统一跳转登录页。
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class CurrentUserInterceptor implements HandlerInterceptor {

    private final TokenService tokenService;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        String token = request.getHeader("X-Token");

        // 无 Token：不写入上下文，由业务层 @OrderAccessCheck 决定是否拒绝
        if (token == null || token.isEmpty()) {
            return true;
        }

        // Token 无效或已过期：返回 401，前端统一跳登录页
        if (!tokenService.validateToken(token)) {
            log.warn("Token 无效或已过期: uri={}", request.getRequestURI());
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json;charset=UTF-8");
            response.getWriter().write("{\"code\":401,\"message\":\"登录已过期，请重新登录\"}");
            return false;
        }

        try {
            Map<Object, Object> tokenInfo = tokenService.getTokenInfo(token);
            if (tokenInfo == null || tokenInfo.isEmpty()) {
                log.warn("Token Redis 信息为空: uri={}", request.getRequestURI());
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                response.setContentType("application/json;charset=UTF-8");
                response.getWriter().write("{\"code\":401,\"message\":\"登录已过期，请重新登录\"}");
                return false;
            }

            Long userId = ((Number) tokenInfo.get("userId")).longValue();
            @SuppressWarnings("unchecked")
            List<String> roles = (List<String>) tokenInfo.get("roles");
            @SuppressWarnings("unchecked")
            List<String> permissions = (List<String>) tokenInfo.get("permissions");

            CurrentUser currentUser = new CurrentUser();
            currentUser.setToken(token);
            currentUser.setUserId(userId);
            currentUser.setRoles(roles);
            currentUser.setPermissions(permissions);
            CurrentUserContext.set(currentUser);

            log.debug("用户上下文已设置: userId={}, roles={}", userId, roles);
        } catch (Exception e) {
            log.error("解析 Token 异常: {}", e.getMessage());
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json;charset=UTF-8");
            response.getWriter().write("{\"code\":401,\"message\":\"Token 解析失败，请重新登录\"}");
            return false;
        }

        return true;
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) {
        CurrentUserContext.clear();
    }
}
