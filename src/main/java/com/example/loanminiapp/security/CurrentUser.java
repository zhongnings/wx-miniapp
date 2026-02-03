package com.example.loanminiapp.security;

import lombok.Data;

import java.util.Collections;
import java.util.List;

@Data
public class CurrentUser {
    private Long userId;
    private String token;
    private List<String> roles = Collections.emptyList();
    private List<String> permissions = Collections.emptyList();
}



