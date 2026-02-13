package com.example.loanminiapp.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.example.loanminiapp.entity.OrderBankCard;
import com.example.loanminiapp.entity.OrderBorrower;
import com.example.loanminiapp.entity.OrderVoucher;
import com.example.loanminiapp.enums.PayeeTypeEnum;
import com.example.loanminiapp.mapper.OrderBankCardMapper;
import com.example.loanminiapp.mapper.OrderBorrowerMapper;
import com.example.loanminiapp.mapper.OrderVoucherMapper;
import com.example.loanminiapp.model.PayeeInfo;
import com.example.loanminiapp.model.VoucherInfo;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

/**
 * 制单服务实现
 */
@Service
@RequiredArgsConstructor
public class OrderVoucherServiceImpl implements OrderVoucherService {

    private final OrderVoucherMapper orderVoucherMapper;
    private final OrderBankCardMapper orderBankCardMapper;
    private final OrderBorrowerMapper orderBorrowerMapper;

    @Override
    public List<VoucherInfo> listByOrderId(Long orderId) {
        List<OrderVoucher> vouchers = orderVoucherMapper.selectList(
                new LambdaQueryWrapper<OrderVoucher>()
                        .eq(OrderVoucher::getOrderId, orderId)
        );

        List<VoucherInfo> result = new ArrayList<>();
        for (OrderVoucher voucher : vouchers) {
            VoucherInfo info = new VoucherInfo();
            BeanUtils.copyProperties(voucher, info);
            // 添加 payeeTypeName 的枚举映射
            info.setPayeeTypeName(PayeeTypeEnum.getNameByCode(voucher.getPayeeType()));
            result.add(info);
        }
        return result;
    }

    @Override
    public List<PayeeInfo> getPayeeList(Long orderId) {
        List<PayeeInfo> result = new ArrayList<>();

        // 查询所有银行卡信息
        List<OrderBankCard> bankCards = orderBankCardMapper.selectList(
                new LambdaQueryWrapper<OrderBankCard>()
                        .eq(OrderBankCard::getOrderId, orderId)
        );

        // 查询所有借款人信息（包括借款人、共借人、担保人）
        List<OrderBorrower> borrowers = orderBorrowerMapper.selectList(
                new LambdaQueryWrapper<OrderBorrower>()
                        .eq(OrderBorrower::getOrderId, orderId)
        );

        // 组装收款方信息
        for (OrderBankCard card : bankCards) {
            String holderType = card.getHolderType();

            PayeeInfo payee = new PayeeInfo();
            payee.setName(card.getAccountName());
            payee.setType(holderType);
            // 使用枚举获取类型名称
            payee.setTypeName(PayeeTypeEnum.getNameByCode(holderType));

            // 从借款人信息中获取借款人类型（个人/对公）
            // 这里假设借款人类型存储在 OrderBorrower 中，如果没有则默认为"个人"
            String category = "个人";
            for (OrderBorrower borrower : borrowers) {
                if (borrower.getRoleType().equals(holderType)) {
                    // 如果 OrderBorrower 有 category 字段，从这里获取
                    // category = borrower.getCategory() != null ? borrower.getCategory() : "个人";
                    break;
                }
            }
            payee.setCategory(category);

            payee.setBankName(card.getBankName());
            payee.setCardNo(card.getCardNo());
            result.add(payee);
        }

        // 按类型优先级排序：借款人优先，然后是共借人
        result.sort((a, b) -> {
            int priorityA = PayeeTypeEnum.getPriorityByCode(a.getType());
            int priorityB = PayeeTypeEnum.getPriorityByCode(b.getType());
            return Integer.compare(priorityA, priorityB);
        });

        return result;
    }

    @Override
    public void addVoucher(VoucherInfo voucherInfo) {
        OrderVoucher voucher = new OrderVoucher();
        BeanUtils.copyProperties(voucherInfo, voucher);
        orderVoucherMapper.insert(voucher);
    }

    @Override
    public void deleteVoucher(Long id) {
        orderVoucherMapper.deleteById(id);
    }

    @Override
    public VoucherLimitInfo getLimitInfo(Long orderId) {
        VoucherLimitInfo limitInfo = new VoucherLimitInfo();
        
        // 计算已使用的制单金额
        List<OrderVoucher> vouchers = orderVoucherMapper.selectList(
                new LambdaQueryWrapper<OrderVoucher>()
                        .eq(OrderVoucher::getOrderId, orderId)
        );
        
        long usedAmount = vouchers.stream()
                .mapToLong(v -> v.getAmount() != null ? v.getAmount().longValue() : 0L)
                .sum();
        
        limitInfo.usedAmount = usedAmount;
        return limitInfo;
    }
}

