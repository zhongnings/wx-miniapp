package com.example.loanminiapp.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.example.loanminiapp.entity.Order;
import org.apache.ibatis.annotations.Mapper;

/**
 * 订单Mapper
 */
@Mapper
public interface OrderMapper extends BaseMapper<Order> {
}

