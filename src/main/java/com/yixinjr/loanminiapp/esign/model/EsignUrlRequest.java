package com.yixinjr.loanminiapp.esign.model;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class EsignUrlRequest {

    /**
     * 签署流程ID
     */
    private String signFlowId;

    /**
     * 是否需要登录打开链接（默认值 false）
     * true - 需登录打开链接，false - 免登录
     */
    private boolean needLogin;

    /**
     * 链接类型（默认值 2）
     * 1 - 预览链接（仅限查看，不能签署）， 2 - 签署链接
     */
    private String urlType;

    /**
     * 指定客户端类型，当urlType为2（签署链接）时生效
     * H5 - 移动端适配
     * PC - PC端适配
     * ALL - 自动适配移动端或PC端（默认值）
     * 【注】参数值均为大写的英文
     */
    private String clientType;

    /**
     * AppScheme，主要用于支付宝人脸认证重定向时跳回开发者自身App。
     * 示例值：esign://demo/signBack
     */
    private String appScheme;

    private Operator operator;

    private Organization organization;

    private RedirectConfig redirectConfig;

    @Data
    @Builder
    public static class Operator {
        /**
         * 签署操作人账号标识（手机号/邮箱号）
         */
        private String psnAccount;
        /**
         * 签署操作人账号ID（个人账号ID）
         */
        private String psnId;
    }

    @Data
    @Builder
    public static class Organization {
        private String orgId;// 机构账号ID
        private String orgName;// 机构名称
    }

    @Data
    @Builder
    public static class RedirectConfig {
        /**
         * 签署完成后跳转页面（除app和小程序端集成外，地址需符合 https /http 协议地址）
         */
        private String redirectUrl;
        /**
         * 操作完成重定向跳转延迟时间，单位秒（可选值0、3，默认值为 3）
         * 传0时，签署完成直接跳转重定向地址；
         * 传3时，展示签署完成结果页，倒计时3秒后，自动跳转重定向地址。
         * 【注】当redirectUrl不传的情况下，该字段无需传入，签署完成不跳转
         */
        private String redirectDelayTime;
    }

}
