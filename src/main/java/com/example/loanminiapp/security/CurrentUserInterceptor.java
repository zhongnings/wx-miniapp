package com.example.loanminiapp.security;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

@Slf4j
@Component
public class CurrentUserInterceptor implements HandlerInterceptor {

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        String token = request.getHeader("X-Token");
        String userIdStr = request.getHeader("X-User-Id");
        String rolesStr = request.getHeader("X-Roles");

        CurrentUser currentUser = new CurrentUser();
        currentUser.setToken(token);
        try {
            if (userIdStr != null && !userIdStr.isEmpty()) {
                currentUser.setUserId(Long.parseLong(userIdStr));
            }
        } catch (NumberFormatException e) {
            log.warn("Invalid X-User-Id header: {}", userIdStr);
        }
        List<String> roles = (rolesStr == null || rolesStr.isEmpty())
                ? Collections.emptyList()
                : Arrays.asList(rolesStr.split(","));
        currentUser.setRoles(roles);

        CurrentUserContext.set(currentUser);
        return true;
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) {
        CurrentUserContext.clear();
    }
}



