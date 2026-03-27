package com.example.loanminiapp.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Data
@Component
@ConfigurationProperties(prefix = "security.auth")
public class AuthExcludeProperties {
    /**
     * CurrentUserInterceptor 免 token 校验接口
     */
    private List<String> excludePaths = new ArrayList<>();
}
