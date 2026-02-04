package com.example.loanminiapp.service;

import com.example.loanminiapp.entity.Order;
import com.example.loanminiapp.entity.OrderStatusFlow;
import com.example.loanminiapp.enums.OrderStatusEnum;
import com.example.loanminiapp.mapper.OrderStatusFlowMapper;
import com.example.loanminiapp.security.CurrentUser;
import com.example.loanminiapp.security.CurrentUserContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

/**
 * 订单状态流转记录服务
 */
@Service
@RequiredArgsConstructor
public class OrderStatusFlowService {

    private final OrderStatusFlowMapper orderStatusFlowMapper;

    /**
     * 记录一次订单状态变更
     */
    public void recordStatusChange(Order order, OrderStatusEnum newStatus, String remark) {
        if (order == null || newStatus == null) {
            return;
        }
        CurrentUser cu = CurrentUserContext.get();
        Long userId = cu != null ? cu.getUserId() : null;

        OrderStatusFlow flow = new OrderStatusFlow();
        flow.setOrderId(order.getId());
        flow.setOrderNo(order.getOrderNo());
        flow.setOrderStatus(newStatus.getCode());
        flow.setOperatorUserId(userId);
        flow.setRemark(remark);
        flow.setCreatedAt(LocalDateTime.now());

        orderStatusFlowMapper.insert(flow);
    }
}


