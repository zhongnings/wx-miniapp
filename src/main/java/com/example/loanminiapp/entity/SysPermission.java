package com.example.loanminiapp.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 权限实体，对应表 sys_permission
 */
@Data
@Builder
@TableName("sys_permission")
public class SysPermission {

    /** 主键ID */
    @TableId(type = IdType.AUTO)
    private Long id;

    /** 权限编码（唯一），如 order:view */
    private String code;

    /** 权限名称 */
    private String name;

    /** 类型：menu/button/api */
    private String type;

    /** 路由或接口地址 */
    private String path;

    /** 租户/机构标识（可选） */
    private Long tenantId;

    /** 创建时间 */
    private LocalDateTime createdAt;

    /** 更新时间 */
    private LocalDateTime updatedAt;
}

