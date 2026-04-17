package com.yixinjr.loanminiapp.controller;

import com.yixinjr.loanminiapp.dto.DictItemDTO;
import com.yixinjr.loanminiapp.service.DictService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import javax.annotation.Resource;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 数据字典控制器
 */
@Slf4j
@RestController
@RequestMapping("/public/dict")
public class DictController {
    
    @Resource
    private DictService dictService;
    
    /**
     * 获取指定分类的字典项列表
     */
    @GetMapping("/items/{categoryCode}")
    public Map<String, Object> getDictItems(@PathVariable String categoryCode) {
        log.info("[字典接口] 获取字典项，分类编码: {}", categoryCode);
        
        List<DictItemDTO> items = dictService.getDictItems(categoryCode);
        
        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("data", items);
        
        return result;
    }
    
    /**
     * 批量获取多个分类的字典项
     */
    @PostMapping("/items/batch")
    public Map<String, Object> batchGetDictItems(@RequestBody Map<String, List<String>> request) {
        List<String> categoryCodes = request.get("categoryCodes");
        
        log.info("[字典接口] 批量获取字典项，分类数量: {}", categoryCodes.size());
        
        Map<String, List<DictItemDTO>> data = dictService.batchGetDictItems(categoryCodes);
        
        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("data", data);
        
        return result;
    }
}

