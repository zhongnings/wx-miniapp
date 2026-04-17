package com.yixinjr.loanminiapp.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.yixinjr.loanminiapp.entity.Order;
import com.yixinjr.loanminiapp.entity.OrderContract;
import com.yixinjr.loanminiapp.mapper.OrderContractMapper;
import com.yixinjr.loanminiapp.mapper.OrderMapper;
import com.yixinjr.loanminiapp.esign.model.EsignSignCallbackRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;

@Slf4j
@Service
@RequiredArgsConstructor
public class EsignCallbackService {

    private final OrderContractMapper orderContractMapper;
    private final OrderMapper orderMapper;

    public void handleSignCallback(EsignSignCallbackRequest req) {
        if (req == null || StringUtils.isBlank(req.getAction()) || StringUtils.isBlank(req.getSignFlowId())) {
            return;
        }
        OrderContract contract = orderContractMapper.selectOne(new LambdaQueryWrapper<OrderContract>()
                .eq(OrderContract::getFlowId, req.getSignFlowId())
                .last("LIMIT 1"));
        if (contract == null) {
            log.warn("[ESIGN_CALLBACK] 未找到合同 flowId={}, action={}", req.getSignFlowId(), req.getAction());
            return;
        }

        String action = req.getAction();
        if ("OPERATOR_READ".equalsIgnoreCase(action)) {
            contract.setReadAt(toDateTime(req.getOperateTime()));
            orderContractMapper.updateById(contract);
            return;
        }

        if ("SIGN_MISSON_COMPLETE".equalsIgnoreCase(action) || "SIGN_MISSION_COMPLETE".equalsIgnoreCase(action)) {
            contract.setStatus(3);
            if (contract.getReadAt() == null) {
                contract.setReadAt(toDateTime(req.getOperateTime()));
            }
            orderContractMapper.updateById(contract);

            if (contract.getOrderId() != null) {
                Order order = orderMapper.selectById(contract.getOrderId());
                if (order != null) {
                    order.setOrderStatus(3);
                    orderMapper.updateById(order);
                }
            }
        }
    }

    private LocalDateTime toDateTime(Long millis) {
        if (millis == null || millis <= 0) {
            return LocalDateTime.now();
        }
        return LocalDateTime.ofInstant(Instant.ofEpochMilli(millis), ZoneId.systemDefault());
    }
}

