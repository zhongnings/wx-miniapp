package com.yixinjr.loanminiapp.enums;

import java.util.Arrays;

/**
 * 还款状态
 */
public enum RepaymentStatusEnum {
    NOT_STARTED(0, "未开始"),
    REPAYING(1, "还款中"),
    OVERDUE(2, "已逾期"),
    CLEARED(3, "已结清");

    private final int code;
    private final String desc;

    RepaymentStatusEnum(int code, String desc) {
        this.code = code;
        this.desc = desc;
    }

    public int getCode() {
        return code;
    }

    public String getDesc() {
        return desc;
    }

    public static RepaymentStatusEnum fromCode(Integer code) {
        if (code == null) {
            return NOT_STARTED;
        }
        return Arrays.stream(values())
                .filter(e -> e.code == code)
                .findFirst()
                .orElse(NOT_STARTED);
    }
}

