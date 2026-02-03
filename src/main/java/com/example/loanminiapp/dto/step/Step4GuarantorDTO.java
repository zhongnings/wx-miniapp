package com.example.loanminiapp.dto.step;

import lombok.Data;

/**
 * 担保人信息
 */
@Data
public class Step4GuarantorDTO {
    private String name;
    private String idType;
    private String idNumber;
    private String mobile;
    private String relation;
    private String address;
}


