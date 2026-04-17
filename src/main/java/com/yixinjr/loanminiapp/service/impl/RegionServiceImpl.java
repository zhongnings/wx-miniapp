package com.yixinjr.loanminiapp.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.yixinjr.loanminiapp.entity.Region;
import com.yixinjr.loanminiapp.mapper.RegionMapper;
import com.yixinjr.loanminiapp.service.RegionService;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * 行政区划服务实现类
 */
@Service
@RequiredArgsConstructor
public class RegionServiceImpl implements RegionService {

    private final RegionMapper regionMapper;

    @Override
    @Cacheable(value = "region:provinces", unless = "#result == null || #result.isEmpty()")
    public List<Region> getProvinces() {
        return regionMapper.selectList(
            new LambdaQueryWrapper<Region>()
                .eq(Region::getLevel, 1)
                .eq(Region::getStatus, 1)
                .orderByAsc(Region::getSortOrder)
        );
    }

    @Override
    @Cacheable(value = "region:cities", key = "#provinceCode", unless = "#result == null || #result.isEmpty()")
    public List<Region> getCitiesByProvinceCode(String provinceCode) {
        return regionMapper.selectList(
            new LambdaQueryWrapper<Region>()
                .eq(Region::getParentCode, provinceCode)
                .eq(Region::getLevel, 2)
                .eq(Region::getStatus, 1)
                .orderByAsc(Region::getSortOrder)
        );
    }

    @Override
    @Cacheable(value = "region:districts", key = "#cityCode", unless = "#result == null || #result.isEmpty()")
    public List<Region> getDistrictsByCityCode(String cityCode) {
        return regionMapper.selectList(
            new LambdaQueryWrapper<Region>()
                .eq(Region::getParentCode, cityCode)
                .eq(Region::getLevel, 3)
                .eq(Region::getStatus, 1)
                .orderByAsc(Region::getSortOrder)
        );
    }

    @Override
    @Cacheable(value = "region:children", key = "#parentCode", unless = "#result == null || #result.isEmpty()")
    public List<Region> getChildrenByParentCode(String parentCode) {
        return regionMapper.selectList(
            new LambdaQueryWrapper<Region>()
                .eq(Region::getParentCode, parentCode)
                .eq(Region::getStatus, 1)
                .orderByAsc(Region::getSortOrder)
        );
    }

    @Override
    public List<Region> searchByName(String name) {
        return regionMapper.selectList(
            new LambdaQueryWrapper<Region>()
                .like(Region::getName, name)
                .eq(Region::getStatus, 1)
                .orderByAsc(Region::getLevel, Region::getSortOrder)
                .last("LIMIT 50")
        );
    }

    @Override
    @Cacheable(value = "region:pinyin", key = "#pinyinAbbr + '_' + #level", unless = "#result == null || #result.isEmpty()")
    public List<Region> searchByPinyinAbbr(String pinyinAbbr, Integer level) {
        LambdaQueryWrapper<Region> wrapper = new LambdaQueryWrapper<Region>()
            .like(Region::getPinyin, pinyinAbbr)
            .eq(Region::getStatus, 1);
        
        if (level != null) {
            wrapper.eq(Region::getLevel, level);
        }
        
        return regionMapper.selectList(wrapper.orderByAsc(Region::getSortOrder));
    }

    @Override
    @Cacheable(value = "region:code", key = "#code", unless = "#result == null")
    public Region getByCode(String code) {
        return regionMapper.selectOne(
            new LambdaQueryWrapper<Region>()
                .eq(Region::getCode, code)
                .eq(Region::getStatus, 1)
        );
    }
}

