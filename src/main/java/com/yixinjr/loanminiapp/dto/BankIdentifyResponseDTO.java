package com.yixinjr.loanminiapp.dto;

import lombok.Data;

@Data
public class BankIdentifyResponseDTO {
    private boolean matched;
    private String bankCode;
    private String bankName;
    private String logo;
    private String color;
    private String confidence;
    private String mapVersion;
}
