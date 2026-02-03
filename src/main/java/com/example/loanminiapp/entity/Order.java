package com.example.loanminiapp.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 订单实体类
 */
@Data
@Builder
@TableName("t_order")
public class Order {
    /** 主键ID */
    @TableId(type = IdType.AUTO)
    private Long id;

    /** 订单编号 */
    private String orderNo;

    /** 用户ID（微信openid或其他标识） */
    private String userId;

    /** 借款人姓名 */
    private String borrowerName;

    /** 借款金额 */
    private BigDecimal loanAmount;

    /** 借款天数 */
    private Integer loanDays;

    /** 开始日期 */
    private LocalDate startDate;

    /** 结束日期 */
    private LocalDate endDate;

    /** 年化利率 */
    private BigDecimal annualRate;

    /** 订单状态：0待提交/1风控审核中/2风控驳回/3待放款/4放款中/5待债转/6签署中/7待人脸识别/8完成 */
    private Integer orderStatus;

    /** 风控状态：0待提交/1审核中/2驳回/3通过 */
    private Integer riskStatus;

    /** 还款状态：0未开始/1还款中/2逾期/3已结清 */
    private Integer repaymentStatus;

    /** 签署状态：0未开始/1签署中/2已签署/3签署失败/4待人脸识别 */
    private Integer signStatus;

    /** 借款信息是否已完成 */
    private Boolean loanInfoFilled;

    /** 借款人信息是否已完成 */
    private Boolean borrowerInfoFilled;

    /** 共借人信息是否已完成 */
    private Boolean coBorrowerInfoFilled;

    /** 担保人信息是否已完成 */
    private Boolean guarantorInfoFilled;

    /** 银行卡信息是否已完成 */
    private Boolean bankCardInfoFilled;

    /** 资料是否已上传 */
    private Boolean attachmentUploaded;

    /** 制单信息是否已完成 */
    private Boolean voucherInfoFilled;

    /** 创建时间 */
    private LocalDateTime createdAt;

    /** 更新时间 */
    private LocalDateTime updatedAt;
}

