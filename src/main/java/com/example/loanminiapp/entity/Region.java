package com.example.loanminiapp.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 行政区划实体类
 */
@Data
@TableName("t_region")
public class Region {

    @TableId(type = IdType.AUTO)
    private Long id;

    /** 行政区划代码（6位或12位） */
    private String code;

    /** 区划名称 */
    private String name;

    /** 全称 */
    private String fullName;

    /** 拼音 */
    private String pinyin;

    /** 拼音首字母缩写 */
    private String pinyinAbbr;

    /** 层级：1-省级，2-市级，3-区县级 */
    private Integer level;

    /** 父级区划代码 */
    private String parentCode;

    /** 排序 */
    private Integer sortOrder;

    /** 是否启用：1-启用，0-禁用 */
    private Integer isEnabled;

    /** 创建时间 */
    private LocalDateTime createTime;

    /** 更新时间 */
    private LocalDateTime updateTime;
}

