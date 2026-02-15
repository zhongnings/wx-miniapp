package com.example.loanminiapp.dto;

import lombok.Data;

/**
 * 数据字典项 DTO
 */
@Data
public class DictItemDTO {
    
    /**
     * 选项值（显示给用户的文本）
     */
    private String itemValue;
    
    /**
     * 排序顺序
     */
    private Integer sortOrder;
    
    /**
     * 是否默认选项
     */
    private Boolean isDefault;
    
    /**
     * 选项编码（可选）
     */
    private String itemCode;
}

