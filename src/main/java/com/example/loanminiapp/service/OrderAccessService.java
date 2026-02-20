package com.example.loanminiapp.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.example.loanminiapp.entity.OrderUserRelation;
import com.example.loanminiapp.mapper.OrderUserRelationMapper;
import com.example.loanminiapp.security.CurrentUser;
import com.example.loanminiapp.security.CurrentUserContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * 订单访问鉴权服务，供 AOP 注解和各业务服务复用
 */
@Service
@RequiredArgsConstructor
public class OrderAccessService {

    private final OrderUserRelationMapper orderUserRelationMapper;

    /**
     * 校验当前用户是否有访问指定订单的权限
     * - ADMIN：可以访问所有订单
     * - SALES：只能访问自己作为业务员的订单
     * - APPLICANT：只能访问自己作为申请人的订单
     */
    public void checkAccess(Long orderId) {
        if (orderId == null) {
            return;
        }
        
        CurrentUser cu = CurrentUserContext.get();
        if (cu == null || cu.getRoles() == null || cu.getRoles().isEmpty()) {
            throw new RuntimeException("未登录或无权限");
        }
        
        // ADMIN 角色可以访问所有订单
        if (cu.getRoles().contains("ADMIN")) {
            return;
        }
        
        Long uid = cu.getUserId();
        if (uid == null) {
            throw new RuntimeException("用户信息异常");
        }
        
        // 查询用户与订单的关联关系
        List<OrderUserRelation> relations = orderUserRelationMapper.selectList(
                new LambdaQueryWrapper<OrderUserRelation>()
                        .eq(OrderUserRelation::getOrderId, orderId)
                        .eq(OrderUserRelation::getUserId, uid)
        );
        
        if (relations.isEmpty()) {
            throw new RuntimeException("您没有权限访问此订单");
        }
        
        // 检查关联关系是否匹配用户角色
        boolean allowed = relations.stream().anyMatch(r -> {
            // SALES 角色只能访问自己作为业务员的订单
            if (cu.getRoles().contains("SALES") && "SALES_OWNER".equals(r.getRelationType())) {
                return true;
            }
            // APPLICANT 角色只能访问自己作为申请人的订单
            if (cu.getRoles().contains("APPLICANT") && "APPLICANT_OWNER".equals(r.getRelationType())) {
                return true;
            }
            return false;
        });
        
        if (!allowed) {
            throw new RuntimeException("您没有权限访问此订单");
        }
    }
}


