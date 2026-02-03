package com.example.loanminiapp.entry;

import lombok.Data;

import java.util.List;

@Data
public class LoginResponse {
    private String token;
    private Long userId;
    private Object roles;
    private Object permissions;
    private List<MenuItem> menus;
}


