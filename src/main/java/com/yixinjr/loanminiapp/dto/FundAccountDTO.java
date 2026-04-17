package com.yixinjr.loanminiapp.dto;

import lombok.Data;

/**
 * 资金账户DTO
 */
@Data
public class FundAccountDTO {

    private Long id;

    /** 受让方 */
    private String assignee;

    /** 支付渠道 */
    private String paymentChannel;

    /** 小贷机构 */
    private String microloanOrg;

    /** 开户行号 */
    private String bankBranchNumber;

    /** 绑定银行 */
    private String boundBank;

    /** 绑定银行账号 */
    private String accountNumber;

    /** 支付密码 */
    private String paymentPassword;

    /** 状态：0-禁用，1-启用 */
    private Integer status;
}

