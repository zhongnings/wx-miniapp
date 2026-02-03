package com.example.loanminiapp.model;

import lombok.Data;

@Data
public class OrderProgressItem {
    private String stage;
    private String operator;
    private String time;
    private String remark;
}

