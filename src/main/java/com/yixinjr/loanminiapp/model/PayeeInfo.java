package com.yixinjr.loanminiapp.model;

import lombok.Data;

/**
 * 收款方信息
 */
@Data
public class PayeeInfo {
    /** 收款方姓名 */
    private String name;

    /** 收款方类型：borrower/coBorrower/guarantor */
    private String type;

    /** 收款方类型名称：主借人/共借人/担保人 */
    private String typeName;

    /** 借款人类型：个人/对公 */
    private String category;

    /** 开卡银行 */
    private String bankName;

    /** 银行卡号 */
    private String cardNo;
}

