package com.yixinjr.loanminiapp.enums;

/**
 * 系统角色枚举
 */
public enum RoleEnum {
    ADMIN("ADMIN", "管理员"),
    SALES("SALES", "业务员"),
    APPLICANT("APPLICANT", "申请人");

    private final String code;
    private final String desc;

    RoleEnum(String code, String desc) {
        this.code = code;
        this.desc = desc;
    }

    public String getCode() {
        return code;
    }

    public String getDesc() {
        return desc;
    }

    public static boolean isAdmin(String roleCode) {
        return ADMIN.code.equalsIgnoreCase(roleCode);
    }
}


