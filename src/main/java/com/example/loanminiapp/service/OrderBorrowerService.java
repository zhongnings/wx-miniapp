package com.example.loanminiapp.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.example.loanminiapp.dto.step.Step2BorrowerDTO;
import com.example.loanminiapp.entity.Order;
import com.example.loanminiapp.entity.OrderBorrower;
import com.example.loanminiapp.mapper.OrderBorrowerMapper;
import com.example.loanminiapp.mapper.OrderMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 借款人信息服务
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class OrderBorrowerService {

    private final OrderBorrowerMapper borrowerMapper;
    private final OrderMapper orderMapper;

    /**
     * 保存借款人信息
     */
    @Transactional(rollbackFor = Exception.class)
    public void save(Long orderId, Step2BorrowerDTO dto) {
        OrderBorrower borrower = getOrCreate(orderId, "borrower");
        
        // 直接映射 DTO 到实体，类型安全
        borrower.setName(dto.getName());
        borrower.setIdType(dto.getIdType());
        borrower.setIdNo(dto.getIdNumber());
        borrower.setIdIssueDate(parseDate(dto.getIdEffectiveDate()));
        borrower.setIdExpireDate(parseDate(dto.getIdExpiryDate()));
        borrower.setMobile(dto.getPhone());
        borrower.setProvinceCity(dto.getResidenceArea());
        borrower.setAddressDetail(dto.getResidenceDetail());
        borrower.setGender(dto.getGender());
        borrower.setBirthday(parseDate(dto.getBirthDate()));
        borrower.setMaritalStatus(dto.getMaritalStatus());
        borrower.setFaceFrontUrl(dto.getIdFrontImage());
        borrower.setFaceBackUrl(dto.getIdBackImage());
        
        if (borrower.getId() == null) {
            borrowerMapper.insert(borrower);
        } else {
            borrowerMapper.updateById(borrower);
        }
        
        // 同步更新订单表的借款人姓名
        if (dto.getName() != null && !dto.getName().trim().isEmpty()) {
            syncBorrowerNameToOrder(orderId, dto.getName());
        }
        
        log.info("订单 {} 借款人信息保存成功", orderId);
    }

    /**
     * 加载借款人信息
     */
    public OrderBorrower load(Long orderId) {
        LambdaQueryWrapper<OrderBorrower> query = new LambdaQueryWrapper<>();
        query.eq(OrderBorrower::getOrderId, orderId)
             .eq(OrderBorrower::getRoleType, "borrower");
        return borrowerMapper.selectOne(query);
    }

    /**
     * 获取或创建借款人信息
     */
    private OrderBorrower getOrCreate(Long orderId, String roleType) {
        OrderBorrower borrower = load(orderId);
        if (borrower == null) {
            borrower = OrderBorrower.builder()
                    .orderId(orderId)
                    .roleType(roleType)
                    .build();
        }
        return borrower;
    }

    /**
     * 同步借款人姓名到订单表
     */
    private void syncBorrowerNameToOrder(Long orderId, String borrowerName) {
        LambdaUpdateWrapper<Order> updateWrapper = new LambdaUpdateWrapper<>();
        updateWrapper.eq(Order::getId, orderId)
                .set(Order::getBorrowerName, borrowerName)
                .set(Order::getUpdatedAt, LocalDateTime.now());
        orderMapper.update(null, updateWrapper);
        log.debug("订单 {} 借款人姓名已更新: {}", orderId, borrowerName);
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

