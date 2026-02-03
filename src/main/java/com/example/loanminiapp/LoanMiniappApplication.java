package com.example.loanminiapp;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

import com.example.loanminiapp.entry.RsaProperties;

@SpringBootApplication
@EnableConfigurationProperties(RsaProperties.class)
public class LoanMiniappApplication {
    public static void main(String[] args) {
        SpringApplication.run(LoanMiniappApplication.class, args);
    }
}


