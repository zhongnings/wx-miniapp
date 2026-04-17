package com.yixinjr.loanminiapp.service;

import com.yixinjr.loanminiapp.entity.Region;

import java.util.List;

/**
 * 行政区划服务接口
 */
public interface RegionService {
    
    /**
     * 获取省份列表
     */
    List<Region> getProvinces();
    
    /**
     * 根据省份代码获取城市列表
     */
    List<Region> getCitiesByProvinceCode(String provinceCode);
    
    /**
     * 根据城市代码获取区县列表
     */
    List<Region> getDistrictsByCityCode(String cityCode);
    
    /**
     * 根据父级代码获取子级列表
     */
    List<Region> getChildrenByParentCode(String parentCode);
    
    /**
     * 根据名称搜索
     */
    List<Region> searchByName(String name);
    
    /**
     * 根据拼音首字母搜索
     */
    List<Region> searchByPinyinAbbr(String pinyinAbbr, Integer level);
    
    /**
     * 根据代码获取地区
     */
    Region getByCode(String code);
}
