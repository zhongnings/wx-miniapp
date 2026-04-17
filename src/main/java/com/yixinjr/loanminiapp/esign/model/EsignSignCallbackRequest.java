package com.yixinjr.loanminiapp.esign.model;

import lombok.Data;

@Data
public class EsignSignCallbackRequest {
    private String action;
    private Long timestamp;
    private String signFlowId;
    private String customBizNum;
    private Integer signOrder;
    private Long operateTime;
    private Integer signResult;
    private String resultDescription;
}

