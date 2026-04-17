package com.yixinjr.loanminiapp.service;

import com.yixinjr.loanminiapp.security.JwtUtil;
import com.yixinjr.loanminiapp.util.RedisUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Token管理服务（基于Redis）
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class TokenService {

    private final RedisUtil redisUtil;
    private final JwtUtil jwtUtil;

    // Token在Redis中的key前缀
    private static final String TOKEN_PREFIX = "token:";
    
    // 用户Token映射的key前缀（用于单点登录）
    private static final String USER_TOKEN_PREFIX = "user:token:";
    
    // Token有效期：30分钟（秒）
    private static final long TOKEN_EXPIRE_TIME = 30 * 60;

    /**
     * 生成并存储Token
     */
    public String generateAndStoreToken(Long userId, String username, List<String> roles, List<String> permissions) {
        // 生成JWT Token
        String token = jwtUtil.generateToken(userId, username, roles, permissions);
        
        // 构建Token信息
        Map<String, Object> tokenInfo = new HashMap<>();
        tokenInfo.put("userId", userId);
        tokenInfo.put("username", username);
        tokenInfo.put("roles", roles);
        tokenInfo.put("permissions", permissions);
        tokenInfo.put("createTime", System.currentTimeMillis());
        
        // 存储Token信息到Redis（30分钟过期）
        String tokenKey = TOKEN_PREFIX + token;
        redisUtil.hmset(tokenKey, tokenInfo, TOKEN_EXPIRE_TIME);
        
        // 存储用户ID到Token的映射（用于单点登录，踢出旧Token）
        String userTokenKey = USER_TOKEN_PREFIX + userId;
        String oldToken = (String) redisUtil.get(userTokenKey);
        if (oldToken != null) {
            // 删除旧Token
            redisUtil.del(TOKEN_PREFIX + oldToken);
            log.info("删除用户旧Token: userId={}", userId);
        }
        redisUtil.set(userTokenKey, token, TOKEN_EXPIRE_TIME);
        
        log.info("Token已存储到Redis: userId={}, token={}, 过期时间={}秒", 
            userId, token.substring(0, Math.min(20, token.length())), TOKEN_EXPIRE_TIME);
        
        return token;
    }

    /**
     * 验证Token是否有效
     */
    public boolean validateToken(String token) {
        if (token == null || token.isEmpty()) {
            return false;
        }
        
        // 先验证JWT本身是否有效
        if (!jwtUtil.validateToken(token)) {
            log.warn("JWT Token验证失败");
            return false;
        }
        
        // 再检查Redis中是否存在
        String tokenKey = TOKEN_PREFIX + token;
        boolean exists = redisUtil.hasKey(tokenKey);
        
        if (!exists) {
            log.warn("Token在Redis中不存在或已过期");
        }
        
        return exists;
    }

    /**
     * 获取Token信息
     */
    @SuppressWarnings("unchecked")
    public Map<Object, Object> getTokenInfo(String token) {
        String tokenKey = TOKEN_PREFIX + token;
        return redisUtil.hmget(tokenKey);
    }

    /**
     * 刷新Token过期时间
     */
    public boolean refreshToken(String token) {
        String tokenKey = TOKEN_PREFIX + token;
        if (!redisUtil.hasKey(tokenKey)) {
            return false;
        }
        
        // 重置过期时间为30分钟
        redisUtil.expire(tokenKey, TOKEN_EXPIRE_TIME);
        
        // 同时刷新用户Token映射的过期时间
        Long userId = jwtUtil.getUserIdFromToken(token);
        String userTokenKey = USER_TOKEN_PREFIX + userId;
        redisUtil.expire(userTokenKey, TOKEN_EXPIRE_TIME);
        
        log.debug("Token过期时间已刷新: userId={}", userId);
        return true;
    }

    /**
     * 删除Token（登出）
     */
    public void removeToken(String token) {
        if (token == null || token.isEmpty()) {
            return;
        }
        
        try {
            // 获取用户ID
            Long userId = jwtUtil.getUserIdFromToken(token);
            
            // 删除Token
            String tokenKey = TOKEN_PREFIX + token;
            redisUtil.del(tokenKey);
            
            // 删除用户Token映射
            String userTokenKey = USER_TOKEN_PREFIX + userId;
            redisUtil.del(userTokenKey);
            
            log.info("Token已删除: userId={}", userId);
        } catch (Exception e) {
            log.error("删除Token失败: {}", e.getMessage());
        }
    }

    /**
     * 强制用户下线（管理员功能）
     */
    public void forceLogout(Long userId) {
        String userTokenKey = USER_TOKEN_PREFIX + userId;
        String token = (String) redisUtil.get(userTokenKey);
        
        if (token != null) {
            removeToken(token);
            log.info("强制用户下线: userId={}", userId);
        }
    }

    /**
     * 获取Token剩余有效时间（秒）
     */
    public long getTokenExpireTime(String token) {
        String tokenKey = TOKEN_PREFIX + token;
        return redisUtil.getExpire(tokenKey);
    }

    /**
     * 检查Token是否即将过期（5分钟内）
     */
    public boolean isTokenExpiringSoon(String token) {
        long expireTime = getTokenExpireTime(token);
        return expireTime > 0 && expireTime < 5 * 60; // 小于5分钟
    }
}

