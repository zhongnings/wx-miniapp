package com.yixinjr.loanminiapp.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Builder;
import lombok.Data;

/**
 * 银行卡信息实体，对应表 t_order_bank_card
 */
@Data
@Builder
@TableName("t_order_bank_card")
public class OrderBankCard {

    @TableId(type = IdType.AUTO)
    private Long id;

    /** 订单ID，对应 t_order.id */
    private Long orderId;

    /** 持卡人类型（借款人/共借人/担保人） */
    private String holderType;

    /** 账户名称（持卡人姓名） */
    private String accountName;

    /** 证件类型 */
    private String idType;

    /** 证件号码 */
    private String idNo;

    /** 开户银行名称 */
    private String bankName;

    /** 银行卡号 */
    private String cardNo;

    /** 预留手机号 */
    private String reservedMobile;

    /** 银行卡正面图片URL */
    private String cardFrontUrl;
}




