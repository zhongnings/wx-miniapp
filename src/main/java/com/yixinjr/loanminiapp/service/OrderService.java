package com.yixinjr.loanminiapp.service;

import com.yixinjr.loanminiapp.model.AttachmentItem;
import com.yixinjr.loanminiapp.model.ContractItem;
import com.yixinjr.loanminiapp.model.OrderDetail;
import com.yixinjr.loanminiapp.model.OrderProgressItem;
import com.yixinjr.loanminiapp.model.OrderSummary;
import com.yixinjr.loanminiapp.model.PageResult;
import com.yixinjr.loanminiapp.model.OrderTabStats;

import java.util.List;
import java.util.Map;

public interface OrderService {

    List<OrderSummary> list(String tab, String keyword, String status);

    PageResult<OrderSummary> listWithPage(String tab, String keyword, String status, Integer page, Integer size);

    OrderDetail detail(Long id);

    List<OrderProgressItem> progress(Long id);

    List<ContractItem> contracts(Long id);

    List<OrderDetail.BankCardInfo> getBankCards(Long id);

    List<AttachmentItem> getAttachments(Long id);

    void delete(Long id);

    /**
     * 订单管理 / 历史订单的数量统计
     */
    OrderTabStats tabStats(String keyword, String status);

    /**
     * 提交订单（将状态从待提交改为风控审核中）
     */
    void submit(Long id);
    
    /**
     * 异步提交订单（立即返回，后台处理）
     */
    void submitAsync(Long id);
    
    /**
     * 获取订单提交状态
     * @return status: processing(处理中) | success(成功) | failed(失败), message: 提示信息
     */
    java.util.Map<String, Object> getSubmitStatus(Long id);

    /**
     * 驳回订单（删除合同，将状态改回待提交）
     */
    void reject(Long id);

    /**
     * 通过风控审核（将状态从风控审核中改为待放款）
     */
    void approve(Long id);

    /**
     * 获取合同签署二维码（电子签平台 H5 短链转二维码图；未配置时返回占位）
     */
    Map<String, Object> getContractSignQr(Long orderId, Long contractId);

    /**
     * 催签（电子签平台的催签能力，如 CreateFlowReminds）
     */
    void urgeContractSign(Long orderId, Long contractId);
}

