package com.example.loanminiapp.dto;

import lombok.Data;
import java.util.Map;

/**
 * 订单步骤保存请求DTO
 */
@Data
public class OrderStepSaveRequest {
    private Long orderId;
    private Integer step; // 1-6
    private Map<String, Object> data; // 步骤数据
}

