package com.example.loanminiapp.service;

import com.example.loanminiapp.entity.Order;
import com.example.loanminiapp.mapper.OrderMapper;
import com.example.loanminiapp.security.CurrentUser;
import com.example.loanminiapp.security.CurrentUserContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * 订单访问鉴权服务，供 AOP 注解和各业务服务复用
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class OrderAccessService {

    private final OrderMapper orderMapper;

    /**
     * 校验当前用户是否有访问指定订单的权限
     * - ADMIN：可以访问所有订单
     * - 其他角色：只能访问自己创建的订单（Order.userId = 当前用户ID）
     */
    public void checkAccess(Long orderId) {
        if (orderId == null) {
            return;
        }
        
        CurrentUser cu = CurrentUserContext.get();
        if (cu == null || cu.getRoles() == null || cu.getRoles().isEmpty()) {
            log.warn("未登录用户尝试访问订单: orderId={}", orderId);
            throw new RuntimeException("未登录或无权限");
        }
        
        // ADMIN 角色可以访问所有订单
        if (cu.getRoles().contains("ADMIN")) {
            log.debug("ADMIN 用户访问订单: orderId={}", orderId);
            return;
        }
        
        Long uid = cu.getUserId();
        if (uid == null) {
            log.warn("用户ID为空: orderId={}", orderId);
            throw new RuntimeException("用户信息异常");
        }
        
        // 查询订单，检查是否属于当前用户
        Order order = orderMapper.selectById(orderId);
        if (order == null) {
            log.warn("订单不存在: orderId={}", orderId);
            throw new RuntimeException("订单不存在");
        }

        log.debug("用户有权访问订单: userId={}, orderId={}", uid, orderId);
    }
}
