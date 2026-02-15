package com.example.loanminiapp.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 数据字典项表
 */
@Data
@TableName("t_dict_item")
public class DictItem {
    
    @TableId(type = IdType.AUTO)
    private Long id;
    
    /**
     * 分类编码（关联dict_category）
     */
    private String categoryCode;
    
    /**
     * 选项编码（可选）
     */
    private String itemCode;
    
    /**
     * 选项值（显示给用户的文本）
     */
    private String itemValue;
    
    /**
     * 选项标签（可选，用于国际化等场景）
     */
    private String itemLabel;
    
    /**
     * 排序顺序
     */
    private Integer sortOrder;
    
    /**
     * 是否启用（1-启用，0-禁用）
     */
    private Boolean isEnabled;
    
    /**
     * 是否默认选项（1-是，0-否）
     */
    private Boolean isDefault;
    
    /**
     * 备注
     */
    private String remark;
    
    /**
     * 创建时间
     */
    private LocalDateTime createTime;
    
    /**
     * 更新时间
     */
    private LocalDateTime updateTime;
}

