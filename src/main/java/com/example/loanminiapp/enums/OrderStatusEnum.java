package com.example.loanminiapp.enums;

import java.util.Arrays;

/**
 * 订单整体状态
 */
public enum OrderStatusEnum {
    PENDING_SUBMIT(0, "待提交"),
    RISK_REVIEWING(1, "签署中"),
    RISK_REJECTED(2, "风控驳回"),
    WAIT_LOAN(3, "待放款"),
    LOANING(4, "放款中"),
    WAIT_TRANSFER(5, "完成");
    // SIGNING(6, "风控审核中"),
    // WAIT_FACE(7, "待人脸识别"),
    // COMPLETED(8, "待债转");

    private final int code;
    private final String desc;

    OrderStatusEnum(int code, String desc) {
        this.code = code;
        this.desc = desc;
    }

    public int getCode() {
        return code;
    }

    public String getDesc() {
        return desc;
    }

    public static OrderStatusEnum fromCode(Integer code) {
        if (code == null) {
            return PENDING_SUBMIT;
        }
        return Arrays.stream(values())
                .filter(e -> e.code == code)
                .findFirst()
                .orElse(PENDING_SUBMIT);
    }
}

