package com.example.loanminiapp.entry;

import org.springframework.boot.context.properties.ConfigurationProperties;

import lombok.Data;

@Data
@ConfigurationProperties(prefix = "rsa")
public class RsaProperties {
    private String publicKey;
    private String privateKey;
}
