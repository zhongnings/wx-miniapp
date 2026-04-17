package com.yixinjr.loanminiapp.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.math.BigDecimal;

/**
 * 制单信息实体类
 */
@Data
@TableName("t_order_voucher")
public class OrderVoucher {
    /** 主键ID */
    @TableId(type = IdType.AUTO)
    private Long id;

    /** 订单ID */
    private Long orderId;

    /** 金额 */
    private BigDecimal amount;

    /** 收款方 */
    private String payee;

    /** 收款方类型 */
    private String payeeType;

    /** 开卡银行 */
    private String openBank;

    /** 银行卡号 */
    private String cardNo;

    /** 备注 */
    private String remark;
}

