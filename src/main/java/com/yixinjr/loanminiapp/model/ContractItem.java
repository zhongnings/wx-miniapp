package com.yixinjr.loanminiapp.model;

import lombok.Data;

@Data
public class ContractItem {
    private Long id;
    private String name;
    private String signer; // 签署人
    private String status; // 状态：未签/已签
    private String pdfUrl;
    private String readAt;
    private String qrCodeUrl; // 获取签署二维码的接口相对路径（含合同维度）
    /** 腾讯电子签流程 ID，有值时表示可走真实签署链 */
    private String flowId;
}

