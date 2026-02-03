package com.example.loanminiapp.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.example.loanminiapp.entity.OrderBorrower;
import org.apache.ibatis.annotations.Mapper;

/**
 * 订单借款人信息Mapper
 */
@Mapper
public interface OrderBorrowerMapper extends BaseMapper<OrderBorrower> {
}

