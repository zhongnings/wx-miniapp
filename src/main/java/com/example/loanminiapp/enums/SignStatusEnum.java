package com.example.loanminiapp.enums;

import java.util.Arrays;

/**
 * 签署状态
 */
public enum SignStatusEnum {
    NOT_STARTED(0, "未开始"),
    SIGNING(1, "签署中"),
    SIGNED(2, "已签署"),
    FAILED(3, "签署失败"),
    WAIT_FACE(4, "待人脸识别");

    private final int code;
    private final String desc;

    SignStatusEnum(int code, String desc) {
        this.code = code;
        this.desc = desc;
    }

    public int getCode() {
        return code;
    }

    public String getDesc() {
        return desc;
    }

    public static SignStatusEnum fromCode(Integer code) {
        if (code == null) {
            return NOT_STARTED;
        }
        return Arrays.stream(values())
                .filter(e -> e.code == code)
                .findFirst()
                .orElse(NOT_STARTED);
    }
}

