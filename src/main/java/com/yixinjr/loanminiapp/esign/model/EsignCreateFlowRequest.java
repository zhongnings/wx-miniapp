package com.yixinjr.loanminiapp.esign.model;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class EsignCreateFlowRequest {
    private List<Doc> docs;
    private SignFlowConfig signFlowConfig;
    private List<Signer> signers;

    @Data
    @Builder
    public static class Doc {
        private String fileId;
        private String fileName;
    }

    @Data
    @Builder
    public static class SignFlowConfig {
        private String signFlowTitle;
        private Boolean autoFinish;
        private NoticeConfig noticeConfig;
        private String notifyUrl;
        private RedirectConfig redirectConfig;
    }

    @Data
    @Builder
    public static class NoticeConfig {
        private String noticeTypes;
    }

    @Data
    @Builder
    public static class RedirectConfig {
        private String redirectUrl;
    }

    @Data
    @Builder
    public static class Signer {
        private Integer signerType;
        private SignConfig signConfig;
        private PsnSignerInfo psnSignerInfo;
        private List<SignField> signFields;
    }

    @Data
    @Builder
    public static class SignConfig {
        private Integer signOrder;
        private Integer forcedReadingTime;
    }

    @Data
    @Builder
    public static class PsnSignerInfo {
        private String psnAccount;
        private PsnInfo psnInfo;
    }

    @Data
    @Builder
    public static class PsnInfo {
        private String psnName;
    }

    @Data
    @Builder
    public static class SignField {
        private String customBizNum;
        private String fileId;
        private NormalSignFieldConfig normalSignFieldConfig;
    }

    @Data
    @Builder
    public static class NormalSignFieldConfig {
        private Boolean autoSign;
        private Integer signFieldStyle;
        private SignFieldPosition signFieldPosition;
    }

    @Data
    @Builder
    public static class SignFieldPosition {
        private String positionPage;
        private Integer positionX;
        private Integer positionY;
    }
}

