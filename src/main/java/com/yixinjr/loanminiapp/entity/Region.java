package com.yixinjr.loanminiapp.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 行政区划实体
 */
@Data
@TableName("t_region")
public class Region {
    
    @TableId(type = IdType.AUTO)
    private Long id;
    
    /**
     * 行政区划代码
     */
    private String code;
    
    /**
     * 名称
     */
    private String name;
    
    /**
     * 父级代码
     */
    private String parentCode;
    
    /**
     * 层级：1-省，2-市，3-区
     */
    private Integer level;
    
    /**
     * 拼音
     */
    private String pinyin;
    
    /**
     * 简称
     */
    private String shortName;
    
    /**
     * 排序
     */
    private Integer sortOrder;
    
    /**
     * 状态：1-启用，0-禁用
     */
    private Integer status;
    
    private LocalDateTime createTime;
    
    private LocalDateTime updateTime;
}
