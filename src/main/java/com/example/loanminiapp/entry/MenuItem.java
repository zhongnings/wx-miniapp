package com.example.loanminiapp.entry;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class MenuItem {
    private String code;
    private String name;
    private String path;
}


