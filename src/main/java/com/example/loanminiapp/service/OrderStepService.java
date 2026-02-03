package com.example.loanminiapp.service;

import com.example.loanminiapp.entity.Order;
import com.example.loanminiapp.enums.OrderStatusEnum;
import com.example.loanminiapp.enums.RiskStatusEnum;
import com.example.loanminiapp.mapper.OrderMapper;
import com.example.loanminiapp.security.CurrentUser;
import com.example.loanminiapp.security.CurrentUserContext;
import com.example.loanminiapp.util.HighConcurrencyOrderGenerator;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * 订单步骤服务（简化版）
 * 
 * 职责：
 * 1. 创建新订单
 * 2. 标记步骤完成状态
 * 
 * 注意：具体的数据保存由各个独立的 Service 和 Controller 处理
 * - Step1: OrderLoanInfoController
 * - Step2: OrderBorrowerController
 * - Step3: OrderCoBorrowerController ✅
 * - Step4: OrderGuarantorController
 * - Step5: OrderBankCardController
 * - Step6: OrderAttachmentController
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class OrderStepService {

    private final OrderMapper orderMapper;

    /**
     * 创建新订单
     * @return 订单ID
     */
    public Long createOrder() {
        CurrentUser currentUser = CurrentUserContext.get();
        String userId = currentUser != null ? String.valueOf(currentUser.getUserId()) : "system";
        
        // 生成订单编号：ORD + 时间戳 + 随机数
        String orderNo = HighConcurrencyOrderGenerator.generateUniqueOrderNumber();
        
        Order order = Order.builder()
                .orderNo(orderNo)
                .userId(userId)
                .orderStatus(OrderStatusEnum.PENDING_SUBMIT.getCode())
                .riskStatus(RiskStatusEnum.PENDING.getCode())
                .repaymentStatus(0)
                .signStatus(0)
                .loanInfoFilled(false)
                .borrowerInfoFilled(false)
                .coBorrowerInfoFilled(false)
                .guarantorInfoFilled(false)
                .bankCardInfoFilled(false)
                .attachmentUploaded(false)
                .voucherInfoFilled(false)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
        
        orderMapper.insert(order);
        log.info("创建新订单: orderId={}, orderNo={}", order.getId(), orderNo);
        return order.getId();
    }

    /**
     * 标记步骤完成状态
     * @param orderId 订单ID
     * @param step 步骤编号 (1-6)
     */
    @Transactional(rollbackFor = Exception.class)
    public void markStepCompleted(Long orderId, Integer step) {
        Order order = orderMapper.selectById(orderId);
        if (order == null) {
            throw new RuntimeException("订单不存在: " + orderId);
        }

        LambdaUpdateWrapper<Order> updateWrapper = new LambdaUpdateWrapper<>();
        updateWrapper.eq(Order::getId, orderId);
        
        switch (step) {
            case 1:
                updateWrapper.set(Order::getLoanInfoFilled, true);
                break;
            case 2:
                updateWrapper.set(Order::getBorrowerInfoFilled, true);
                break;
            case 3:
                updateWrapper.set(Order::getCoBorrowerInfoFilled, true);
                break;
            case 4:
                updateWrapper.set(Order::getGuarantorInfoFilled, true);
                break;
            case 5:
                updateWrapper.set(Order::getBankCardInfoFilled, true);
                break;
            case 6:
                updateWrapper.set(Order::getAttachmentUploaded, true);
                break;
            default:
                throw new RuntimeException("无效的步骤编号: " + step);
        }
        
        updateWrapper.set(Order::getUpdatedAt, LocalDateTime.now());
        orderMapper.update(null, updateWrapper);
        log.info("订单 {} 步骤 {} 已标记为完成", orderId, step);
    }
}

