package com.example.loanminiapp.dto.step;

import lombok.Data;

import java.util.List;

/**
 * 担保人信息（支持个人和对公）
 */
@Data
public class Step4GuarantorDTO {
    /** 担保人类型：personal-个人，company-对公 */
    private String borrowerType;
    
    // ========== 个人信息 ==========
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
    
    // ========== 对公信息 ==========
    /** 营业执照图片 */
    private String businessLicense;
    
    /** 公司名称 */
    private String companyName;
    
    /** 公司信用代码 */
    private String companyCreditCode;
    
    /** 注册地省市区 */
    private String companyArea;
    
    /** 公司详细地址 */
    private String companyAddress;
    
    /** 经办人手机号 */
    private String agentPhone;
    
    /** 经办人身份证正面 */
    private String agentIdCardFront;
    
    /** 经办人身份证反面 */
    private String agentIdCardBack;
    
    /** 经办人证件类型 */
    private String agentIdType;
    
    /** 经办人姓名 */
    private String agentName;
    
    /** 经办人手机号2 */
    private String agentPhone2;
    
    /** 经办人证件号码 */
    private String agentIdNumber;
    
    /** 经办人证件生效日期 */
    private String agentIdStartDate;
    
    /** 经办人证件有效期 */
    private String agentIdEndDate;
    
    /** 经办人证件地址 */
    private String agentIdAddress;
    
    /** 与主借人关系（对公） */
    private String companyRelationship;
    
    /** 公证材料列表 */
    private List<NotaryDocument> notaryDocuments;
    
    /**
     * 公证材料
     */
    @Data
    public static class NotaryDocument {
        /** 文件名称 */
        private String name;
        
        /** 文件路径 */
        private String path;
    }
}
