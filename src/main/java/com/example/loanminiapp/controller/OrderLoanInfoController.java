package com.example.loanminiapp.controller;

import com.example.loanminiapp.security.OrderAccessCheck;
import com.example.loanminiapp.dto.step.Step1LoanInfoDTO;
import com.example.loanminiapp.entity.OrderLoanInfo;
import com.example.loanminiapp.service.OrderLoanInfoService;
import com.example.loanminiapp.service.OrderStepService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * 借款信息控制器（Step1）
 */
@Slf4j
@RestController
@RequestMapping("/api/order")
@RequiredArgsConstructor
public class OrderLoanInfoController {

    private final OrderLoanInfoService loanInfoService;
    private final OrderStepService orderStepService;

    /**
     * 保存借款信息
     * 如果 orderId 为 null，则先创建订单
     */
    @PostMapping("/loanInfo/save")
    public Map<String, Object> saveLoanInfo(@RequestBody Map<String, Object> request) {
        Long orderId = null;
        Object orderIdObj = request.get("orderId");
        if (orderIdObj != null) {
            orderId = Long.valueOf(orderIdObj.toString());
        }
        
        // 如果没有 orderId，先创建订单
        if (orderId == null) {
            orderId = orderStepService.createOrder();
        }
        
        // 解析 DTO
        Step1LoanInfoDTO dto = parseDTO(request);
        
        // 保存借款信息
        loanInfoService.save(orderId, dto);
        
        // 标记步骤完成
        orderStepService.markStepCompleted(orderId, 1);
        
        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("orderId", orderId);
        return result;
    }

    /**
     * 加载借款信息
     */
    @GetMapping("/{orderId}/loanInfo")
    @OrderAccessCheck
    public Map<String, Object> loadLoanInfo(@PathVariable Long orderId) {
        OrderLoanInfo info = loanInfoService.load(orderId);
        
        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("data", info);
        return result;
    }

    /**
     * 解析请求参数为 DTO
     */
    private Step1LoanInfoDTO parseDTO(Map<String, Object> request) {
        Step1LoanInfoDTO dto = new Step1LoanInfoDTO();
        
        if (request.containsKey("assigneeOrg")) {
            dto.setAssigneeOrg((String) request.get("assigneeOrg"));
        }
        if (request.containsKey("microloanOrg")) {
            dto.setMicroloanOrg((String) request.get("microloanOrg"));
        }
        if (request.containsKey("paymentChannel")) {
            dto.setPaymentChannel((String) request.get("paymentChannel"));
        }
        if (request.containsKey("productType")) {
            dto.setProductType((String) request.get("productType"));
        }
        if (request.containsKey("borrowerType")) {
            dto.setBorrowerType((String) request.get("borrowerType"));
        }
        if (request.containsKey("contractSignMode")) {
            dto.setContractSignMode((String) request.get("contractSignMode"));
        }
        if (request.containsKey("loanAmount")) {
            dto.setLoanAmount(new java.math.BigDecimal(request.get("loanAmount").toString()));
        }
        if (request.containsKey("loanAmountUppercase")) {
            dto.setLoanAmountUppercase((String) request.get("loanAmountUppercase"));
        }
        if (request.containsKey("loanDays")) {
            dto.setLoanDays(Integer.valueOf(request.get("loanDays").toString()));
        }
        if (request.containsKey("startDate")) {
            dto.setStartDate((String) request.get("startDate"));
        }
        if (request.containsKey("endDate")) {
            dto.setEndDate((String) request.get("endDate"));
        }
        if (request.containsKey("annualRate")) {
            dto.setAnnualRate(new java.math.BigDecimal(request.get("annualRate").toString()));
        }
        if (request.containsKey("signPlace")) {
            dto.setSignPlace((String) request.get("signPlace"));
        }
        if (request.containsKey("loanPurpose")) {
            dto.setLoanPurpose((String) request.get("loanPurpose"));
        }
        if (request.containsKey("repaymentMethod")) {
            dto.setRepaymentMethod((String) request.get("repaymentMethod"));
        }
        if (request.containsKey("disputeResolution")) {
            dto.setDisputeResolution((String) request.get("disputeResolution"));
        }
        if (request.containsKey("arbitrationOrg")) {
            dto.setArbitrationOrg((String) request.get("arbitrationOrg"));
        }
        if (request.containsKey("notarization")) {
            dto.setNotarization((String) request.get("notarization"));
        }
        
        return dto;
    }
}

