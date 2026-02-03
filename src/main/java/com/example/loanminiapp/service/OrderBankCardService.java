package com.example.loanminiapp.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.example.loanminiapp.dto.step.Step5BankCardDTO;
import com.example.loanminiapp.entity.OrderBankCard;
import com.example.loanminiapp.mapper.OrderBankCardMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
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
     * 上传根目录（文件系统路径），来自配置 file.upload-path
     */
    @Value("${file.upload-path:uploads}")
    private String uploadPath;

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
     * 新增单个银行卡
     */
    @Transactional(rollbackFor = Exception.class)
    public Long addOne(Long orderId, Step5BankCardDTO dto) {
        OrderBankCard card = OrderBankCard.builder()
                .orderId(orderId)
                .build();
        updateFromDTO(card, dto);
        bankCardMapper.insert(card);
        log.info("订单 {} 新增银行卡成功，cardId={}, bankName={}", orderId, card.getId(), dto.getBankName());
        return card.getId();
    }

    /**
     * 更新单个银行卡
     */
    @Transactional(rollbackFor = Exception.class)
    public void updateOne(Long orderId, Step5BankCardDTO dto) {
        OrderBankCard card = bankCardMapper.selectOne(
            new LambdaQueryWrapper<OrderBankCard>()
                .eq(OrderBankCard::getId, dto.getId())
                .eq(OrderBankCard::getOrderId, orderId)
        );
        
        if (card == null) {
            throw new RuntimeException("银行卡不存在: cardId=" + dto.getId());
        }
        
        updateFromDTO(card, dto);
        bankCardMapper.updateById(card);
        log.info("订单 {} 更新银行卡成功，cardId={}, bankName={}", orderId, card.getId(), dto.getBankName());
    }

    /**
     * 删除银行卡（同时删除关联的图片文件）
     */
    @Transactional(rollbackFor = Exception.class)
    public void delete(Long orderId, Long cardId) {
        // 先查询银行卡信息，获取图片URL
        OrderBankCard card = bankCardMapper.selectOne(
            new LambdaQueryWrapper<OrderBankCard>()
                .eq(OrderBankCard::getId, cardId)
                .eq(OrderBankCard::getOrderId, orderId)
        );
        
        if (card == null) {
            log.warn("银行卡不存在: orderId={}, cardId={}", orderId, cardId);
            return;
        }
        
        // 删除数据库记录
        LambdaQueryWrapper<OrderBankCard> query = new LambdaQueryWrapper<>();
        query.eq(OrderBankCard::getId, cardId)
             .eq(OrderBankCard::getOrderId, orderId);
        bankCardMapper.delete(query);
        log.info("订单 {} 银行卡 {} 已删除", orderId, cardId);
        
        // 删除关联的图片文件
        if (StringUtils.hasText(card.getCardFrontUrl())) {
            deleteImageFile(orderId, card.getCardFrontUrl());
        }
    }
    
    /**
     * 删除图片文件（从URL中提取文件名并删除）
     * @param orderId 订单ID
     * @param imageUrl 图片URL
     */
    private void deleteImageFile(Long orderId, String imageUrl) {
        try {
            // 从URL中提取文件名
            // 例如：http://localhost:8081/uploads/1/bankCard-6997-1706784123456.png
            // 提取：bankCard-6997-1706784123456.png
            String fileName = extractFileNameFromUrl(imageUrl);
            if (fileName == null || fileName.isEmpty()) {
                log.warn("无法从URL提取文件名: {}", imageUrl);
                return;
            }
            
            // 构建文件路径
            Path root = resolveUploadRoot();
            Path orderDir = root.resolve(String.valueOf(orderId));
            Path targetFile = orderDir.resolve(fileName);
            
            // 安全检查：确保文件在订单目录下
            if (!targetFile.normalize().startsWith(orderDir.normalize())) {
                log.warn("非法文件路径: orderId={}, fileName={}", orderId, fileName);
                return;
            }
            
            // 删除文件
            if (Files.exists(targetFile)) {
                Files.delete(targetFile);
                log.info("图片文件删除成功: orderId={}, fileName={}", orderId, fileName);
            } else {
                log.debug("图片文件不存在，跳过删除: orderId={}, fileName={}", orderId, fileName);
            }
            
        } catch (IOException e) {
            // 文件删除失败不影响数据库操作，只记录日志
            log.error("删除图片文件失败: orderId={}, imageUrl={}", orderId, imageUrl, e);
        }
    }
    
    /**
     * 从URL中提取文件名
     * @param url 图片URL
     * @return 文件名
     */
    private String extractFileNameFromUrl(String url) {
        if (url == null || url.isEmpty()) {
            return null;
        }
        
        // 处理完整URL：http://localhost:8081/uploads/1/bankCard-6997.png
        // 或相对URL：/uploads/1/bankCard-6997.png
        String[] parts = url.split("/");
        if (parts.length > 0) {
            return parts[parts.length - 1];
        }
        
        return null;
    }
    
    /**
     * 解析上传根目录到文件系统路径
     */
    private Path resolveUploadRoot() {
        String path = uploadPath;
        if (path == null || path.trim().isEmpty()) {
            path = "uploads";
        }
        
        if (path.startsWith("/") && !path.startsWith("//")) {
            path = path.substring(1);
        }
        
        Path rootPath = Paths.get(path);
        if (!rootPath.isAbsolute()) {
            rootPath = rootPath.toAbsolutePath();
        }
        
        return rootPath;
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
