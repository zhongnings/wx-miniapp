package com.example.loanminiapp.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("t_bank_info")
public class BankInfo {

    @TableId(type = IdType.AUTO)
    private Long id;

    private String bankCode;

    private String bankName;

    private String logoPath;

    private String color;

    private Boolean isEnabled;

    private Integer sortOrder;

    private LocalDateTime createTime;

    private LocalDateTime updateTime;
}
