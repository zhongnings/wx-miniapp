package com.example.loanminiapp.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * 借款信息表实体，对应表 t_order_loan_info
 */
@Data
@Builder
@TableName("t_order_loan_info")
public class OrderLoanInfo {

    @TableId(type = IdType.AUTO)
    private Long id;

    /** 订单ID，对应 t_order.id */
    private Long orderId;

    /** 受让方机构 */
    private String assigneeOrg;

    /** 渠道机构 */
    private String channelOrg;

    /** 支付方式 */
    private String payMethod;

    /** 产品类型 */
    private String productType;

    /** 借款人类别 */
    private String borrowerCategory;

    /** 签署方式 */
    private String contractSignMode;

    /** 借款金额 */
    private BigDecimal loanAmount;

    /** 借款金额大写 */
    private String loanAmountUppercase;

    /** 借款天数 */
    private Integer loanDays;

    /** 开始日期 */
    private LocalDate startDate;

    /** 结束日期 */
    private LocalDate endDate;

    /** 年化利率 */
    private BigDecimal annualRate;

    /** 签署地点 */
    private String signPlace;

    /** 资金用途 */
    private String usageDesc;

    /** 还款方式 */
    private String repayMode;

    /** 争议解决方式 */
    private String disputeWay;

    /** 仲裁机构 */
    private String arbitrationOrg;

    /** 是否公证 */
    private String isNotarization;

    /** 提前还款违约金比例 */
    private BigDecimal penaltyRatio;

    /** 公证类型 */
    private String notarizationType;

    /** 公证事项 */
    private String notarizationItem;

    /** 预约时间（年月日时分） */
    private String appointmentTime;

    /** 证书接收方式 */
    private String certificateReceiveMethod;
}




