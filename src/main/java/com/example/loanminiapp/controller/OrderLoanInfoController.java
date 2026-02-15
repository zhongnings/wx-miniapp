package com.example.loanminiapp.controller;

import com.example.loanminiapp.security.OrderAccessCheck;
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
@RequestMapping("/public/orders")
@RequiredArgsConstructor
public class OrderLoanInfoController {

    private final OrderLoanInfoService loanInfoService;
    private final OrderStepService orderStepService;

    /**
     * 保存借款信息
     * 如果 orderId 为 null，则先创建订单
     */
    @PostMapping("/step1")
    public Map<String, Object> saveLoanInfo(@RequestBody OrderLoanInfo request) {
    
        // 保存借款信息
        Long orderId = loanInfoService.save(request);
        
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
    @GetMapping("/{orderId}/step1")
    @OrderAccessCheck
    public Map<String, Object> loadLoanInfo(@PathVariable Long orderId) {
        OrderLoanInfo info = loanInfoService.load(orderId);
        
        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("data", info);
        return result;
    }

}

