package com.example.loanminiapp.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.example.loanminiapp.entity.Region;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * 行政区划Mapper
 */
@Mapper
public interface RegionMapper extends BaseMapper<Region> {

    /**
     * 根据层级查询区划列表
     */
    List<Region> selectByLevel(@Param("level") Integer level);

    /**
     * 根据父级代码查询子级区划列表
     */
    List<Region> selectByParentCode(@Param("parentCode") String parentCode);

    /**
     * 根据名称模糊查询
     */
    List<Region> selectByNameLike(@Param("name") String name);

    /**
     * 根据拼音首字母查询
     */
    List<Region> selectByPinyinAbbr(@Param("pinyinAbbr") String pinyinAbbr, @Param("level") Integer level);
}

