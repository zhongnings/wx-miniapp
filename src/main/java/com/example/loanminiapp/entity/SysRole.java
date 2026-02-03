package com.example.loanminiapp.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 真实 DB 角色表映射（预留）
 * 对应表：sys_role
 */
@Data
@Builder
@TableName("sys_role")
public class SysRole {

    @TableId(type = IdType.AUTO)
    private Long id;

    /** 角色编码，例如 APPLICANT/SALES/ADMIN */
    private String code;

    /** 角色名称 */
    private String name;

    /** 多租户/机构标识（可选） */
    private Long tenantId;

    /** 创建时间 */
    private LocalDateTime createdAt;

    /** 更新时间 */
    private LocalDateTime updatedAt;
}








