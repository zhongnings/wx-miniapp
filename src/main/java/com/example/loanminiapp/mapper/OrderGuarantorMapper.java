package com.example.loanminiapp.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.example.loanminiapp.entity.OrderGuarantor;
import org.apache.ibatis.annotations.Mapper;

/**
 * 订单担保人信息Mapper
 */
@Mapper
public interface OrderGuarantorMapper extends BaseMapper<OrderGuarantor> {
}

