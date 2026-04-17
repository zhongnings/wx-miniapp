package com.yixinjr.loanminiapp.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * 通用电子签平台配置（当前对接 e签宝公有云 HTTP API）。
 */
@Data
@ConfigurationProperties(prefix = "esign")
public class EsignProperties {
    private boolean enabled = false;
    private String appId = "";
    private String appSecret = "";
    private String projectId = "";
    private String apiBaseUrl = "";
    private String qrImageBaseUrl = "https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=";
    private String notifyUrl = "";
    private String redirectUrl = "https://www.esign.cn/";
}

