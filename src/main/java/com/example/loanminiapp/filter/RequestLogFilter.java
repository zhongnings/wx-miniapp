package com.example.loanminiapp.filter;

import com.example.loanminiapp.security.CurrentUser;
import com.example.loanminiapp.security.CurrentUserContext;
import com.example.loanminiapp.security.CachedBodyHttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.util.StreamUtils;

import javax.servlet.*;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

/**
 * 通用请求日志过滤器
 * 记录：IP、方法、URI、查询参数、Body（尽量简要）、当前用户等信息，方便排查问题
 */
@Slf4j
@Component
public class RequestLogFilter implements Filter {

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        HttpServletRequest req = (HttpServletRequest) request;
        HttpServletResponse resp = (HttpServletResponse) response;

        long start = System.currentTimeMillis();
        String ip = getClientIp(req);
        String method = req.getMethod();
        String uri = req.getRequestURI();
        String query = req.getQueryString();

        Map<String, String[]> params = req.getParameterMap();
        Map<String, Object> simpleParams = new HashMap<>();
        params.forEach((k, v) -> simpleParams.put(k, v != null && v.length == 1 ? v[0] : v));

        // 当前用户信息
        CurrentUser cu = CurrentUserContext.get();

        // 尝试读取 body，并使用 CachedBodyHttpServletRequest 包装，避免影响后续 @RequestBody 读取
        String body = null;
        HttpServletRequest wrappedRequest = req;
        if ("POST".equalsIgnoreCase(method) || "PUT".equalsIgnoreCase(method) || "PATCH".equalsIgnoreCase(method)) {
            try {
                byte[] bodyBytes = StreamUtils.copyToByteArray(req.getInputStream());
                wrappedRequest = new CachedBodyHttpServletRequest(req, bodyBytes);
                body = new String(bodyBytes, StandardCharsets.UTF_8);
                if (body != null && body.length() > 1000) {
                    body = body.substring(0, 1000) + "...(truncated)";
                }
            } catch (Exception ignore) {
                body = null;
            }
        }

        log.info("REQUEST START: ip={}, method={}, uri={}, query={}, params={}, body={}, userId={}, roles={}",
                ip, method, uri, query, simpleParams,
                body, cu == null ? null : cu.getUserId(), cu == null ? Collections.emptyList() : cu.getRoles());

        try {
            // 使用 wrappedRequest，保证后续 Filter / Controller 还能正常读取 body
            chain.doFilter(wrappedRequest, response);
        } finally {
            long cost = System.currentTimeMillis() - start;
            log.info("REQUEST END: uri={}, status={}, costMs={}", uri, resp.getStatus(), cost);
        }
    }

    private String getClientIp(HttpServletRequest request) {
        String[] headerNames = {
                "X-Forwarded-For",
                "X-Real-IP",
                "Proxy-Client-IP",
                "WL-Proxy-Client-IP",
                "HTTP_CLIENT_IP",
                "HTTP_X_FORWARDED_FOR"
        };
        for (String header : headerNames) {
            String ip = request.getHeader(header);
            if (ip != null && ip.length() != 0 && !"unknown".equalsIgnoreCase(ip)) {
                // X-Forwarded-For 可能包含多个 IP，取第一个
                int idx = ip.indexOf(',');
                return idx > 0 ? ip.substring(0, idx).trim() : ip.trim();
            }
        }
        return request.getRemoteAddr();
    }
}


