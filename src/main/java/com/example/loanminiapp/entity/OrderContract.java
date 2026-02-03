package com.example.loanminiapp.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 订单合同实体类
 */
@Data
@Builder
@TableName("t_order_contract")
public class OrderContract {
    /** 主键ID */
    @TableId(type = IdType.AUTO)
    private Long id;

    /** 订单ID */
    private Long orderId;

    /** 合同名称 */
    private String name;

    /** 签署人 */
    private String signer;

    /** 状态：未签/已签 */
    private String status;

    /** 合同PDF文件路径 */
    private String pdfUrl;

    /** 签署二维码URL */
    private String qrCodeUrl;

    /** 已读时间 */
    private LocalDateTime readAt;

    /** 创建时间 */
    private LocalDateTime createdAt;

    /** 更新时间 */
    private LocalDateTime updatedAt;
}

