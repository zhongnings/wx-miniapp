package com.example.loanminiapp.controller;

import com.example.loanminiapp.security.OrderAccessCheck;
import com.example.loanminiapp.dto.step.Step2BorrowerDTO;
import com.example.loanminiapp.entity.OrderBorrower;
import com.example.loanminiapp.service.OrderBorrowerService;
import com.example.loanminiapp.service.OrderStepService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * 借款人信息控制器（Step2）
 */
@Slf4j
@RestController
@RequestMapping("/api/order")
@RequiredArgsConstructor
public class OrderBorrowerController {

    private final OrderBorrowerService borrowerService;
    private final OrderStepService orderStepService;

    /**
     * 保存借款人信息
     * 如果 orderId 为 null，则先创建订单
     */
    @PostMapping("/borrower/save")
    public Map<String, Object> saveBorrower(@RequestBody Map<String, Object> request) {
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
        Step2BorrowerDTO dto = parseDTO(request);
        
        // 保存借款人信息
        borrowerService.save(orderId, dto);
        
        // 标记步骤完成
        orderStepService.markStepCompleted(orderId, 2);
        
        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("orderId", orderId);
        return result;
    }

    /**
     * 加载借款人信息
     */
    @GetMapping("/{orderId}/borrower")
    @OrderAccessCheck
    public Map<String, Object> loadBorrower(@PathVariable Long orderId) {
        OrderBorrower borrower = borrowerService.load(orderId);
        
        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("data", borrower);
        return result;
    }

    /**
     * 解析请求参数为 DTO
     */
    private Step2BorrowerDTO parseDTO(Map<String, Object> request) {
        Step2BorrowerDTO dto = new Step2BorrowerDTO();
        
        if (request.containsKey("name")) {
            dto.setName((String) request.get("name"));
        }
        if (request.containsKey("idType")) {
            dto.setIdType((String) request.get("idType"));
        }
        if (request.containsKey("idNumber")) {
            dto.setIdNumber((String) request.get("idNumber"));
        }
        if (request.containsKey("idEffectiveDate")) {
            dto.setIdEffectiveDate((String) request.get("idEffectiveDate"));
        }
        if (request.containsKey("idExpiryDate")) {
            dto.setIdExpiryDate((String) request.get("idExpiryDate"));
        }
        if (request.containsKey("idAddress")) {
            dto.setIdAddress((String) request.get("idAddress"));
        }
        if (request.containsKey("phone")) {
            dto.setPhone((String) request.get("phone"));
        }
        if (request.containsKey("residenceArea")) {
            dto.setResidenceArea((String) request.get("residenceArea"));
        }
        if (request.containsKey("residenceDetail")) {
            dto.setResidenceDetail((String) request.get("residenceDetail"));
        }
        if (request.containsKey("gender")) {
            dto.setGender((String) request.get("gender"));
        }
        if (request.containsKey("birthDate")) {
            dto.setBirthDate((String) request.get("birthDate"));
        }
        if (request.containsKey("maritalStatus")) {
            dto.setMaritalStatus((String) request.get("maritalStatus"));
        }
        if (request.containsKey("idFrontImage")) {
            dto.setIdFrontImage((String) request.get("idFrontImage"));
        }
        if (request.containsKey("idBackImage")) {
            dto.setIdBackImage((String) request.get("idBackImage"));
        }
        
        return dto;
    }
}

