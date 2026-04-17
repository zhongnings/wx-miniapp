package com.yixinjr.loanminiapp.dto.step;

import lombok.Data;

/**
 * 银行卡信息
 */
@Data
public class Step5BankCardDTO {
    private Long id;
    private String bankName;
    private String cardholderName;
    private String cardNumber;
    private String holderType;
    private String idType;
    private String idNumber;
    private String reservedMobile;
    /** 银行卡正面图片URL */
    private String cardFrontImage;
}


