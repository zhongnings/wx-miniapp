package com.example.loanminiapp.security;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * 订单访问鉴权注解：
 * 标在需要做订单权限校验的方法上（通常是 Service 或 Controller），
 * 切面会自动识别参数列表中的第一个 Long 类型作为 orderId 执行鉴权。
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface OrderAccessCheck {
}


