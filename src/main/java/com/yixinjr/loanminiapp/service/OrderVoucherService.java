package com.yixinjr.loanminiapp.service;

import com.yixinjr.loanminiapp.model.PayeeInfo;
import com.yixinjr.loanminiapp.model.VoucherInfo;

import java.util.List;

/**
 * 制单服务接口
 */
public interface OrderVoucherService {

    /**
     * 获取订单的制单列表
     */
    List<VoucherInfo> listByOrderId(Long orderId);

    /**
     * 获取订单的收款方列表（借款人、共借人、担保人的银行卡信息）
     */
    List<PayeeInfo> getPayeeList(Long orderId);

    /**
     * 新增制单信息
     */
    void addVoucher(VoucherInfo voucherInfo);

    /**
     * 根据ID获取制单详情
     */
    VoucherInfo getVoucherById(Long id);

    /**
     * 修改制单信息
     */
    void updateVoucher(Long id, VoucherInfo voucherInfo);

    /**
     * 删除制单信息
     */
    void deleteVoucher(Long id);

    /**
     * 获取制单限额信息
     */
    VoucherLimitInfo getLimitInfo(Long orderId);

    /**
     * 制单限额信息
     */
    class VoucherLimitInfo {
        /** 单笔限额 */
        public Long singleLimit = 5000000L; // 500万

        /** 单日限额 */
        public Long dailyLimit = 30000000L; // 3000万

        /** 单月限额 */
        public Long monthlyLimit = 100000000L; // 1亿

        /** 已使用的制单金额 */
        public Long usedAmount = 0L;
    }
}

