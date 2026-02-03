package com.example.loanminiapp.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 真实 DB 用户表映射（预留）
 * 对应表：sys_user
 */
@Data
@Builder
@TableName("sys_user")
public class SysUser {

    @TableId(type = IdType.AUTO)
    private Long id;

    /** 登录用户名 */
    private String username;

    /** 加密后的密码 */
    private String password;

    /** 昵称 */
    private String nickname;

    /** 手机号 */
    private String mobile;

    /** 邮箱 */
    private String email;

    /** 状态：1=启用 0=禁用 */
    private Integer status;

    /** 多租户/机构标识（可选） */
    private Long tenantId;

    /** 创建时间 */
    private LocalDateTime createdAt;

    /** 更新时间 */
    private LocalDateTime updatedAt;
}








