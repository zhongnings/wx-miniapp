package com.example.loanminiapp.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class OrderTabStats {
    /**
     * 订单管理 tab 总数（非已完成）
     */
    private Long manageTotal;

    /**
     * 历史订单 tab 总数（已完成）
     */
    private Long historyTotal;
}


