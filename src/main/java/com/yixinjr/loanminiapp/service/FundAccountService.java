package com.yixinjr.loanminiapp.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.yixinjr.loanminiapp.dto.FundAccountDTO;
import com.yixinjr.loanminiapp.entity.FundAccount;
import com.yixinjr.loanminiapp.mapper.FundAccountMapper;
import com.yixinjr.loanminiapp.security.CurrentUserContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * 资金账户服务
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class FundAccountService {

    private final FundAccountMapper fundAccountMapper;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    /**
     * 查询账户列表
     */
    public List<FundAccountDTO> list() {
        LambdaQueryWrapper<FundAccount> query = new LambdaQueryWrapper<>();
        query.eq(FundAccount::getStatus, 1) // 只查询启用的账户
             .orderByDesc(FundAccount::getCreatedAt);
        
        List<FundAccount> accounts = fundAccountMapper.selectList(query);
        
        return accounts.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    /**
     * 根据ID查询账户
     */
    public FundAccountDTO getById(Long id) {
        FundAccount account = fundAccountMapper.selectById(id);
        if (account == null) {
            throw new RuntimeException("账户不存在: id=" + id);
        }
        return convertToDTO(account);
    }

    /**
     * 新增账户
     */
    @Transactional(rollbackFor = Exception.class)
    public Long add(FundAccountDTO dto) {
        // 验证必填字段
        validateAccount(dto);
        
        // 获取当前用户
        String currentUser = getCurrentUser();
        
        // 加密支付密码
        String encryptedPassword = null;
        if (dto.getPaymentPassword() != null && !dto.getPaymentPassword().trim().isEmpty()) {
            encryptedPassword = passwordEncoder.encode(dto.getPaymentPassword());
        }
        
        FundAccount account = FundAccount.builder()
                .assignee(dto.getAssignee())
                .paymentChannel(dto.getPaymentChannel())
                .microloanOrg(dto.getMicroloanOrg())
                .bankBranchNumber(dto.getBankBranchNumber())
                .boundBank(dto.getBoundBank())
                .accountNumber(dto.getAccountNumber())
                .paymentPassword(encryptedPassword)
                .status(1) // 默认启用
                .createdBy(currentUser)
                .build();
        
        fundAccountMapper.insert(account);
        log.info("新增资金账户成功: id={}, assignee={}", account.getId(), account.getAssignee());
        
        return account.getId();
    }

    /**
     * 更新账户
     */
    @Transactional(rollbackFor = Exception.class)
    public void update(Long id, FundAccountDTO dto) {
        FundAccount account = fundAccountMapper.selectById(id);
        if (account == null) {
            throw new RuntimeException("账户不存在: id=" + id);
        }
        
        // 验证必填字段
        validateAccount(dto);
        
        account.setAssignee(dto.getAssignee());
        account.setPaymentChannel(dto.getPaymentChannel());
        account.setMicroloanOrg(dto.getMicroloanOrg());
        account.setBankBranchNumber(dto.getBankBranchNumber());
        account.setBoundBank(dto.getBoundBank());
        account.setAccountNumber(dto.getAccountNumber());
        
        // 如果提供了新密码，则更新密码
        if (dto.getPaymentPassword() != null && !dto.getPaymentPassword().trim().isEmpty()) {
            String encryptedPassword = passwordEncoder.encode(dto.getPaymentPassword());
            account.setPaymentPassword(encryptedPassword);
        }
        
        fundAccountMapper.updateById(account);
        log.info("更新资金账户成功: id={}, assignee={}", id, account.getAssignee());
    }

    /**
     * 删除账户（软删除，设置状态为禁用）
     */
    @Transactional(rollbackFor = Exception.class)
    public void delete(Long id) {
        FundAccount account = fundAccountMapper.selectById(id);
        if (account == null) {
            log.warn("账户不存在: id={}", id);
            return;
        }
        
        account.setStatus(0); // 设置为禁用
        fundAccountMapper.updateById(account);
        log.info("删除资金账户成功: id={}, assignee={}", id, account.getAssignee());
    }

    /**
     * 验证账户信息
     */
    private void validateAccount(FundAccountDTO dto) {
        if (dto.getAssignee() == null || dto.getAssignee().trim().isEmpty()) {
            throw new RuntimeException("受让方不能为空");
        }
        if (dto.getAccountNumber() == null || dto.getAccountNumber().trim().isEmpty()) {
            throw new RuntimeException("银行账号不能为空");
        }
        if (dto.getPaymentPassword() == null || dto.getPaymentPassword().trim().isEmpty()) {
            throw new RuntimeException("支付密码不能为空");
        }
        if (dto.getPaymentPassword().length() < 6 || dto.getPaymentPassword().length() > 20) {
            throw new RuntimeException("支付密码长度必须为6-20位");
        }
    }

    /**
     * 转换为DTO（不返回密码）
     */
    private FundAccountDTO convertToDTO(FundAccount account) {
        FundAccountDTO dto = new FundAccountDTO();
        dto.setId(account.getId());
        dto.setAssignee(account.getAssignee());
        dto.setPaymentChannel(account.getPaymentChannel());
        dto.setMicroloanOrg(account.getMicroloanOrg());
        dto.setBankBranchNumber(account.getBankBranchNumber());
        dto.setBoundBank(account.getBoundBank());
        dto.setAccountNumber(account.getAccountNumber());
        dto.setStatus(account.getStatus());
        // 不返回密码到前端
        // dto.setPaymentPassword(account.getPaymentPassword());
        return dto;
    }

    /**
     * 获取当前用户
     */
    private String getCurrentUser() {
        try {
            Long userId = CurrentUserContext.get().getUserId();
            return userId != null ? userId.toString() : "system";
        } catch (Exception e) {
            return "system";
        }
    }
}

