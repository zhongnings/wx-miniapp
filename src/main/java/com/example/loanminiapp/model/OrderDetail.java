package com.example.loanminiapp.model;

import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
public class OrderDetail {
    private Long id;
    private String borrowerName;
    private BigDecimal loanAmount;
    private String orderNo;
    private Integer orderStatus;
    private String orderStatusName;
    private Integer riskStatus;
    private Integer repaymentStatus;
    private String repaymentStatusName; // 还款状态名称（中文显示）
    private Integer signStatus;
    private String signStatusName; // 签署状态名称（中文显示）

    private LoanInfo loanInfo;
    private PersonInfo borrowerInfo;
    private PersonInfo coBorrowerInfo;
    private PersonInfo guarantorInfo;
    private BankCardInfo bankCardInfo;
    private List<AttachmentItem> attachments;
    private List<ContractItem> contracts;
    private VoucherInfo voucherInfo;

    @Data
    public static class LoanInfo {
        private String assigneeOrg;
        private String channelOrg;
        private String payMethod;
        private String productType;
        private String borrowerCategory;
        private String contractSignMode;
        private BigDecimal loanAmount;
        private String loanAmountUppercase;
        private Integer loanDays;
        private String startDate;
        private String endDate;
        private BigDecimal annualRate;
        private String signPlace;
        private String usage;
        private String repayMode;
        private String disputeWay;
        private String arbitrationOrg;
        private String isNotarization;
    }

    @Data
    public static class PersonInfo {
        private String idType;
        private String name;
        private String idNo;
        private String idIssueDate;
        private String idExpireDate;
        private String mobile;
        private String provinceCity;
        private String addressDetail;
        private String gender;
        private String birthday;
        private String maritalStatus;
        private String faceFrontUrl;
        private String faceBackUrl;
    }

    @Data
    public static class BankCardInfo {
        private Long id;
        private String holderType;
        private String accountName;
        private String idType;
        private String idNo;
        private String bankName;
        private String cardNo;
        private String reservedMobile;
        private String cardFrontUrl;
    }

    @Data
    public static class VoucherInfo {
        private BigDecimal amount;
        private String payee;
        private String payMethod;
        private String openBank;
        private String cardNo;
        private String remark;
    }
}

