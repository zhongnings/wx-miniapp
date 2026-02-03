package com.example.loanminiapp.service;

import com.example.loanminiapp.model.AttachmentItem;
import com.example.loanminiapp.model.ContractItem;
import com.example.loanminiapp.model.OrderDetail;
import com.example.loanminiapp.model.OrderProgressItem;
import com.example.loanminiapp.model.OrderSummary;
import com.example.loanminiapp.model.PageResult;
import com.example.loanminiapp.model.OrderTabStats;

import java.util.List;

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
     * 驳回订单（删除合同，将状态改回待提交）
     */
    void reject(Long id);
}

