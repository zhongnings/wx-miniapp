package com.yixinjr.loanminiapp.controller;

import com.yixinjr.loanminiapp.entity.Region;
import com.yixinjr.loanminiapp.service.RegionService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 行政区划接口
 */
@RestController
@RequestMapping("/public/region")
@RequiredArgsConstructor
public class RegionController {
    
    private final RegionService regionService;
    
    /**
     * 获取省份列表
     */
    @GetMapping("/provinces")
    public Map<String, Object> getProvinces() {
        List<Region> provinces = regionService.getProvinces();
        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("data", provinces);
        return result;
    }
    
    /**
     * 根据省份代码获取城市列表
     */
    @GetMapping("/cities/{provinceCode}")
    public Map<String, Object> getCities(@PathVariable String provinceCode) {
        List<Region> cities = regionService.getCitiesByProvinceCode(provinceCode);
        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("data", cities);
        return result;
    }
    
    /**
     * 根据城市代码获取区县列表
     */
    @GetMapping("/districts/{cityCode}")
    public Map<String, Object> getDistricts(@PathVariable String cityCode) {
        List<Region> districts = regionService.getDistrictsByCityCode(cityCode);
        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("data", districts);
        return result;
    }
    
    /**
     * 搜索地区
     */
    @GetMapping("/search")
    public Map<String, Object> search(@RequestParam String keyword) {
        List<Region> results = regionService.searchByName(keyword);
        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("data", results);
        return result;
    }
}
