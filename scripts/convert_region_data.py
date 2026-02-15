#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
省市区数据转换脚本
从 GitHub 开源数据转换为 SQL 插入语句

数据来源：https://github.com/modood/Administrative-divisions-of-China
使用方法：
1. 安装依赖：pip install requests pypinyin
2. 运行脚本：python convert_region_data.py
3. 生成文件：region_data_full.sql
"""

import json
import requests
from pypinyin import lazy_pinyin

def get_pinyin(text):
    """获取拼音（小写，无空格）"""
    return ''.join(lazy_pinyin(text))

def download_data():
    """从 GitHub 下载省市区数据"""
    print("正在下载省市区数据...")
    
    # 使用带代码的完整数据
    url = "https://raw.githubusercontent.com/modood/Administrative-divisions-of-China/master/dist/pcas-code.json"
    
    try:
        response = requests.get(url, timeout=30)
        response.raise_for_status()
        data = response.json()
        print(f"✅ 数据下载成功，共 {len(data)} 个省级行政区")
        return data
    except Exception as e:
        print(f"❌ 下载失败：{e}")
        print("提示：如果网络问题，可以手动下载 JSON 文件放到同目录下")
        return None

def load_local_data():
    """从本地加载数据（备用方案）"""
    try:
        with open('pcas-code.json', 'r', encoding='utf-8') as f:
            data = json.load(f)
            print(f"✅ 从本地加载数据成功，共 {len(data)} 个省级行政区")
            return data
    except FileNotFoundError:
        print("❌ 本地文件不存在")
        return None

def generate_sql(data):
    """生成 SQL 插入语句"""
    print("\n开始生成 SQL 语句...")
    
    sql_lines = []
    
    # SQL 文件头部
    sql_lines.append("-- =============================================")
    sql_lines.append("-- 全国省市区三级数据")
    sql_lines.append("-- 数据来源：https://github.com/modood/Administrative-divisions-of-China")
    sql_lines.append("-- 生成时间：自动生成")
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
        province_pinyin = get_pinyin(province_name)
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
                city_pinyin = get_pinyin(city_name)
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
                        district_pinyin = get_pinyin(district_name)
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

def save_sql(sql_content, filename='region_data_full.sql'):
    """保存 SQL 文件"""
    try:
        with open(filename, 'w', encoding='utf-8') as f:
            f.write(sql_content)
        print(f"\n✅ SQL 文件已保存：{filename}")
        return True
    except Exception as e:
        print(f"❌ 保存失败：{e}")
        return False

def main():
    """主函数"""
    print("=" * 60)
    print("省市区数据转换工具")
    print("=" * 60)
    
    # 1. 下载或加载数据
    data = download_data()
    if not data:
        print("\n尝试从本地加载数据...")
        data = load_local_data()
    
    if not data:
        print("\n❌ 无法获取数据，请检查网络或手动下载 JSON 文件")
        print("下载地址：https://github.com/modood/Administrative-divisions-of-China/blob/master/dist/pcas-code.json")
        return
    
    # 2. 生成 SQL
    sql_content = generate_sql(data)
    
    # 3. 保存文件
    if save_sql(sql_content):
        print("\n🎉 转换完成！")
        print("下一步：")
        print("1. 检查生成的 region_data_full.sql 文件")
        print("2. 在数据库中执行该 SQL 文件")
        print("3. 验证数据是否正确导入")
    else:
        print("\n❌ 转换失败")

if __name__ == '__main__':
    main()


