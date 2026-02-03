package com.example.loanminiapp.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.example.loanminiapp.dto.step.Step1LoanInfoDTO;
import com.example.loanminiapp.entity.Order;
import com.example.loanminiapp.entity.OrderLoanInfo;
import com.example.loanminiapp.mapper.OrderLoanInfoMapper;
import com.example.loanminiapp.mapper.OrderMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 借款信息服务
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class OrderLoanInfoService {

    private final OrderLoanInfoMapper loanInfoMapper;
    private final OrderMapper orderMapper;

    /**
     * 保存借款信息
     */
    @Transactional(rollbackFor = Exception.class)
    public void save(Long orderId, Step1LoanInfoDTO dto) {
        OrderLoanInfo info = getOrCreate(orderId);
        
        // 直接映射 DTO 到实体，类型安全
        info.setAssigneeOrg(dto.getAssigneeOrg());
        info.setChannelOrg(dto.getMicroloanOrg());
        info.setPayMethod(dto.getPaymentChannel());
        info.setProductType(dto.getProductType());
        info.setBorrowerCategory(dto.getBorrowerType());
        info.setContractSignMode(dto.getContractSignMode());
        info.setLoanAmount(dto.getLoanAmount());
        info.setLoanAmountUppercase(dto.getLoanAmountUppercase());
        info.setLoanDays(dto.getLoanDays());
        info.setStartDate(parseDate(dto.getStartDate()));
        info.setEndDate(parseDate(dto.getEndDate()));
        info.setAnnualRate(dto.getAnnualRate());
        info.setSignPlace(dto.getSignPlace());
        info.setUsageDesc(dto.getLoanPurpose());
        info.setRepayMode(dto.getRepaymentMethod());
        info.setDisputeWay(dto.getDisputeResolution());
        info.setArbitrationOrg(dto.getArbitrationOrg());
        info.setIsNotarization(dto.getNotarization());
        
        if (info.getId() == null) {
            loanInfoMapper.insert(info);
        } else {
            loanInfoMapper.updateById(info);
        }
        
        // 同步更新订单表的借款信息字段
        syncToOrderTable(orderId, dto);
        
        log.info("订单 {} 借款信息保存成功", orderId);
    }

    /**
     * 加载借款信息
     */
    public OrderLoanInfo load(Long orderId) {
        LambdaQueryWrapper<OrderLoanInfo> query = new LambdaQueryWrapper<>();
        query.eq(OrderLoanInfo::getOrderId, orderId);
        return loanInfoMapper.selectOne(query);
    }

    /**
     * 获取或创建借款信息
     */
    private OrderLoanInfo getOrCreate(Long orderId) {
        OrderLoanInfo info = load(orderId);
        if (info == null) {
            info = OrderLoanInfo.builder()
                    .orderId(orderId)
                    .build();
        }
        return info;
    }

    /**
     * 同步借款信息到订单表
     */
    private void syncToOrderTable(Long orderId, Step1LoanInfoDTO dto) {
        LambdaUpdateWrapper<Order> updateWrapper = new LambdaUpdateWrapper<>();
        updateWrapper.eq(Order::getId, orderId);
        
        if (dto.getLoanAmount() != null) {
            updateWrapper.set(Order::getLoanAmount, dto.getLoanAmount());
        }
        if (dto.getLoanDays() != null) {
            updateWrapper.set(Order::getLoanDays, dto.getLoanDays());
        }
        if (dto.getStartDate() != null) {
            updateWrapper.set(Order::getStartDate, parseDate(dto.getStartDate()));
        }
        if (dto.getEndDate() != null) {
            updateWrapper.set(Order::getEndDate, parseDate(dto.getEndDate()));
        }
        if (dto.getAnnualRate() != null) {
            updateWrapper.set(Order::getAnnualRate, dto.getAnnualRate());
        }
        
        updateWrapper.set(Order::getUpdatedAt, LocalDateTime.now());
        orderMapper.update(null, updateWrapper);
    }

    /**
     * 解析日期字符串
     */
    private LocalDate parseDate(String dateStr) {
        if (dateStr == null || dateStr.isEmpty()) {
            return null;
        }
        try {
            return LocalDate.parse(dateStr);
        } catch (Exception e) {
            log.warn("日期解析失败: {}", dateStr);
            return null;
        }
    }
}

