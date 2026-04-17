package com.yixinjr.loanminiapp.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;

/**
 * 订单借款人信息实体类
 */
@Data
@Builder
@TableName("t_order_borrower")
public class OrderBorrower {
    /** 主键ID */
    @TableId(type = IdType.AUTO)
    private Long id;

    /** 订单ID */
    private Long orderId;

    /** 角色类型：borrower/coBorrower/guarantor */
    private String roleType;

    /** 姓名 */
    private String name;

    /** 证件类型 */
    private String idType;

    /** 证件号码 */
    private String idNo;

    /** 证件签发日期 */
    private LocalDate idIssueDate;

    /** 证件到期日期 */
    private LocalDate idExpireDate;

    /** 手机号 */
    private String mobile;

    /** 省市 */
    private String provinceCity;

    /** 详细地址 */
    private String addressDetail;

    /** 性别 */
    private String gender;

    /** 出生日期 */
    private LocalDate birthday;

    /** 婚姻状况 */
    private String maritalStatus;

    /** 身份证正面图片URL */
    private String faceFrontUrl;

    /** 身份证反面图片URL */
    private String faceBackUrl;
}

