package com.yixinjr.loanminiapp.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Builder;
import lombok.Data;

/**
 * 附件实体，对应表 t_order_attachment
 */
@Data
@Builder
@TableName("t_order_attachment")
public class OrderAttachment {

    @TableId(type = IdType.AUTO)
    private Long id;

    /** 订单ID，对应 t_order.id */
    private Long orderId;

    /** 附件名称（原始文件名或展示名） */
    private String name;

    /** 附件访问 URL（映射到静态资源） */
    private String url;
}




