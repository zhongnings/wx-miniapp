package com.example.loanminiapp.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.example.loanminiapp.dto.step.Step5BankCardDTO;
import com.example.loanminiapp.entity.OrderBankCard;
import com.example.loanminiapp.mapper.OrderBankCardMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * 银行卡信息服务
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class OrderBankCardService {

    private final OrderBankCardMapper bankCardMapper;

    /**
     * 批量保存银行卡信息
     */
    @Transactional(rollbackFor = Exception.class)
    public void batchSave(Long orderId, List<Step5BankCardDTO> bankCards) {
        if (bankCards == null || bankCards.isEmpty()) {
            return;
        }
        
        for (Step5BankCardDTO dto : bankCards) {
            if (dto.getBankName() == null || dto.getBankName().trim().isEmpty()) {
                continue;
            }
            
            // 如果带 id 且存在，则更新；否则新增
            if (dto.getId() != null) {
                OrderBankCard existed = bankCardMapper.selectOne(
                    new LambdaQueryWrapper<OrderBankCard>()
                        .eq(OrderBankCard::getId, dto.getId())
                        .eq(OrderBankCard::getOrderId, orderId)
                );
                
                if (existed != null) {
                    // 更新现有记录
                    updateFromDTO(existed, dto);
                    bankCardMapper.updateById(existed);
                    continue;
                }
            }
            
            // 新增记录
            OrderBankCard card = OrderBankCard.builder()
                    .orderId(orderId)
                    .build();
            updateFromDTO(card, dto);
            bankCardMapper.insert(card);
        }
        
        log.info("订单 {} 银行卡信息保存成功，共 {} 张", orderId, bankCards.size());
    }

    /**
     * 加载银行卡列表
     */
    public List<OrderBankCard> loadList(Long orderId) {
        LambdaQueryWrapper<OrderBankCard> query = new LambdaQueryWrapper<>();
        query.eq(OrderBankCard::getOrderId, orderId);
        return bankCardMapper.selectList(query);
    }

    /**
     * 删除银行卡
     */
    @Transactional(rollbackFor = Exception.class)
    public void delete(Long orderId, Long cardId) {
        LambdaQueryWrapper<OrderBankCard> query = new LambdaQueryWrapper<>();
        query.eq(OrderBankCard::getId, cardId)
             .eq(OrderBankCard::getOrderId, orderId);
        bankCardMapper.delete(query);
        log.info("订单 {} 银行卡 {} 已删除", orderId, cardId);
    }

    /**
     * 从 DTO 更新实体
     */
    private void updateFromDTO(OrderBankCard card, Step5BankCardDTO dto) {
        card.setBankName(dto.getBankName());
        card.setAccountName(dto.getCardholderName());
        card.setCardNo(dto.getCardNumber());
        card.setHolderType(dto.getHolderType());
        card.setIdType(dto.getIdType());
        card.setIdNo(dto.getIdNumber());
        card.setReservedMobile(dto.getReservedMobile());
        card.setCardFrontUrl(dto.getCardFrontImage());
    }
}
