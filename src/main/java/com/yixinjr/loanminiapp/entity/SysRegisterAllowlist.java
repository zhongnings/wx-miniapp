package com.yixinjr.loanminiapp.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
@TableName("sys_register_allowlist")
public class SysRegisterAllowlist {

    @TableId(type = IdType.AUTO)
    private Long id;

    private String username;

    private Integer enabled;

    private String remark;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}

