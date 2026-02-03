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
     */
    public void checkAccess(Long orderId) {
        if (orderId == null) {
            return;
        }
        CurrentUser cu = CurrentUserContext.get();
        if (cu == null || cu.getRoles() == null || cu.getRoles().isEmpty()) {
            return;
        }
        if (cu.getRoles().contains("ADMIN")) {
            return;
        }
        Long uid = cu.getUserId();
        if (uid == null) {
            throw new RuntimeException("无权限");
        }
        List<OrderUserRelation> relations = orderUserRelationMapper.selectList(new LambdaQueryWrapper<OrderUserRelation>()
                .eq(OrderUserRelation::getOrderId, orderId)
                .eq(OrderUserRelation::getUserId, uid));
        boolean allowed = relations.stream().anyMatch(r ->
                (cu.getRoles().contains("SALES") && "SALES_OWNER".equals(r.getRelationType())) ||
                        (cu.getRoles().contains("APPLICANT") && "APPLICANT_OWNER".equals(r.getRelationType())));
        if (!allowed) {
            throw new RuntimeException("无权限");
        }
    }
}


