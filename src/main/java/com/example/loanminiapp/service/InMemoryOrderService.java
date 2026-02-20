package com.example.loanminiapp.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.example.loanminiapp.entity.Order;
import com.example.loanminiapp.entity.OrderAttachment;
import com.example.loanminiapp.entity.OrderBankCard;
import com.example.loanminiapp.entity.OrderBorrower;
import com.example.loanminiapp.entity.OrderLoanInfo;
import com.example.loanminiapp.entity.OrderStatusFlow;
import com.example.loanminiapp.entity.SysUser;
import com.example.loanminiapp.enums.OrderStatusEnum;
import com.example.loanminiapp.enums.RiskStatusEnum;
import com.example.loanminiapp.enums.RepaymentStatusEnum;
import com.example.loanminiapp.enums.SignStatusEnum;
import com.example.loanminiapp.entity.OrderUserRelation;
import com.example.loanminiapp.entity.OrderContract;
import com.example.loanminiapp.mapper.OrderAttachmentMapper;
import com.example.loanminiapp.mapper.OrderBankCardMapper;
import com.example.loanminiapp.mapper.OrderBorrowerMapper;
import com.example.loanminiapp.mapper.OrderContractMapper;
import com.example.loanminiapp.mapper.OrderLoanInfoMapper;
import com.example.loanminiapp.mapper.OrderMapper;
import com.example.loanminiapp.mapper.OrderStatusFlowMapper;
import com.example.loanminiapp.mapper.OrderUserRelationMapper;
import com.example.loanminiapp.mapper.SysUserMapper;
import com.example.loanminiapp.model.AttachmentItem;
import com.example.loanminiapp.model.ContractItem;
import com.example.loanminiapp.model.OrderDetail;
import com.example.loanminiapp.model.OrderProgressItem;
import com.example.loanminiapp.model.OrderSummary;
import com.example.loanminiapp.model.PageResult;
import com.example.loanminiapp.model.OrderTabStats;
import com.example.loanminiapp.security.CurrentUser;
import com.example.loanminiapp.security.CurrentUserContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.stereotype.Service;
import org.springframework.scheduling.annotation.Async;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

/**
 * 订单服务（数据库版本）
 * - 示例内存数据已注释，改为从数据库读取
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class InMemoryOrderService implements OrderService {

    private final OrderMapper orderMapper;
    private final OrderLoanInfoMapper orderLoanInfoMapper;
    private final OrderBorrowerMapper orderBorrowerMapper;
    private final OrderBankCardMapper orderBankCardMapper;
    private final OrderAttachmentMapper orderAttachmentMapper;
    private final OrderUserRelationMapper orderUserRelationMapper;
    private final OrderAccessService orderAccessService;
    private final OrderContractMapper orderContractMapper;
    private final ContractService contractService;
    private final OrderStatusFlowService orderStatusFlowService;
    private final OrderStatusFlowMapper orderStatusFlowMapper;
    private final SysUserMapper sysUserMapper;
    private final com.example.loanminiapp.mapper.OrderCoBorrowerMapper orderCoBorrowerMapper;
    private final com.example.loanminiapp.mapper.OrderGuarantorMapper orderGuarantorMapper;
    
    // 用于存储订单提交状态的内存缓存
    private static final Map<Long, Map<String, Object>> submitStatusCache = new ConcurrentHashMap<>();

    @Override
    public List<OrderSummary> list(String tab, String keyword, String status) {
        // 构建查询条件，直接在SQL层面过滤权限
        LambdaQueryWrapper<Order> queryWrapper = new LambdaQueryWrapper<>();
        
        // 根据角色添加权限过滤条件
        addRoleFilter(queryWrapper);
        
        // 执行查询
        List<Order> orders = orderMapper.selectList(queryWrapper);

        // tab 过滤
        orders = orders.stream().filter(o -> {
            Integer st = o.getOrderStatus();
            // 现在的状态机：0待提交、1签署中、2风控驳回、3待放款、4放款中、5完成
            if ("manage".equalsIgnoreCase(tab)) {
                return st == null || st != OrderStatusEnum.COMPLETED.getCode();
            } else if ("history".equalsIgnoreCase(tab)) {
                return st != null && st == OrderStatusEnum.COMPLETED.getCode();
            }
            return true;
        }).collect(Collectors.toList());

        // 关键字过滤
        if (StringUtils.isNotBlank(keyword)) {
            String kw = keyword.trim().toLowerCase();
            orders = orders.stream()
                    .filter(o -> (o.getBorrowerName() != null && o.getBorrowerName().toLowerCase().contains(kw))
                            || (o.getOrderNo() != null && o.getOrderNo().toLowerCase().contains(kw)))
                    .collect(Collectors.toList());
        }

        // 状态过滤
        Integer statusCode = parseOrderStatus(status);
        if (statusCode != null) {
            orders = orders.stream()
                    .filter(o -> o.getOrderStatus() != null && o.getOrderStatus().equals(statusCode))
                    .collect(Collectors.toList());
        }

        List<OrderSummary> summaries = orders.stream().map(this::toSummary).collect(Collectors.toList());
        summaries.sort(Comparator.comparing(OrderSummary::getLoanDate, Comparator.nullsLast(Comparator.reverseOrder())));
        return summaries;
    }

    @Override
    public PageResult<OrderSummary> listWithPage(String tab, String keyword, String status, Integer page, Integer size) {
        List<OrderSummary> all = list(tab, keyword, status);
        int from = Math.max(0, (page - 1) * size);
        int to = Math.min(all.size(), from + size);
        List<OrderSummary> pageData = from >= all.size() ? Collections.emptyList() : all.subList(from, to);
        int totalPages = (int) Math.ceil((double) all.size() / size);
        return new PageResult<OrderSummary>(pageData, (long) all.size(), page, size, totalPages);
    }

    @Override
    public OrderDetail detail(Long id) {
        checkAccess(id);
        Order order = orderMapper.selectById(id);
        if (order == null) {
            return null;
        }
        return toDetail(order);
    }

    @Override
    public List<OrderProgressItem> progress(Long id) {
        checkAccess(id);
        
        // 查询订单状态流转记录，按创建时间倒序排列
        List<OrderStatusFlow> flowList = orderStatusFlowMapper.selectList(
                new LambdaQueryWrapper<OrderStatusFlow>()
                        .eq(OrderStatusFlow::getOrderId, id)
                        .orderByDesc(OrderStatusFlow::getCreatedAt)
        );
        
        return flowList.stream().map(flow -> {
            OrderProgressItem item = new OrderProgressItem();
            
            // 设置状态名称
            OrderStatusEnum statusEnum = OrderStatusEnum.fromCode(flow.getOrderStatus());
            item.setStage(statusEnum != null ? statusEnum.getDesc() : "未知状态");
            
            // 设置操作人
            String operator = "系统";
            if (flow.getOperatorUserId() != null) {
                SysUser user = sysUserMapper.selectById(flow.getOperatorUserId());
                if (user != null && user.getUsername() != null) {
                    operator = user.getUsername();
                }
            }
            item.setOperator(operator);
            
            // 设置时间
            item.setTime(flow.getCreatedAt() != null ? flow.getCreatedAt().toString().replace("T", " ") : "");
            
            // 设置备注
            item.setRemark(flow.getRemark() != null ? flow.getRemark() : "无");
            
            return item;
        }).collect(Collectors.toList());
    }

    private Integer parseOrderStatus(String status) {
        if (StringUtils.isBlank(status) || "all".equalsIgnoreCase(status)) {
            return null;
        }
        try {
            return Integer.valueOf(status);
        } catch (NumberFormatException ignore) {
            // fallthrough to named mapping
        }
        switch (status.toLowerCase()) {
            case "pending":
                return OrderStatusEnum.PENDING_SUBMIT.getCode();
            case "signing":
                return OrderStatusEnum.RISK_REVIEWING.getCode();
            case "rejected":
                return OrderStatusEnum.RISK_REJECTED.getCode();
            case "pending_loan":
                return OrderStatusEnum.WAIT_LOAN.getCode();
            case "loaning":
                return OrderStatusEnum.LOANING.getCode();
            case "pending_transfer":
                return OrderStatusEnum.WAIT_TRANSFER.getCode();
            case "pending_face":
                return OrderStatusEnum.WAIT_FACE.getCode();
            case "completed":
                return OrderStatusEnum.COMPLETED.getCode();
            default:
                return null;
        }
    }

    @Override
    public List<OrderDetail.BankCardInfo> getBankCards(Long id) {
        checkAccess(id);
        List<OrderBankCard> bankCards = orderBankCardMapper.selectList(
                new LambdaQueryWrapper<OrderBankCard>()
                        .eq(OrderBankCard::getOrderId, id)
        );
        
        return bankCards.stream().map(bank -> {
            OrderDetail.BankCardInfo info = new OrderDetail.BankCardInfo();
            info.setId(bank.getId());
            info.setHolderType(bank.getHolderType());
            info.setAccountName(bank.getAccountName());
            info.setIdType(bank.getIdType());
            info.setIdNo(bank.getIdNo());
            info.setBankName(bank.getBankName());
            info.setCardNo(bank.getCardNo());
            info.setReservedMobile(bank.getReservedMobile());
            info.setCardFrontUrl(bank.getCardFrontUrl());
            return info;
        }).collect(Collectors.toList());
    }

    @Override
    public List<AttachmentItem> getAttachments(Long id) {
        checkAccess(id);
        List<OrderAttachment> attachments = orderAttachmentMapper.selectList(
                new LambdaQueryWrapper<OrderAttachment>()
                        .eq(OrderAttachment::getOrderId, id)
        );
        
        return attachments.stream().map(att -> {
            AttachmentItem item = new AttachmentItem();
            item.setId(att.getId());
            item.setName(att.getName());
            item.setUrl(att.getUrl());
            return item;
        }).collect(Collectors.toList());
    }

    @Override
    public List<ContractItem> contracts(Long id) {
        checkAccess(id);
        
        // 从数据库查询合同列表
        List<OrderContract> contractList = orderContractMapper.selectList(
                new LambdaQueryWrapper<OrderContract>()
                        .eq(OrderContract::getOrderId, id)
        );
        
        return contractList.stream().map(contract -> {
            ContractItem item = new ContractItem();
            item.setId(contract.getId());
            item.setName(contract.getName());
            item.setSigner(contract.getSigner());
            item.setStatus(contract.getStatus());
            item.setPdfUrl(contract.getPdfUrl());
            item.setQrCodeUrl(contract.getQrCodeUrl());
            item.setReadAt(contract.getReadAt() != null ? contract.getReadAt().toString() : null);
            return item;
        }).collect(Collectors.toList());
    }

    /**
     * 驳回订单（删除合同）
     */
    @Override
    public void reject(Long id) {
        checkAccess(id);
        Order order = orderMapper.selectById(id);
        if (order == null) {
            throw new RuntimeException("订单不存在");
        }
        
        // 查询订单的所有合同
        List<OrderContract> contracts = orderContractMapper.selectList(
                new LambdaQueryWrapper<OrderContract>()
                        .eq(OrderContract::getOrderId, id)
        );
        
        // 删除合同文件和数据库记录
        for (OrderContract contract : contracts) {
            // 删除合同文件
            if (contract.getPdfUrl() != null) {
                contractService.deleteContractFile(contract.getPdfUrl());
            }
            // 删除数据库记录
            orderContractMapper.deleteById(contract.getId());
            log.info("合同删除成功: contractId={}, orderId={}", contract.getId(), id);
        }
        
        // 更新订单状态为待提交
        order.setOrderStatus(OrderStatusEnum.PENDING_SUBMIT.getCode());
        order.setRiskStatus(RiskStatusEnum.PENDING.getCode());
        orderMapper.updateById(order);
        // 记录状态流转
        orderStatusFlowService.recordStatusChange(order, OrderStatusEnum.PENDING_SUBMIT, "风控驳回后驳回订单，状态回退为待提交");

        log.info("订单驳回成功，合同已删除: orderId={}", id);
    }

    /**
     * 通过风控审核
     */
    @Override
    public void approve(Long id) {
        checkAccess(id);
        Order order = orderMapper.selectById(id);
        if (order == null) {
            throw new RuntimeException("订单不存在");
        }
        
        // 检查当前状态是否为风控审核中
        if (order.getOrderStatus() == null || order.getOrderStatus() != OrderStatusEnum.RISK_REVIEWING.getCode()) {
            throw new RuntimeException("订单状态不正确，无法通过审核");
        }
        
        // 更新订单状态为待放款
        order.setOrderStatus(OrderStatusEnum.WAIT_LOAN.getCode());
        order.setRiskStatus(RiskStatusEnum.APPROVED.getCode());
        orderMapper.updateById(order);
        
        // 记录状态流转
        orderStatusFlowService.recordStatusChange(order, OrderStatusEnum.WAIT_LOAN, "风控审核通过");

        log.info("订单审核通过: orderId={}", id);
    }

    @Override
    public void delete(Long id) {
        checkAccess(id);
        orderMapper.deleteById(id);
    }

    @Override
    public OrderTabStats tabStats(String keyword, String status) {
        // 复用现有 list 逻辑，保持角色/关键字/状态过滤一致
        List<OrderSummary> manageList = list("manage", keyword, status);
        List<OrderSummary> historyList = list("history", keyword, status);
        return new OrderTabStats(
                (long) manageList.size(),
                (long) historyList.size()
        );
    }

    private OrderSummary toSummary(Order order) {
        OrderSummary s = new OrderSummary();
        s.setId(order.getId());
        s.setBorrowerName(order.getBorrowerName());
        s.setLoanAmount(order.getLoanAmount());
        s.setLoanDate(order.getStartDate());
        s.setOrderNo(order.getOrderNo());
        
        // 设置订单状态及名称
        s.setOrderStatus(order.getOrderStatus());
        if (order.getOrderStatus() != null) {
            s.setOrderStatusName(OrderStatusEnum.fromCode(order.getOrderStatus()).getDesc());
        }
        
        // 设置风控状态及名称
        s.setRiskStatus(order.getRiskStatus());
        if (order.getRiskStatus() != null) {
            s.setRiskStatusName(RiskStatusEnum.fromCode(order.getRiskStatus()).getDesc());
        }
        
        // 设置还款状态及名称
        s.setRepaymentStatus(order.getRepaymentStatus());
        if (order.getRepaymentStatus() != null) {
            s.setRepaymentStatusName(RepaymentStatusEnum.fromCode(order.getRepaymentStatus()).getDesc());
        }
        
        // 设置签署状态及名称
        s.setSignStatus(order.getSignStatus());
        if (order.getSignStatus() != null) {
            s.setSignStatusName(SignStatusEnum.fromCode(order.getSignStatus()).getDesc());
        }
        
        return s;
    }

    private OrderDetail toDetail(Order order) {
        OrderDetail d = new OrderDetail();
        d.setId(order.getId());
        d.setBorrowerName(order.getBorrowerName());
        d.setLoanAmount(order.getLoanAmount());
        d.setOrderNo(order.getOrderNo());
        d.setOrderStatus(order.getOrderStatus());
        d.setOrderStatusName(OrderStatusEnum.fromCode(order.getOrderStatus()).getDesc());
        d.setRiskStatus(order.getRiskStatus());
        d.setRepaymentStatus(order.getRepaymentStatus());
        d.setSignStatus(order.getSignStatus());

        // 借款信息
        OrderLoanInfo loanInfo = orderLoanInfoMapper.selectOne(new LambdaQueryWrapper<OrderLoanInfo>()
                .eq(OrderLoanInfo::getOrderId, order.getId()));
        if (loanInfo != null) {
            OrderDetail.LoanInfo li = new OrderDetail.LoanInfo();
            li.setAssigneeOrg(loanInfo.getAssigneeOrg());
            li.setChannelOrg(loanInfo.getChannelOrg());
            li.setPayMethod(loanInfo.getPayMethod());
            li.setProductType(loanInfo.getProductType());
            li.setBorrowerCategory(loanInfo.getBorrowerCategory());
            li.setContractSignMode(loanInfo.getContractSignMode());
            li.setLoanAmount(loanInfo.getLoanAmount());
            li.setLoanAmountUppercase(loanInfo.getLoanAmountUppercase());
            li.setLoanDays(loanInfo.getLoanDays());
            li.setStartDate(loanInfo.getStartDate() == null ? null : loanInfo.getStartDate().toString());
            li.setEndDate(loanInfo.getEndDate() == null ? null : loanInfo.getEndDate().toString());
            li.setAnnualRate(loanInfo.getAnnualRate());
            li.setSignPlace(loanInfo.getSignPlace());
            li.setUsage(loanInfo.getUsageDesc());
            li.setRepayMode(loanInfo.getRepayMode());
            li.setDisputeWay(loanInfo.getDisputeWay());
            li.setArbitrationOrg(loanInfo.getArbitrationOrg());
            li.setIsNotarization(loanInfo.getIsNotarization());
            d.setLoanInfo(li);
        }

        // 借款人信息
        OrderBorrower borrower = orderBorrowerMapper.selectOne(new LambdaQueryWrapper<OrderBorrower>()
                .eq(OrderBorrower::getOrderId, order.getId())
                .eq(OrderBorrower::getRoleType, "borrower"));
        if (borrower != null) {
            OrderDetail.PersonInfo p = new OrderDetail.PersonInfo();
            p.setIdType(borrower.getIdType());
            p.setName(borrower.getName());
            p.setIdNo(borrower.getIdNo());
            p.setIdIssueDate(borrower.getIdIssueDate() == null ? null : borrower.getIdIssueDate().toString());
            p.setIdExpireDate(borrower.getIdExpireDate() == null ? null : borrower.getIdExpireDate().toString());
            p.setMobile(borrower.getMobile());
            p.setProvinceCity(borrower.getProvinceCity());
            p.setAddressDetail(borrower.getAddressDetail());
            p.setGender(borrower.getGender());
            p.setBirthday(borrower.getBirthday() == null ? null : borrower.getBirthday().toString());
            p.setMaritalStatus(borrower.getMaritalStatus());
            p.setFaceFrontUrl(borrower.getFaceFrontUrl());
            p.setFaceBackUrl(borrower.getFaceBackUrl());
            d.setBorrowerInfo(p);
        }

        // 共借人信息（取第一条）
        com.example.loanminiapp.entity.OrderCoBorrower coBorrower = orderCoBorrowerMapper.selectOne(
                new LambdaQueryWrapper<com.example.loanminiapp.entity.OrderCoBorrower>()
                        .eq(com.example.loanminiapp.entity.OrderCoBorrower::getOrderId, order.getId())
                        .last("limit 1"));
        if (coBorrower != null) {
            OrderDetail.PersonInfo p = new OrderDetail.PersonInfo();
            p.setIdType(coBorrower.getIdType());
            p.setName(coBorrower.getName());
            p.setIdNo(coBorrower.getIdNo());
            p.setIdIssueDate(coBorrower.getIdIssueDate() == null ? null : coBorrower.getIdIssueDate().toString());
            p.setIdExpireDate(coBorrower.getIdExpireDate() == null ? null : coBorrower.getIdExpireDate().toString());
            p.setMobile(coBorrower.getMobile());
            p.setProvinceCity(coBorrower.getProvinceCity());
            p.setAddressDetail(coBorrower.getAddressDetail());
            p.setMaritalStatus(coBorrower.getMaritalStatus());
            p.setFaceFrontUrl(coBorrower.getFaceFrontUrl());
            p.setFaceBackUrl(coBorrower.getFaceBackUrl());
            p.setRelationship(coBorrower.getRelationship());
            d.setCoBorrowerInfo(p);
        }

        // 担保人信息（取第一条）
        com.example.loanminiapp.entity.OrderGuarantor guarantor = orderGuarantorMapper.selectOne(
                new LambdaQueryWrapper<com.example.loanminiapp.entity.OrderGuarantor>()
                        .eq(com.example.loanminiapp.entity.OrderGuarantor::getOrderId, order.getId())
                        .last("limit 1"));
        if (guarantor != null) {
            OrderDetail.PersonInfo p = new OrderDetail.PersonInfo();
            p.setIdType(guarantor.getIdType());
            p.setName(guarantor.getName());
            p.setIdNo(guarantor.getIdNo());
            p.setIdIssueDate(guarantor.getIdIssueDate() == null ? null : guarantor.getIdIssueDate().toString());
            p.setIdExpireDate(guarantor.getIdExpireDate() == null ? null : guarantor.getIdExpireDate().toString());
            p.setMobile(guarantor.getMobile());
            p.setProvinceCity(guarantor.getProvinceCity());
            p.setAddressDetail(guarantor.getAddressDetail());
            p.setMaritalStatus(guarantor.getMaritalStatus());
            p.setFaceFrontUrl(guarantor.getFaceFrontUrl());
            p.setFaceBackUrl(guarantor.getFaceBackUrl());
            p.setRelationship(guarantor.getRelationship());
            d.setGuarantorInfo(p);
        }

        // 银行卡信息（取第一条）
        OrderBankCard bank = orderBankCardMapper.selectOne(new LambdaQueryWrapper<OrderBankCard>()
                .eq(OrderBankCard::getOrderId, order.getId())
                .last("limit 1"));
        if (bank != null) {
            OrderDetail.BankCardInfo b = new OrderDetail.BankCardInfo();
            b.setHolderType(bank.getHolderType());
            b.setAccountName(bank.getAccountName());
            b.setIdType(bank.getIdType());
            b.setIdNo(bank.getIdNo());
            b.setBankName(bank.getBankName());
            b.setCardNo(bank.getCardNo());
            b.setReservedMobile(bank.getReservedMobile());
            d.setBankCardInfo(b);
        }

        // 附件
        List<OrderAttachment> attachments = orderAttachmentMapper.selectList(new LambdaQueryWrapper<OrderAttachment>()
                .eq(OrderAttachment::getOrderId, order.getId()));
        List<AttachmentItem> attachmentItems = attachments.stream().map(a -> {
            AttachmentItem item = new AttachmentItem();
            item.setId(a.getId());
            item.setName(a.getName());
            item.setUrl(a.getUrl());
            return item;
        }).collect(Collectors.toList());
        d.setAttachments(attachmentItems);

        // 合同/进度暂未接入
        d.setContracts(new ArrayList<>());

        return d;
    }

    /**
     * 根据用户角色添加权限过滤条件到查询中
     * - ADMIN：不添加任何过滤条件（查看所有订单）
     * - SALES/APPLICANT：通过子查询关联 t_order_user_relation 表
     */
    private void addRoleFilter(LambdaQueryWrapper<Order> queryWrapper) {
        CurrentUser cu = CurrentUserContext.get();
        if (cu == null || cu.getRoles() == null || cu.getRoles().isEmpty()) {
            // 未登录，返回空结果
            queryWrapper.eq(Order::getId, -1);
            return;
        }
        
        // ADMIN 角色可以查看所有订单，不添加过滤条件
        if (cu.getRoles().contains("ADMIN")) {
            return;
        }
        
        Long uid = cu.getUserId();
        if (uid == null) {
            // 用户ID为空，返回空结果
            queryWrapper.eq(Order::getId, -1);
            return;
        }
        
        // 查询用户有权限的订单ID列表
        List<OrderUserRelation> relations = orderUserRelationMapper.selectList(
                new LambdaQueryWrapper<OrderUserRelation>()
                        .eq(OrderUserRelation::getUserId, uid)
        );
        
        if (relations.isEmpty()) {
            // 没有关联订单，返回空结果
            queryWrapper.eq(Order::getId, -1);
            return;
        }
        
        // 根据角色过滤关系类型
        List<Long> allowedOrderIds = new ArrayList<>();
        
        if (cu.getRoles().contains("SALES")) {
            // SALES 角色只能看到自己作为业务员的订单
            allowedOrderIds = relations.stream()
                    .filter(r -> "SALES_OWNER".equals(r.getRelationType()))
                    .map(OrderUserRelation::getOrderId)
                    .collect(Collectors.toList());
        } else if (cu.getRoles().contains("APPLICANT")) {
            // APPLICANT 角色只能看到自己作为申请人的订单
            allowedOrderIds = relations.stream()
                    .filter(r -> "APPLICANT_OWNER".equals(r.getRelationType()))
                    .map(OrderUserRelation::getOrderId)
                    .collect(Collectors.toList());
        }
        
        if (allowedOrderIds.isEmpty()) {
            // 没有符合条件的订单，返回空结果
            queryWrapper.eq(Order::getId, -1);
        } else {
            // 添加 IN 条件，只查询有权限的订单
            queryWrapper.in(Order::getId, allowedOrderIds);
        }
    }

    @Override
    public void submit(Long id) {
        checkAccess(id);
        Order order = orderMapper.selectById(id);
        if (order == null) {
            throw new RuntimeException("订单不存在");
        }
        // 只有待提交状态的订单才能提交
        if (order.getOrderStatus() == null || order.getOrderStatus() != OrderStatusEnum.PENDING_SUBMIT.getCode()) {
            throw new RuntimeException("订单状态不允许提交");
        }
        
        // 生成合同
        try {
            generateContractForOrder(order);
        } catch (Exception e) {
            log.error("生成合同失败: orderId={}", id, e);
            throw new RuntimeException("生成合同失败: " + e.getMessage());
        }
        
        // 更新订单状态为签署中
        order.setOrderStatus(OrderStatusEnum.SIGNING.getCode());
        orderMapper.updateById(order);
        // 记录状态流转
        orderStatusFlowService.recordStatusChange(order, OrderStatusEnum.SIGNING, "提交订单，进入签署中");
        log.info("订单提交成功: orderId={}", id);
    }
    
    @Override
    @Async
    public void submitAsync(Long id) {
        log.info("开始异步提交订单: orderId={}", id);
        
        // 设置初始状态为处理中
        Map<String, Object> status = new HashMap<>();
        status.put("status", "processing");
        status.put("message", "订单提交中，正在生成合同...");
        submitStatusCache.put(id, status);
        
        try {
            // 执行提交逻辑
            submit(id);
            
            // 更新状态为成功
            status.put("status", "success");
            status.put("message", "订单提交成功");
            submitStatusCache.put(id, status);
            
            log.info("异步提交订单成功: orderId={}", id);
        } catch (Exception e) {
            log.error("异步提交订单失败: orderId={}", id, e);
            
            // 更新状态为失败
            status.put("status", "failed");
            status.put("message", "订单提交失败: " + e.getMessage());
            submitStatusCache.put(id, status);
        }
    }
    
    @Override
    public Map<String, Object> getSubmitStatus(Long id) {
        checkAccess(id);
        
        // 从缓存中获取状态
        Map<String, Object> status = submitStatusCache.get(id);
        
        if (status == null) {
            // 如果缓存中没有，检查订单当前状态
            Order order = orderMapper.selectById(id);
            if (order == null) {
                Map<String, Object> result = new HashMap<>();
                result.put("status", "failed");
                result.put("message", "订单不存在");
                return result;
            }
            
            // 根据订单状态判断
            if (order.getOrderStatus() != null && order.getOrderStatus() != OrderStatusEnum.PENDING_SUBMIT.getCode()) {
                Map<String, Object> result = new HashMap<>();
                result.put("status", "success");
                result.put("message", "订单已提交");
                return result;
            } else {
                Map<String, Object> result = new HashMap<>();
                result.put("status", "pending");
                result.put("message", "订单未提交");
                return result;
            }
        }
        
        // 如果已完成（成功或失败），清除缓存
        String statusStr = (String) status.get("status");
        if ("success".equals(statusStr) || "failed".equals(statusStr)) {
            // 延迟清除，给前端足够时间获取最终状态
            new Thread(() -> {
                try {
                    Thread.sleep(30000); // 30秒后清除
                    submitStatusCache.remove(id);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
            }).start();
        }
        
        return new HashMap<>(status);
    }

    /**
     * 为订单生成合同
     */
    private void generateContractForOrder(Order order) throws Exception {
        // 获取借款人信息
        OrderBorrower borrower = orderBorrowerMapper.selectOne(new LambdaQueryWrapper<OrderBorrower>()
                .eq(OrderBorrower::getOrderId, order.getId())
                .eq(OrderBorrower::getRoleType, "borrower"));
        
        if (borrower == null || borrower.getName() == null) {
            throw new RuntimeException("借款人信息不完整，无法生成合同");
        }
        
        // 获取借款信息
        OrderLoanInfo loanInfo = orderLoanInfoMapper.selectOne(new LambdaQueryWrapper<OrderLoanInfo>()
                .eq(OrderLoanInfo::getOrderId, order.getId()));
        
        // 获取银行卡信息（取第一个银行卡）
        OrderBankCard bankCard = orderBankCardMapper.selectOne(new LambdaQueryWrapper<OrderBankCard>()
                .eq(OrderBankCard::getOrderId, order.getId())
                .last("LIMIT 1"));
        
        // 生成合同PDF
        String contractRelativePath = contractService.generateContract(order, borrower, loanInfo, bankCard);
        String contractUrl = contractService.buildContractUrl(contractRelativePath);
        
        // 保存合同信息到数据库
        OrderContract contract = OrderContract.builder()
                .orderId(order.getId())
                .name("《" + borrower.getName() + "借款合同》")
                .signer(borrower.getName())
                .status("未签")
                .pdfUrl(contractUrl)
                .qrCodeUrl("/public/orders/" + order.getId() + "/contracts/qr-code")
                .build();
        
        orderContractMapper.insert(contract);
        log.info("合同生成并保存成功: orderId={}, contractId={}", order.getId(), contract.getId());
    }

    private void checkAccess(Long orderId) {
        orderAccessService.checkAccess(orderId);
    }
}

