package com.example.loanminiapp.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Data
@Component
@ConfigurationProperties(prefix = "auth.register")
public class AuthRegisterProperties {
    /**
     * 开启后：注册时必须命中白名单。
     */
    private boolean allowlistEnabled = true;

    /**
     * 固定用户名白名单（优先级高于 DB 表）。
     * 为空时回落查 sys_register_allowlist。
     */
    private List<String> allowedUsernames = new ArrayList<>();
}

