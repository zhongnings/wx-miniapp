package com.example.loanminiapp.dto.step;

import lombok.Data;

import java.util.List;

/**
 * 担保人信息（支持个人、对公、房产）
 * 说明：对公/房产类型的个人信息字段用于存储经办人信息
 */
@Data
public class Step4GuarantorDTO {
    /** 担保人类型：personal-个人，company-对公，property-房产 */
    private String borrowerType;
    
    // ========== 个人信息（个人类型使用，对公/房产类型作为经办人信息使用） ==========
    /** 身份证正面图片 */
    private String idCardFront;
    
    /** 身份证反面图片 */
    private String idCardBack;
    
    /** 证件类型 */
    private String idType;
    
    /** 姓名 */
    private String name;
    
    /** 手机号 */
    private String phone;
    
    /** 证件号码 */
    private String idNumber;
    
    /** 证件生效日期 */
    private String idStartDate;
    
    /** 证件有效期 */
    private String idEndDate;
    
    /** 证件地址 */
    private String idAddress;
    
    /** 居住地省市区 */
    private String residenceArea;
    
    /** 详细地址 */
    private String detailAddress;
    
    /** 与主借人关系 */
    private String relationship;
    
    /** 婚姻状况 */
    private String maritalStatus;
    
    // ========== 对公/房产信息 ==========
    /** 营业执照/房产证图片 */
    private String businessLicense;
    
    /** 公司名称/房产证号码 */
    private String companyName;
    
    /** 公司信用代码 */
    private String companyCreditCode;
    
    /** 公司注册地/房产地省市区 */
    private String companyArea;
    
    /** 公司/房产详细地址 */
    private String companyAddress;
    
    /** 经办人手机号（对公/房产类型时使用） */
    private String agentMobile;

}
