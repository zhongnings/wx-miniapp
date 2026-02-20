package com.example.loanminiapp.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.example.loanminiapp.entity.SysPermission;
import com.example.loanminiapp.entry.LoginRequest;
import com.example.loanminiapp.entry.LoginResponse;
import com.example.loanminiapp.entry.RegisterRequest;
import com.example.loanminiapp.entry.MenuItem;
import com.example.loanminiapp.mapper.SysPermissionMapper;
import com.example.loanminiapp.service.TokenService;
import com.example.loanminiapp.service.UserService;
import com.example.loanminiapp.service.UserService.UserInfo;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.stream.Collectors;
import java.util.List;
import java.util.Collections;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserService userService;
    private final SysPermissionMapper sysPermissionMapper;
    private final TokenService tokenService;

    /**
     * 说明：
     * - 请求体：明文 JSON { "username": "...", "password": "..." }
     * - 响应体：返回 JWT token（30分钟有效期，存储在Redis中）、roles、permissions、menus 等字段
     */
    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@RequestBody LoginRequest request) {
        UserInfo user = userService.validate(request.getUsername(), request.getPassword());
        List<MenuItem> menus = buildMenus(user.getPermissions());

        // 生成Token并存储到Redis（30分钟有效期，支持单点登录）
        String token = tokenService.generateAndStoreToken(
            user.getUserId(),
            request.getUsername(),
            user.getRoles(),
            user.getPermissions()
        );

        LoginResponse resp = new LoginResponse();
        resp.setToken(token);
        resp.setUserId(user.getUserId());
        resp.setRoles(user.getRoles());
        resp.setPermissions(user.getPermissions());
        resp.setMenus(menus);
        return ResponseEntity.ok(resp);
    }

    /**
     * 登出接口
     */
    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@RequestHeader("X-Token") String token) {
        tokenService.removeToken(token);
        return ResponseEntity.ok().build();
    }

    /**
     * 注册接口：前端传明文密码，后端使用 BCrypt 存储
     */
    @PostMapping("/register")
    public ResponseEntity<Void> register(@RequestBody RegisterRequest request) {
        if (request == null) {
            return ResponseEntity.badRequest().build();
        }
        if (request.getPassword() == null || !request.getPassword().equals(request.getConfirmPassword())) {
            throw new RuntimeException("两次输入的密码不一致");
        }
        userService.register(request.getUsername(), request.getPassword());
        return ResponseEntity.ok().build();
    }

    private List<MenuItem> buildMenus(List<String> permissionCodes) {
        if (permissionCodes == null || permissionCodes.isEmpty()) {
            return Collections.emptyList();
        }
        List<SysPermission> perms = sysPermissionMapper.selectList(
                new LambdaQueryWrapper<SysPermission>()
                        .eq(SysPermission::getType, "menu")
                        .in(SysPermission::getCode, permissionCodes)
        );
        return perms.stream()
                .map(p -> new MenuItem(p.getCode(), p.getName(), p.getPath()))
                .collect(Collectors.toList());
    }
}