package com.example.loanminiapp.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 资金账户实体
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@TableName("t_fund_account")
public class FundAccount {

    @TableId(type = IdType.AUTO)
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

    /** 支付密码（加密存储） */
    private String paymentPassword;

    /** 状态：0-禁用，1-启用 */
    private Integer status;

    /** 创建人 */
    private String createdBy;

    /** 创建时间 */
    private LocalDateTime createdAt;

    /** 更新时间 */
    private LocalDateTime updatedAt;
}

