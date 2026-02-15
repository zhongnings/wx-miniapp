#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
直接从指定路径读取 JSON 并生成 SQL
"""

import json
import os

# 指定 JSON 文件路径
JSON_FILE = r'D:\workspace\Administrative-divisions-of-China\dist\pca-code.json'

def simple_pinyin(text):
    """简单的拼音转换"""
    pinyin_map = {
        '北京': 'beijing', '天津': 'tianjin', '河北': 'hebei', '山西': 'shanxi',
        '内蒙古': 'neimenggu', '辽宁': 'liaoning', '吉林': 'jilin', '黑龙江': 'heilongjiang',
        '上海': 'shanghai', '江苏': 'jiangsu', '浙江': 'zhejiang', '安徽': 'anhui',
        '福建': 'fujian', '江西': 'jiangxi', '山东': 'shandong', '河南': 'henan',
        '湖北': 'hubei', '湖南': 'hunan', '广东': 'guangdong', '广西': 'guangxi',
        '海南': 'hainan', '重庆': 'chongqing', '四川': 'sichuan', '贵州': 'guizhou',
        '云南': 'yunnan', '西藏': 'xizang', '陕西': 'shaanxi', '甘肃': 'gansu',
        '青海': 'qinghai', '宁夏': 'ningxia', '新疆': 'xinjiang', '台湾': 'taiwan',
        '香港': 'xianggang', '澳门': 'aomen'
    }
    
    clean_text = text.replace('省', '').replace('市', '').replace('自治区', '').replace('特别行政区', '').replace('壮族', '').replace('回族', '').replace('维吾尔', '')
    
    for key, value in pinyin_map.items():
        if key in clean_text:
            return value
    
    return text.lower().replace(' ', '')

def generate_sql(data):
    """生成 SQL 插入语句"""
    print("\n开始生成 SQL 语句...")
    
    sql_lines = []
    
    sql_lines.append("-- =============================================")
    sql_lines.append("-- 全国省市区三级数据")
    sql_lines.append("-- 数据来源：https://github.com/modood/Administrative-divisions-of-China")
    sql_lines.append("-- =============================================\n")
    
    sql_lines.append("-- 清空数据")
    sql_lines.append("TRUNCATE TABLE `t_region`;\n")
    
    province_count = 0
    city_count = 0
    district_count = 0
    
    # 判断数据格式（列表或字典）
    if isinstance(data, list):
        # 列表格式：[{code: "11", name: "北京市", children: [...]}]
        provinces = data
    else:
        # 字典格式：{"11": {name: "北京市", children: {...}}}
        provinces = [{"code": code, **pdata} for code, pdata in data.items()]
    
    # 遍历省份
    for province_item in provinces:
        province_code = province_item.get('code')
        province_name = province_item.get('name')
        province_pinyin = simple_pinyin(province_name)
        province_short = province_name.replace('省', '').replace('市', '').replace('自治区', '').replace('特别行政区', '').replace('壮族', '').replace('回族', '').replace('维吾尔', '')
        
        province_count += 1
        
        sql_lines.append(f"-- {province_name}")
        sql_lines.append(
            f"INSERT INTO `t_region` (`code`, `name`, `parent_code`, `level`, `pinyin`, `short_name`, `sort_order`, `status`) "
            f"VALUES ('{province_code}', '{province_name}', NULL, 1, '{province_pinyin}', '{province_short}', {province_count}, 1);"
        )
        
        # 遍历城市
        children = province_item.get('children', [])
        if isinstance(children, list):
            # 列表格式
            cities = children
        else:
            # 字典格式
            cities = [{"code": code, **cdata} for code, cdata in children.items()]
        
        for city_item in cities:
            city_code = city_item.get('code')
            city_name = city_item.get('name')
            city_pinyin = simple_pinyin(city_name)
            city_short = city_name.replace('市', '').replace('地区', '').replace('自治州', '').replace('盟', '')
            
            city_count += 1
            
            sql_lines.append(
                f"INSERT INTO `t_region` (`code`, `name`, `parent_code`, `level`, `pinyin`, `short_name`, `sort_order`, `status`) "
                f"VALUES ('{city_code}', '{city_name}', '{province_code}', 2, '{city_pinyin}', '{city_short}', {city_count}, 1);"
            )
            
            # 遍历区县
            districts_data = city_item.get('children', [])
            if isinstance(districts_data, list):
                # 列表格式
                districts = districts_data
            else:
                # 字典格式
                districts = [{"code": code, "name": dname} for code, dname in districts_data.items()]
            
            for district_item in districts:
                district_code = district_item.get('code')
                district_name = district_item.get('name')
                district_pinyin = simple_pinyin(district_name)
                district_short = district_name.replace('区', '').replace('县', '').replace('市', '')
                
                district_count += 1
                
                sql_lines.append(
                    f"INSERT INTO `t_region` (`code`, `name`, `parent_code`, `level`, `pinyin`, `short_name`, `sort_order`, `status`) "
                    f"VALUES ('{district_code}', '{district_name}', '{city_code}', 3, '{district_pinyin}', '{district_short}', {district_count}, 1);"
                )
        
        sql_lines.append("")
    
    print(f"✅ SQL 生成完成")
    print(f"   - 省级：{province_count} 条")
    print(f"   - 市级：{city_count} 条")
    print(f"   - 区县：{district_count} 条")
    print(f"   - 总计：{province_count + city_count + district_count} 条")
    
    return '\n'.join(sql_lines)

def main():
    """主函数"""
    print("=" * 60)
    print("省市区数据转换工具")
    print("=" * 60)
    
    # 检查文件
    if not os.path.exists(JSON_FILE):
        print(f"\n❌ 找不到文件：{JSON_FILE}")
        return
    
    print(f"\n正在读取文件：{JSON_FILE}")
    try:
        with open(JSON_FILE, 'r', encoding='utf-8') as f:
            data = json.load(f)
        print(f"✅ 数据加载成功，共 {len(data)} 个省级行政区")
    except Exception as e:
        print(f"❌ 读取失败：{e}")
        return
    
    # 生成 SQL
    sql_content = generate_sql(data)
    
    # 保存文件
    output_file = 'region_data_full.sql'
    try:
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(sql_content)
        print(f"\n✅ SQL 文件已保存：{output_file}")
        print(f"   文件位置：{os.path.abspath(output_file)}")
        print("\n🎉 转换完成！")
    except Exception as e:
        print(f"❌ 保存失败：{e}")

if __name__ == '__main__':
    main()

