package com.example.loanminiapp.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 订单状态流转记录表
 * - 核心字段：订单号、订单状态、操作人(user_id)、时间、备注
 */
@Data
@TableName("t_order_status_flow")
public class OrderStatusFlow {

    @TableId(type = IdType.AUTO)
    private Long id;

    /** 订单ID，对应 t_order.id */
    private Long orderId;

    /** 订单号，冗余方便查询 */
    private String orderNo;

    /** 订单状态编码，对应 OrderStatusEnum.code */
    private Integer orderStatus;

    /** 操作人用户ID */
    private Long operatorUserId;

    /** 备注信息（如操作来源、原因等） */
    private String remark;

    /** 创建时间（状态变更时间） */
    private LocalDateTime createdAt;
}


