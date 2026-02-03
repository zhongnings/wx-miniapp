package com.example.loanminiapp.model;

import lombok.Data;

@Data
public class ContractItem {
    private Long id;
    private String name;
    private String signer; // 签署人
    private String status; // 状态：未签/已签
    private String pdfUrl;
    private String readAt;
    private String qrCodeUrl; // 签署二维码URL
}

