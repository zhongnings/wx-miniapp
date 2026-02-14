package com.example.loanminiapp.service;

import cn.hutool.core.bean.BeanUtil;
import cn.hutool.core.bean.copier.CopyOptions;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
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

    private final OrderStepService orderStepService;
    private final OrderLoanInfoMapper loanInfoMapper;
    private final OrderMapper orderMapper;

    /**
     * 保存借款信息
     */
    @Transactional(rollbackFor = Exception.class)
    public Long save(OrderLoanInfo dto) {
        Long orderId = dto.getOrderId();
        
        if (orderId == null) {
            orderId = orderStepService.createOrder();
            dto.setOrderId(orderId);
            loanInfoMapper.insert(dto);
        } else {
            LambdaQueryWrapper<OrderLoanInfo> query = new LambdaQueryWrapper<>();
            query.eq(OrderLoanInfo::getOrderId, orderId);
            OrderLoanInfo dbEntry = loanInfoMapper.selectOne(query);

            // 核心：忽略null值 + 排除id字段不复制
            CopyOptions options = CopyOptions.create()
                    .ignoreNullValue() // 忽略源null值
                    .setIgnoreProperties("id"); // 强制忽略id字段
            BeanUtil.copyProperties(dto, dbEntry, options);
            loanInfoMapper.updateById(dbEntry);
        }
        
        // 同步更新订单表的借款信息字段
        syncToOrderTable(orderId, dto);
        
        log.info("订单 {} 借款信息保存成功", orderId);
        return orderId;
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
    private void syncToOrderTable(Long orderId, OrderLoanInfo dto) {
        LambdaUpdateWrapper<Order> updateWrapper = new LambdaUpdateWrapper<>();
        updateWrapper.eq(Order::getId, orderId);
        
        if (dto.getLoanAmount() != null) {
            updateWrapper.set(Order::getLoanAmount, dto.getLoanAmount());
        }
        if (dto.getLoanDays() != null) {
            updateWrapper.set(Order::getLoanDays, dto.getLoanDays());
        }
        if (dto.getStartDate() != null) {
            updateWrapper.set(Order::getStartDate, dto.getStartDate());
        }
        if (dto.getEndDate() != null) {
            updateWrapper.set(Order::getEndDate, dto.getEndDate());
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

