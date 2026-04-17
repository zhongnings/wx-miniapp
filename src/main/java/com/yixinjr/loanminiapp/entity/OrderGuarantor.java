package com.yixinjr.loanminiapp.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 订单担保人信息实体类（独立表）
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@TableName("t_order_guarantor")
public class OrderGuarantor {
    /** 主键ID */
    @TableId(type = IdType.AUTO)
    private Long id;

    /** 订单ID */
    private Long orderId;

    /** 担保人类型：personal-个人，company-对公，property-房产 */
    private String borrowerType;

    // ========== 个人信息 ==========
    /** 姓名 */
    private String name;

    /** 证件类型 */
    private String idType;

    /** 证件号码 */
    private String idNo;

    /** 证件生效日期 */
    private LocalDate idIssueDate;

    /** 证件有效期 */
    private LocalDate idExpireDate;

    /** 证件地址 */
    private String idAddress;

    /** 手机号 */
    private String mobile;

    /** 居住地省市区 */
    private String provinceCity;

    /** 详细地址 */
    private String addressDetail;

    /** 与主借人关系 */
    private String relationship;

    /** 婚姻状况 */
    private String maritalStatus;

    /** 身份证正面图片URL */
    private String faceFrontUrl;

    /** 身份证反面图片URL */
    private String faceBackUrl;

    // ========== 对公/房产信息 ==========
    /** 营业执照/房产证图片URL */
    private String businessLicenseUrl;

    /** 公司名称/房产证号码 */
    private String companyName;

    /** 公司信用代码 */
    private String companyCreditCode;

    /** 公司注册地/房产地省市区 */
    private String companyArea;

    /** 公司/房产详细地址 */
    private String companyAddress;

    /** 经办人手机号（对公/房产类型时使用，存储在公司信息部分） */
    private String agentMobile;

    // ========== 公证材料 ==========
    /** 公证材料JSON（存储文件列表） */
    private String notaryDocumentsJson;

    // ========== 审核状态 ==========
    /** 状态：0-待审核，1-审核通过，2-审核拒绝 */
    private Integer status;

    /** 审核备注 */
    private String auditRemark;

    // ========== 时间戳 ==========
    /** 创建时间 */
    private LocalDateTime createdAt;

    /** 更新时间 */
    private LocalDateTime updatedAt;
}

