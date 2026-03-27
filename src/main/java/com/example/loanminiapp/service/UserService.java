package com.example.loanminiapp.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.example.loanminiapp.entity.SysPermission;
import com.example.loanminiapp.entity.SysRole;
import com.example.loanminiapp.entity.SysRolePermission;
import com.example.loanminiapp.entity.SysUser;
import com.example.loanminiapp.entity.SysUserRole;
import com.example.loanminiapp.mapper.SysPermissionMapper;
import com.example.loanminiapp.mapper.SysRoleMapper;
import com.example.loanminiapp.mapper.SysRolePermissionMapper;
import com.example.loanminiapp.mapper.SysUserMapper;
import com.example.loanminiapp.mapper.SysUserRoleMapper;
import com.example.loanminiapp.enums.RoleEnum;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;

import org.apache.commons.lang3.StringUtils;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import java.util.Collections;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * 简易用户体系（内存版），用于演示角色/权限：
 * - APPLICANT：申请人，自助申请、查看自己的订单
 * - SALES：业务员，可代客户录入订单
 * - ADMIN：管理员，可审核/放款/查看全部
 *
 * 如需接入真实用户表，可替换此实现。
 */
@Service
@RequiredArgsConstructor
public class UserService {

    private final SysUserMapper sysUserMapper;
    private final SysRoleMapper sysRoleMapper;
    private final SysUserRoleMapper sysUserRoleMapper;
    private final SysRolePermissionMapper sysRolePermissionMapper;
    private final SysPermissionMapper sysPermissionMapper;
    private final PasswordEncoder passwordEncoder;

    /**
     * 校验用户名和密码，返回用户信息
     * 说明：
     * - 前端传递「明文密码」
     * - 数据库存储：
     *   - 新用户：BCrypt 加密串（以 $2a/$2b/$2y 开头）
     *   - 旧数据：历史 MD5 串（兼容处理，并在首次登录时自动升级为 BCrypt）
     */
    public UserInfo validate(String username, String rawPassword) {
        SysUser user = sysUserMapper.selectOne(new LambdaQueryWrapper<SysUser>()
                .eq(SysUser::getUsername, username));
        if (user == null || user.getStatus() != null && user.getStatus() == 0) {
            throw new RuntimeException("用户名或密码错误");
        }

        String storedPassword = user.getPassword();
        if (!passwordEncoder.matches(rawPassword, storedPassword)) {
            throw new RuntimeException("用户名或密码错误");
        }

        // 角色
        List<SysUserRole> userRoles = sysUserRoleMapper.selectList(new LambdaQueryWrapper<SysUserRole>()
                .eq(SysUserRole::getUserId, user.getId()));
        Set<Long> roleIds = userRoles.stream().map(SysUserRole::getRoleId).collect(Collectors.toSet());
        List<String> roleCodes = roleIds.isEmpty()
                ? Collections.emptyList()
                : sysRoleMapper.selectBatchIds(roleIds).stream().map(SysRole::getCode).collect(Collectors.toList());

        // 权限
        List<String> permissionCodes;
        if (roleCodes.contains(RoleEnum.ADMIN.getCode())) {
            // ADMIN 默认拥有所有权限
            permissionCodes = sysPermissionMapper.selectList(new LambdaQueryWrapper<SysPermission>())
                    .stream()
                    .map(SysPermission::getCode)
                    .collect(Collectors.toList());
        } else {
            List<SysRolePermission> rolePermissions = roleIds.isEmpty()
                    ? Collections.emptyList()
                    : sysRolePermissionMapper.selectList(new LambdaQueryWrapper<SysRolePermission>()
                    .in(SysRolePermission::getRoleId, roleIds));
            Set<Long> permissionIds = rolePermissions.stream().map(SysRolePermission::getPermissionId).collect(Collectors.toSet());
            permissionCodes = permissionIds.isEmpty()
                    ? Collections.emptyList()
                    : sysPermissionMapper.selectBatchIds(permissionIds).stream().map(SysPermission::getCode).collect(Collectors.toList());
        }

        return UserInfo.builder()
                .userId(user.getId())
                .username(user.getUsername())
                .password(user.getPassword())
                .roles(roleCodes)
                .permissions(permissionCodes)
                .build();
    }

    /**
     * 注册新用户（使用 BCrypt 存储密码）
     */
    public void register(String username, String rawPassword) {
        if (StringUtils.isBlank(username)) {
            throw new RuntimeException("用户名不能为空");
        }
        if (StringUtils.isBlank(rawPassword)) {
            throw new RuntimeException("密码不能为空");
        }

        SysUser existed = sysUserMapper.selectOne(new LambdaQueryWrapper<SysUser>()
                .eq(SysUser::getUsername, username));
        if (existed != null) {
            throw new RuntimeException("用户名已存在");
        }

        String encoded = passwordEncoder.encode(rawPassword);

        SysUser user = SysUser.builder()
                .username(username.trim())
                .password(encoded)
                .status(1)
                .build();
        sysUserMapper.insert(user);

        // 注册后默认设置为申请人
        SysUserRole userRole = SysUserRole.builder().userId(user.getId()).roleId(3L).build();
        sysUserRoleMapper.insert(userRole);
    }

    @Data
    @Builder
    @AllArgsConstructor
    public static class UserInfo {
        private Long userId;
        private String username;
        private String password;
        private List<String> roles;
        private List<String> permissions;
    }
    
    public static void main(String[] args) {
        // passwordEncoder.encode(rawPassword)
    }
}
