package com.example.loanminiapp.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.example.loanminiapp.entity.DictItem;
import org.apache.ibatis.annotations.Mapper;

/**
 * 数据字典项 Mapper
 */
@Mapper
public interface DictItemMapper extends BaseMapper<DictItem> {
}

