package com.yixinjr.loanminiapp.dto.step;

import lombok.Data;

/**
 * 银行卡新增/修改 DTO
 */
@Data
public class Step5BankCardUpsertDTO {
    private String holderType;
    private String cardholderName;
    private String idType;
    private String idNumber;
    private String bankName;
    private String cardNumber;
    private String reservedMobile;
    /** 银行卡正面图片URL */
    private String cardFrontImage;
}


