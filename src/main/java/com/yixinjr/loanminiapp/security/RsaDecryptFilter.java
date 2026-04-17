package com.yixinjr.loanminiapp.security;

import javax.servlet.FilterChain;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * 历史遗留的 RSA 解密过滤器。
 * 目前前端已不再使用 cipherText，加密逻辑已下线，本过滤器仅做透传。
 */
@Slf4j
@Component
public class RsaDecryptFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        // 目前不再做任何解密逻辑，直接透传请求
        filterChain.doFilter(request, response);
    }
}

