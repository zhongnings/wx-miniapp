package com.yixinjr.loanminiapp.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PageResult<T> {
    private List<T> data;
    private Long total;
    private Integer page;
    private Integer size;
    private Integer totalPages;
}

