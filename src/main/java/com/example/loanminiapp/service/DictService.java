package com.example.loanminiapp.service;

import com.example.loanminiapp.dto.DictItemDTO;

import java.util.List;
import java.util.Map;

/**
 * 数据字典服务接口
 */
public interface DictService {
    
    /**
     * 获取指定分类的字典项列表
     * @param categoryCode 分类编码
     * @return 字典项列表
     */
    List<DictItemDTO> getDictItems(String categoryCode);
    
    /**
     * 批量获取多个分类的字典项
     * @param categoryCodes 分类编码列表
     * @return Map<分类编码, 字典项列表>
     */
    Map<String, List<DictItemDTO>> batchGetDictItems(List<String> categoryCodes);
}

