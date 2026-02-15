#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
省市区数据转换脚本（简化版，无需额外依赖）
使用方法：
1. 手动下载 JSON 文件：https://raw.githubusercontent.com/modood/Administrative-divisions-of-China/master/dist/pcas-code.json
2. 保存为 pcas-code.json，放到同目录
3. 运行：python convert_region_simple.py
"""

import json
import os

def simple_pinyin(text):
    """简单的拼音转换（使用预定义映射）"""
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
    
    # 去除后缀
    clean_text = text.replace('省', '').replace('市', '').replace('自治区', '').replace('特别行政区', '').replace('壮族', '').replace('回族', '').replace('维吾尔', '')
    
    # 查找映射
    for key, value in pinyin_map.items():
        if key in clean_text:
            return value
    
    # 默认返回小写
    return text.lower().replace(' ', '')

def generate_sql(data):
    """生成 SQL 插入语句"""
    print("\n开始生成 SQL 语句...")
    
    sql_lines = []
    
    # SQL 文件头部
    sql_lines.append("-- =============================================")
    sql_lines.append("-- 全国省市区三级数据")
    sql_lines.append("-- 数据来源：https://github.com/modood/Administrative-divisions-of-China")
    sql_lines.append("-- =============================================\n")
    
    # 清空表
    sql_lines.append("-- 清空数据")
    sql_lines.append("TRUNCATE TABLE `region`;\n")
    
    province_count = 0
    city_count = 0
    district_count = 0
    
    # 遍历省份
    for province_code, province_data in data.items():
        province_name = province_data['name']
        province_pinyin = simple_pinyin(province_name)
        province_short = province_name.replace('省', '').replace('市', '').replace('自治区', '').replace('特别行政区', '').replace('壮族', '').replace('回族', '').replace('维吾尔', '')
        
        province_count += 1
        
        # 插入省份
        sql_lines.append(f"-- {province_name}")
        sql_lines.append(
            f"INSERT INTO `region` (`code`, `name`, `parent_code`, `level`, `pinyin`, `short_name`, `sort_order`, `status`) "
            f"VALUES ('{province_code}', '{province_name}', NULL, 1, '{province_pinyin}', '{province_short}', {province_count}, 1);"
        )
        
        # 遍历城市
        if 'children' in province_data and province_data['children']:
            for city_code, city_data in province_data['children'].items():
                city_name = city_data['name']
                city_pinyin = simple_pinyin(city_name)
                city_short = city_name.replace('市', '').replace('地区', '').replace('自治州', '').replace('盟', '')
                
                city_count += 1
                
                # 插入城市
                sql_lines.append(
                    f"INSERT INTO `region` (`code`, `name`, `parent_code`, `level`, `pinyin`, `short_name`, `sort_order`, `status`) "
                    f"VALUES ('{city_code}', '{city_name}', '{province_code}', 2, '{city_pinyin}', '{city_short}', {city_count}, 1);"
                )
                
                # 遍历区县
                if 'children' in city_data and city_data['children']:
                    for district_code, district_name in city_data['children'].items():
                        district_pinyin = simple_pinyin(district_name)
                        district_short = district_name.replace('区', '').replace('县', '').replace('市', '')
                        
                        district_count += 1
                        
                        # 插入区县
                        sql_lines.append(
                            f"INSERT INTO `region` (`code`, `name`, `parent_code`, `level`, `pinyin`, `short_name`, `sort_order`, `status`) "
                            f"VALUES ('{district_code}', '{district_name}', '{city_code}', 3, '{district_pinyin}', '{district_short}', {district_count}, 1);"
                        )
        
        sql_lines.append("")  # 空行分隔
    
    print(f"✅ SQL 生成完成")
    print(f"   - 省级：{province_count} 条")
    print(f"   - 市级：{city_count} 条")
    print(f"   - 区县：{district_count} 条")
    print(f"   - 总计：{province_count + city_count + district_count} 条")
    
    return '\n'.join(sql_lines)

def main():
    """主函数"""
    print("=" * 60)
    print("省市区数据转换工具（简化版）")
    print("=" * 60)
    
    # 检查 JSON 文件是否存在
    json_file = 'pcas-code.json'
    if not os.path.exists(json_file):
        print(f"\n❌ 找不到文件：{json_file}")
        print("\n请按以下步骤操作：")
        print("1. 访问：https://raw.githubusercontent.com/modood/Administrative-divisions-of-China/master/dist/pcas-code.json")
        print("2. 右键 → 另存为 → 保存为 pcas-code.json")
        print(f"3. 将文件放到当前目录：{os.getcwd()}")
        print("4. 重新运行此脚本")
        return
    
    # 读取 JSON 数据
    print(f"\n正在读取文件：{json_file}")
    try:
        with open(json_file, 'r', encoding='utf-8') as f:
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
        print("\n下一步：")
        print("1. 检查生成的 region_data_full.sql 文件")
        print("2. 在数据库中执行该 SQL 文件")
        print("3. 验证数据是否正确导入")
    except Exception as e:
        print(f"❌ 保存失败：{e}")

if __name__ == '__main__':
    main()


