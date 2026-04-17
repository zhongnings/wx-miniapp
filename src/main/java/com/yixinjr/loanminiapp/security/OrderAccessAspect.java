package com.yixinjr.loanminiapp.security;

import com.yixinjr.loanminiapp.service.OrderAccessService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Before;
import org.springframework.stereotype.Component;

/**
 * 基于注解的订单访问鉴权切面
 */
@Aspect
@Component
@RequiredArgsConstructor
@Slf4j
public class OrderAccessAspect {

    private final OrderAccessService orderAccessService;

    @Before("@annotation(orderAccessCheck)")
    public void checkOrderAccess(JoinPoint joinPoint, OrderAccessCheck orderAccessCheck) {
        Object[] args = joinPoint.getArgs();
        if (args == null || args.length == 0) {
            return;
        }
        for (Object arg : args) {
            if (arg instanceof Long) {
                Long orderId = (Long) arg;
                log.debug("OrderAccessAspect 检查订单权限, orderId={}", orderId);
                orderAccessService.checkAccess(orderId);
                return;
            }
        }
    }
}


