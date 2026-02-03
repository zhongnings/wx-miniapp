package com.example.loanminiapp.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.example.loanminiapp.entity.OrderContract;
import org.apache.ibatis.annotations.Mapper;

/**
 * 订单合同Mapper
 */
@Mapper
public interface OrderContractMapper extends BaseMapper<OrderContract> {
}

