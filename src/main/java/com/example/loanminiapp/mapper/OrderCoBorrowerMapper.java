package com.example.loanminiapp.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.example.loanminiapp.entity.OrderCoBorrower;
import org.apache.ibatis.annotations.Mapper;

/**
 * 订单共借人信息Mapper
 */
@Mapper
public interface OrderCoBorrowerMapper extends BaseMapper<OrderCoBorrower> {
}

