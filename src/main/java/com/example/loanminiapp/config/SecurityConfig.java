package com.example.loanminiapp.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

import com.example.loanminiapp.security.RsaDecryptFilter;
import lombok.RequiredArgsConstructor;

@Configuration
@RequiredArgsConstructor
public class SecurityConfig {

    private final RsaDecryptFilter rsaDecryptFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .cors(Customizer.withDefaults())
                .authorizeHttpRequests(auth -> auth
                        // H5 前端资源（uni-app 构建的 H5 页面）
                        .antMatchers("/", "/index.html", "/main.js", "/static/**", "/hybrid/**").permitAll()
                        // 上传文件访问
                        .antMatchers("/uploads/**").permitAll()
                        // 公开 API（小程序和 H5 都可以访问）
                        .antMatchers("/auth/**", "/public/**", "/agreements/**", "/img/**").permitAll()
                        // 其他请求需要认证
                        .anyRequest().authenticated()
                )
                .httpBasic(httpBasic -> httpBasic.disable())
                .formLogin(formLogin -> formLogin.disable())
                .addFilterBefore(rsaDecryptFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    /**
     * 统一密码加密器：使用 BCrypt
     * - 存库时使用 encoder.encode(明文密码)
     * - 校验时使用 encoder.matches(明文密码, 加密串)
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}


