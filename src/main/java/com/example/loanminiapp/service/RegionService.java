package com.example.loanminiapp.service;

import com.example.loanminiapp.entity.Region;

import java.util.List;

/**
 * 行政区划服务接口
 */
public interface RegionService {

    /**
     * 获取所有省级区划
     */
    List<Region> getProvinces();

    /**
     * 根据省级代码获取城市列表
     */
    List<Region> getCitiesByProvinceCode(String provinceCode);

    /**
     * 根据城市代码获取区县列表
     */
    List<Region> getDistrictsByCityCode(String cityCode);

    /**
     * 根据父级代码获取子级区划
     */
    List<Region> getChildrenByParentCode(String parentCode);

    /**
     * 根据名称搜索区划
     */
    List<Region> searchByName(String name);

    /**
     * 根据拼音首字母搜索（用于省份首字母索引）
     */
    List<Region> searchByPinyinAbbr(String pinyinAbbr, Integer level);

    /**
     * 根据代码获取区划详情
     */
    Region getByCode(String code);
}

