package com.example.loanminiapp.controller;

import com.example.loanminiapp.security.OrderAccessCheck;
import com.example.loanminiapp.dto.step.Step4GuarantorDTO;
import com.example.loanminiapp.entity.OrderBorrower;
import com.example.loanminiapp.service.OrderGuarantorService;
import com.example.loanminiapp.service.OrderStepService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 担保人信息控制器（Step4）
 */
@Slf4j
@RestController
@RequestMapping("/api/order")
@RequiredArgsConstructor
public class OrderGuarantorController {

    private final OrderGuarantorService guarantorService;
    private final OrderStepService orderStepService;

    /**
     * 批量保存担保人信息
     */
    @PostMapping("/{orderId}/guarantors/save")
    @OrderAccessCheck
    public Map<String, Object> saveGuarantors(@PathVariable Long orderId,
                                               @RequestBody Map<String, Object> request) {
        // 解析担保人列表
        List<Step4GuarantorDTO> guarantors = parseGuarantorList(request);
        
        // 保存担保人信息
        guarantorService.batchSave(orderId, guarantors);
        
        // 标记步骤完成
        orderStepService.markStepCompleted(orderId, 4);
        
        // 记录担保合同签署方式（暂不落库）
        if (request.containsKey("guaranteeSignMethod")) {
            log.info("订单 {} 担保合同签署方式: {}", orderId, request.get("guaranteeSignMethod"));
        }
        
        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("orderId", orderId);
        return result;
    }

    /**
     * 加载担保人列表
     */
    @GetMapping("/{orderId}/guarantors")
    @OrderAccessCheck
    public Map<String, Object> loadGuarantors(@PathVariable Long orderId) {
        List<OrderBorrower> guarantors = guarantorService.loadList(orderId);
        
        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("data", guarantors);
        return result;
    }

    /**
     * 解析担保人列表
     */
    @SuppressWarnings("unchecked")
    private List<Step4GuarantorDTO> parseGuarantorList(Map<String, Object> request) {
        List<Step4GuarantorDTO> guarantors = new ArrayList<>();
        
        Object guarantorsObj = request.get("guarantors");
        if (guarantorsObj instanceof List) {
            List<?> list = (List<?>) guarantorsObj;
            for (Object item : list) {
                if (item instanceof Map) {
                    Map<String, Object> map = (Map<String, Object>) item;
                    Step4GuarantorDTO dto = new Step4GuarantorDTO();
                    
                    if (map.containsKey("name")) {
                        dto.setName((String) map.get("name"));
                    }
                    if (map.containsKey("idType")) {
                        dto.setIdType((String) map.get("idType"));
                    }
                    if (map.containsKey("idNumber")) {
                        dto.setIdNumber((String) map.get("idNumber"));
                    }
                    if (map.containsKey("mobile")) {
                        dto.setMobile((String) map.get("mobile"));
                    }
                    if (map.containsKey("relation")) {
                        dto.setRelation((String) map.get("relation"));
                    }
                    if (map.containsKey("address")) {
                        dto.setAddress((String) map.get("address"));
                    }
                    
                    guarantors.add(dto);
                }
            }
        }
        
        return guarantors;
    }
}

