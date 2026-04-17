package com.yixinjr.loanminiapp.enums;

import lombok.Getter;

/**
 * 收款方类型枚举
 */
@Getter
public enum PayeeTypeEnum {
    
    BORROWER("borrower", "主借人", 1),
    CO_BORROWER("coBorrower", "共借人", 2),
    GUARANTOR("guarantor", "担保人", 3);
    
    /**
     * 类型代码
     */
    private final String code;
    
    /**
     * 类型名称
     */
    private final String name;
    
    /**
     * 优先级（数字越小优先级越高）
     */
    private final Integer priority;
    
    PayeeTypeEnum(String code, String name, Integer priority) {
        this.code = code;
        this.name = name;
        this.priority = priority;
    }
    
    /**
     * 根据代码获取枚举
     */
    public static PayeeTypeEnum getByCode(String code) {
        if (code == null) {
            return null;
        }
        for (PayeeTypeEnum type : values()) {
            if (type.getCode().equals(code)) {
                return type;
            }
        }
        return null;
    }
    
    /**
     * 根据代码获取名称
     */
    public static String getNameByCode(String code) {
        PayeeTypeEnum type = getByCode(code);
        return type != null ? type.getName() : "";
    }
    
    /**
     * 根据代码获取优先级
     */
    public static Integer getPriorityByCode(String code) {
        PayeeTypeEnum type = getByCode(code);
        return type != null ? type.getPriority() : 999;
    }
}

