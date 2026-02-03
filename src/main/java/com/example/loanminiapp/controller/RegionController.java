package com.example.loanminiapp.controller;

import com.example.loanminiapp.entity.Region;
import com.example.loanminiapp.service.RegionService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 行政区划控制器
 */
@RestController
@RequestMapping("/public/region")
@RequiredArgsConstructor
public class RegionController {

    private final RegionService regionService;

    /**
     * 获取所有省级区划
     */
    @GetMapping("/provinces")
    public Map<String, Object> getProvinces() {
        List<Region> provinces = regionService.getProvinces();
        Map<String, Object> result = new HashMap<>();
        result.put("code", 200);
        result.put("message", "success");
        result.put("data", provinces);
        return result;
    }

    /**
     * 根据省级代码获取城市列表
     */
    @GetMapping("/cities/{provinceCode}")
    public Map<String, Object> getCities(@PathVariable String provinceCode) {
        List<Region> cities = regionService.getCitiesByProvinceCode(provinceCode);
        Map<String, Object> result = new HashMap<>();
        result.put("code", 200);
        result.put("message", "success");
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
        result.put("code", 200);
        result.put("message", "success");
        result.put("data", districts);
        return result;
    }

    /**
     * 根据父级代码获取子级区划
     */
    @GetMapping("/children/{parentCode}")
    public Map<String, Object> getChildren(@PathVariable String parentCode) {
        List<Region> children = regionService.getChildrenByParentCode(parentCode);
        Map<String, Object> result = new HashMap<>();
        result.put("code", 200);
        result.put("message", "success");
        result.put("data", children);
        return result;
    }

    /**
     * 搜索区划（支持名称模糊搜索）
     */
    @GetMapping("/search")
    public Map<String, Object> search(@RequestParam String keyword) {
        List<Region> regions = regionService.searchByName(keyword);
        Map<String, Object> result = new HashMap<>();
        result.put("code", 200);
        result.put("message", "success");
        result.put("data", regions);
        return result;
    }

    /**
     * 根据拼音首字母搜索（用于省份首字母索引）
     */
    @GetMapping("/pinyin/{pinyinAbbr}")
    public Map<String, Object> searchByPinyin(
            @PathVariable String pinyinAbbr,
            @RequestParam(required = false) Integer level) {
        List<Region> regions = regionService.searchByPinyinAbbr(pinyinAbbr, level);
        Map<String, Object> result = new HashMap<>();
        result.put("code", 200);
        result.put("message", "success");
        result.put("data", regions);
        return result;
    }

    /**
     * 根据代码获取区划详情
     */
    @GetMapping("/detail/{code}")
    public Map<String, Object> getDetail(@PathVariable String code) {
        Region region = regionService.getByCode(code);
        Map<String, Object> result = new HashMap<>();
        result.put("code", 200);
        result.put("message", "success");
        result.put("data", region);
        return result;
    }
}

