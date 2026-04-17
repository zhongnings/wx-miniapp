package com.yixinjr.loanminiapp;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

import com.yixinjr.loanminiapp.config.EsignProperties;
import com.yixinjr.loanminiapp.entry.RsaProperties;

@SpringBootApplication
@EnableConfigurationProperties({RsaProperties.class, EsignProperties.class})
@EnableAsync
@EnableScheduling
public class LoanMiniappApplication {
    public static void main(String[] args) {
        SpringApplication.run(LoanMiniappApplication.class, args);
    }
}


