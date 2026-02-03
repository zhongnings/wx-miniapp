package com.example.loanminiapp.dto.step;

import lombok.Data;

/**
 * 步骤2：借款人信息（含身份证图片URL）
 */
@Data
public class Step2BorrowerDTO {
    private String idType;
    private String name;
    private String idNumber;
    private String idEffectiveDate;
    private String idExpiryDate;
    private String idAddress;
    private String phone;
    private String residenceArea;
    private String residenceDetail;
    private String gender;
    private String birthDate;
    private String maritalStatus;
    private String idFrontImage;
    private String idBackImage;
}


