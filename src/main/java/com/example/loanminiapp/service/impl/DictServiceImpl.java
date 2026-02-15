package com.example.loanminiapp.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.example.loanminiapp.dto.DictItemDTO;
import com.example.loanminiapp.entity.DictItem;
import com.example.loanminiapp.mapper.DictItemMapper;
import com.example.loanminiapp.service.DictService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.BeanUtils;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import javax.annotation.Resource;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 数据字典服务实现
 */
@Slf4j
@Service
public class DictServiceImpl implements DictService {
    
    @Resource
    private DictItemMapper dictItemMapper;
    
    /**
     * 获取指定分类的字典项列表
     * 使用缓存，缓存名称为 dictItems，key 为分类编码
     */
    @Override
    @Cacheable(value = "dictItems", key = "#categoryCode", unless = "#result == null || #result.isEmpty()")
    public List<DictItemDTO> getDictItems(String categoryCode) {
        log.info("[字典服务] 查询字典项，分类编码: {}", categoryCode);
        
        // 查询启用的字典项，按排序顺序排列
        LambdaQueryWrapper<DictItem> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(DictItem::getCategoryCode, categoryCode)
               .eq(DictItem::getIsEnabled, true)
               .orderByAsc(DictItem::getSortOrder);
        
        List<DictItem> items = dictItemMapper.selectList(wrapper);
        
        // 转换为 DTO
        List<DictItemDTO> dtoList = items.stream().map(item -> {
            DictItemDTO dto = new DictItemDTO();
            BeanUtils.copyProperties(item, dto);
            return dto;
        }).collect(Collectors.toList());
        
        log.info("[字典服务] 查询完成，分类编码: {}, 数量: {}", categoryCode, dtoList.size());
        return dtoList;
    }
    
    /**
     * 批量获取多个分类的字典项
     */
    @Override
    public Map<String, List<DictItemDTO>> batchGetDictItems(List<String> categoryCodes) {
        log.info("[字典服务] 批量查询字典项，分类数量: {}", categoryCodes.size());
        
        Map<String, List<DictItemDTO>> result = new HashMap<>();
        
        for (String categoryCode : categoryCodes) {
            List<DictItemDTO> items = getDictItems(categoryCode);
            result.put(categoryCode, items);
        }
        
        log.info("[字典服务] 批量查询完成，分类数量: {}", result.size());
        return result;
    }
}

