package com.yixinjr.loanminiapp.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.yixinjr.loanminiapp.entity.OrderBorrower;
import com.yixinjr.loanminiapp.mapper.OrderBorrowerMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * 担保人信息服务
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class OrderGuarantorService {

    private final OrderBorrowerMapper borrowerMapper;

    /**
     * 加载担保人列表
     */
    public List<OrderBorrower> loadList(Long orderId) {
        LambdaQueryWrapper<OrderBorrower> query = new LambdaQueryWrapper<>();
        query.eq(OrderBorrower::getOrderId, orderId)
             .eq(OrderBorrower::getRoleType, "guarantor");
        return borrowerMapper.selectList(query);
    }

    /**
     * 删除订单的所有担保人
     */
    @Transactional(rollbackFor = Exception.class)
    public void deleteByOrderId(Long orderId) {
        LambdaQueryWrapper<OrderBorrower> query = new LambdaQueryWrapper<>();
        query.eq(OrderBorrower::getOrderId, orderId)
             .eq(OrderBorrower::getRoleType, "guarantor");
        borrowerMapper.delete(query);
    }
}

