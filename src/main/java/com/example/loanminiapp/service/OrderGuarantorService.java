package com.example.loanminiapp.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.example.loanminiapp.dto.step.Step4GuarantorDTO;
import com.example.loanminiapp.entity.OrderBorrower;
import com.example.loanminiapp.mapper.OrderBorrowerMapper;
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
     * 批量保存担保人信息
     */
    @Transactional(rollbackFor = Exception.class)
    public void batchSave(Long orderId, List<Step4GuarantorDTO> guarantors) {
        // 删除原有担保人
        deleteByOrderId(orderId);
        
        // 插入新的担保人
        if (guarantors != null && !guarantors.isEmpty()) {
            for (Step4GuarantorDTO dto : guarantors) {
                if (dto.getName() == null || dto.getName().trim().isEmpty()) {
                    continue;
                }
                
                OrderBorrower guarantor = OrderBorrower.builder()
                        .orderId(orderId)
                        .roleType("guarantor")
                        .name(dto.getName())
                        .idType(dto.getIdType())
                        .idNo(dto.getIdNumber())
                        .mobile(dto.getMobile())
                        .addressDetail(dto.getAddress())
                        .build();
                
                borrowerMapper.insert(guarantor);
            }
        }
        
        log.info("订单 {} 担保人信息保存成功，共 {} 人", orderId, guarantors != null ? guarantors.size() : 0);
    }

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

