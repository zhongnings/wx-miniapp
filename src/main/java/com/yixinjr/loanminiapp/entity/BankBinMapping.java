package com.yixinjr.loanminiapp.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("t_bank_bin_mapping")
public class BankBinMapping {

    @TableId(type = IdType.AUTO)
    private Long id;

    private String binPrefix;

    private Integer prefixLength;

    private String bankCode;

    private Boolean isEnabled;

    private LocalDateTime createTime;

    private LocalDateTime updateTime;
}
