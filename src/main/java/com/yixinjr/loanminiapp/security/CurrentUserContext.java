package com.yixinjr.loanminiapp.security;

public class CurrentUserContext {
    private static final ThreadLocal<CurrentUser> CONTEXT = new ThreadLocal<>();

    public static void set(CurrentUser user) {
        CONTEXT.set(user);
    }

    public static CurrentUser get() {
        return CONTEXT.get();
    }

    public static void clear() {
        CONTEXT.remove();
    }
}



