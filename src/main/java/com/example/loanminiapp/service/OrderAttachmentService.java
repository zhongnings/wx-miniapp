package com.example.loanminiapp.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.example.loanminiapp.dto.step.Step6AttachmentDTO;
import com.example.loanminiapp.entity.OrderAttachment;
import com.example.loanminiapp.mapper.OrderAttachmentMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * 附件信息服务
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class OrderAttachmentService {

    private final OrderAttachmentMapper attachmentMapper;

    /**
     * 批量保存附件信息
     */
    @Transactional(rollbackFor = Exception.class)
    public void batchSave(Long orderId, List<Step6AttachmentDTO> attachments) {
        // 删除原有附件
        deleteByOrderId(orderId);
        
        // 插入新的附件
        if (attachments != null && !attachments.isEmpty()) {
            for (Step6AttachmentDTO dto : attachments) {
                if (dto.getUrl() == null || dto.getUrl().trim().isEmpty()) {
                    continue;
                }
                
                OrderAttachment attachment = OrderAttachment.builder()
                        .orderId(orderId)
                        .name(dto.getName())
                        .url(dto.getUrl())
                        .build();
                
                attachmentMapper.insert(attachment);
            }
        }
        
        log.info("订单 {} 附件信息保存成功，共 {} 个", orderId, attachments != null ? attachments.size() : 0);
    }

    /**
     * 加载附件列表
     */
    public List<OrderAttachment> loadList(Long orderId) {
        LambdaQueryWrapper<OrderAttachment> query = new LambdaQueryWrapper<>();
        query.eq(OrderAttachment::getOrderId, orderId);
        return attachmentMapper.selectList(query);
    }

    /**
     * 删除订单的所有附件
     */
    @Transactional(rollbackFor = Exception.class)
    public void deleteByOrderId(Long orderId) {
        LambdaQueryWrapper<OrderAttachment> query = new LambdaQueryWrapper<>();
        query.eq(OrderAttachment::getOrderId, orderId);
        attachmentMapper.delete(query);
    }

    /**
     * 删除单个附件
     */
    @Transactional(rollbackFor = Exception.class)
    public void delete(Long orderId, Long attachmentId) {
        LambdaQueryWrapper<OrderAttachment> query = new LambdaQueryWrapper<>();
        query.eq(OrderAttachment::getId, attachmentId)
             .eq(OrderAttachment::getOrderId, orderId);
        attachmentMapper.delete(query);
        log.info("订单 {} 附件 {} 已删除", orderId, attachmentId);
    }
}
