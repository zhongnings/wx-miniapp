package com.yixinjr.loanminiapp.model;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class OrderSummary {
    private Long id;
    private String borrowerName;
    private BigDecimal loanAmount;
    private LocalDate loanDate;
    private String orderNo;
    private Integer orderStatus;
    private String orderStatusName; // 订单状态名称（中文显示）
    private Integer riskStatus;
    private String riskStatusName; // 风控状态名称（中文显示）
    private Integer repaymentStatus;
    private String repaymentStatusName; // 还款状态名称（中文显示）
    private Integer signStatus;
    private String signStatusName; // 签署状态名称（中文显示）
}

