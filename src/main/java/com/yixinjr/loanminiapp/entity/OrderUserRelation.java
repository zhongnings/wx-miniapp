package com.yixinjr.loanminiapp.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Builder;
import lombok.Data;

/**
 * 订单与用户（业务员/申请人）关联（预留）
 * 对应表：t_order_user_relation
 */
@Data
@Builder
@TableName("t_order_user_relation")
public class OrderUserRelation {

    /** 订单ID，对应 t_order.id */
    private Long orderId;

    /** 用户ID（申请人或业务员），对应 sys_user.id */
    private Long userId;

    /** 关联类型：APPLICANT_OWNER / SALES_OWNER */
    private String relationType;
}








