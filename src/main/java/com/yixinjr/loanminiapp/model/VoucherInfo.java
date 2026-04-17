package com.yixinjr.loanminiapp.model;

import lombok.Data;

import java.math.BigDecimal;

/**
 * 制单信息 DTO
 */
@Data
public class VoucherInfo {
    /** 制单ID */
    private Long id;

    /** 订单ID */
    private Long orderId;

    /** 金额 */
    private BigDecimal amount;

    /** 收款方 */
    private String payee;

    /** 收款方类型 */
    private String payeeType;

    /** 收款方类型名称：主借人/共借人/担保人 */
    private String payeeTypeName;

    /** 开卡银行 */
    private String openBank;

    /** 银行卡号 */
    private String cardNo;

    /** 备注 */
    private String remark;
}

