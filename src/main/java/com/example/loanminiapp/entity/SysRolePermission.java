package com.example.loanminiapp.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Builder;
import lombok.Data;

/**
 * 角色-权限关联表映射（预留）
 * 对应表：sys_role_permission
 */
@Data
@Builder
@TableName("sys_role_permission")
public class SysRolePermission {

    /** 角色ID，对应 sys_role.id */
    private Long roleId;

    /** 权限ID，对应 sys_permission.id */
    private Long permissionId;
}








