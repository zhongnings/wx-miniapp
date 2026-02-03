package com.example.loanminiapp.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Builder;
import lombok.Data;

/**
 * 用户-角色关联表映射（预留）
 * 对应表：sys_user_role
 */
@Data
@Builder
@TableName("sys_user_role")
public class SysUserRole {

    /** 用户ID，对应 sys_user.id */
    private Long userId;

    /** 角色ID，对应 sys_role.id */
    private Long roleId;
}








