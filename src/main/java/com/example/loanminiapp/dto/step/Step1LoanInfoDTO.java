package com.example.loanminiapp.dto.step;

import lombok.Data;

import java.math.BigDecimal;

/**
 * 步骤1：借款信息
 */
@Data
public class Step1LoanInfoDTO {
    private Long orderId;
    private String assigneeOrg;
    private String microloanOrg;
    private String paymentChannel;
    private String productType;
    private String borrowerType;
    private String contractSignMode;
    private String signMethod;
    private BigDecimal loanAmount;
    private String loanAmountUppercase;
    private Integer loanDays;
    private String startDate;
    private String endDate;
    private BigDecimal annualRate;
    private String signPlace;
    private String loanPurpose;
    private String repaymentMethod;
    private String disputeResolution;
    private String arbitrationOrg;
    private String isNotarization;
    private BigDecimal penaltyRatio;
    private String notarizationType;
    private String notarizationItem;
    private String appointmentTime;
    private String certificateReceiveMethod;
}


