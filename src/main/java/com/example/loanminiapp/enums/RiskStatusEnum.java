package com.example.loanminiapp.enums;

import java.util.Arrays;

/**
 * 风控状态
 */
public enum RiskStatusEnum {
    PENDING(0, "待提交"),
    REVIEWING(1, "审核中"),
    REJECTED(2, "驳回"),
    APPROVED(3, "通过");

    private final int code;
    private final String desc;

    RiskStatusEnum(int code, String desc) {
        this.code = code;
        this.desc = desc;
    }

    public int getCode() {
        return code;
    }

    public String getDesc() {
        return desc;
    }

    public static RiskStatusEnum fromCode(Integer code) {
        if (code == null) {
            return PENDING;
        }
        return Arrays.stream(values())
                .filter(e -> e.code == code)
                .findFirst()
                .orElse(PENDING);
    }
}

