package com.example.loanminiapp.enums;

import lombok.Getter;

import java.util.Arrays;

/**
 * 订单整体状态
 */
@Getter
public enum OrderStatusEnum {
    PENDING_SUBMIT(0, "待提交"),
    SIGNING(1, "签署中"),
    RISK_REJECTED(2, "风控驳回"),
    WAIT_LOAN(3, "待放款"),
    LOANING(4, "放款中"),
    COMPLETED(5, "完成"),
    WAIT_TRANSFER(0, "待债转"),
    RISK_REVIEWING(0, "风控审核中"),
    WAIT_FACE(0, "待人脸识别");

    private final int code;
    private final String desc;

    OrderStatusEnum(int code, String desc) {
        this.code = code;
        this.desc = desc;
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

