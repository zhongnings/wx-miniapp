# 省市区数据转换工具

## 📦 功能说明

自动从 GitHub 下载省市区三级联动数据，并转换为可执行的 SQL 插入语句。

## 🚀 使用方法

### 方法1：自动下载转换（推荐）

```bash
# 1. 安装依赖
pip install requests pypinyin

# 2. 运行脚本
cd d:\workcode\miniapp\scripts
python convert_region_data.py

# 3. 生成文件
# 会在当前目录生成 region_data_full.sql（约3000+条数据）
```

### 方法2：手动下载后转换

如果网络问题无法自动下载，可以手动操作：

```bash
# 1. 手动下载 JSON 文件
# 访问：https://github.com/modood/Administrative-divisions-of-China/blob/master/dist/pcas-code.json
# 下载后保存为 pcas-code.json，放到 scripts 目录

# 2. 运行脚本（会自动检测本地文件）
python convert_region_data.py
```

## 📊 数据说明

### 数据来源
- **GitHub 仓库：** https://github.com/modood/Administrative-divisions-of-China
- **数据格式：** JSON（带行政区划代码）
- **数据量：** 约3000+条（34省 + 300+市 + 2800+区县）

### 数据结构
```json
{
  "110000": {
    "name": "北京市",
    "children": {
      "110100": {
        "name": "市辖区",
        "children": {
          "110101": "东城区",
          "110102": "西城区"
        }
      }
    }
  }
}
```

### 生成的 SQL 格式
```sql
INSERT INTO `region` (`code`, `name`, `parent_code`, `level`, `pinyin`, `short_name`, `sort_order`, `status`) 
VALUES ('110000', '北京市', NULL, 1, 'beijingshi', '北京', 1, 1);

INSERT INTO `region` (`code`, `name`, `parent_code`, `level`, `pinyin`, `short_name`, `sort_order`, `status`) 
VALUES ('110100', '市辖区', '110000', 2, 'shixiaqu', '市辖区', 1, 1);

INSERT INTO `region` (`code`, `name`, `parent_code`, `level`, `pinyin`, `short_name`, `sort_order`, `status`) 
VALUES ('110101', '东城区', '110100', 3, 'dongchengqu', '东城', 1, 1);
```

## 🔧 脚本功能

1. ✅ 自动下载最新数据
2. ✅ 自动生成拼音（使用 pypinyin）
3. ✅ 自动生成简称（去除"省"、"市"等后缀）
4. ✅ 自动排序（按层级和顺序）
5. ✅ 生成完整的 INSERT 语句
6. ✅ 统计数据条数

## 📝 执行步骤

### 1. 运行脚本
```bash
python convert_region_data.py
```

### 2. 查看输出
```
============================================================
省市区数据转换工具
============================================================
正在下载省市区数据...
✅ 数据下载成功，共 34 个省级行政区

开始生成 SQL 语句...
✅ SQL 生成完成
   - 省级：34 条
   - 市级：333 条
   - 区县：2851 条
   - 总计：3218 条

✅ SQL 文件已保存：region_data_full.sql

🎉 转换完成！
下一步：
1. 检查生成的 region_data_full.sql 文件
2. 在数据库中执行该 SQL 文件
3. 验证数据是否正确导入
```

### 3. 导入数据库
```bash
# 方法1：使用 MySQL 命令行
mysql -u root -p loan_miniapp < region_data_full.sql

# 方法2：使用 Navicat/DBeaver 等工具
# 打开 region_data_full.sql，点击执行

# 方法3：使用 Spring Boot
# 将 region_data_full.sql 放到 src/main/resources/db/ 目录
# 在 application.yml 中配置自动执行
```

### 4. 验证数据
```sql
-- 查看总数
SELECT COUNT(*) FROM region;

-- 查看省份数量
SELECT COUNT(*) FROM region WHERE level = 1;

-- 查看城市数量
SELECT COUNT(*) FROM region WHERE level = 2;

-- 查看区县数量
SELECT COUNT(*) FROM region WHERE level = 3;

-- 查看某个省的城市
SELECT * FROM region WHERE parent_code = '440000' AND level = 2;
```

## ⚠️ 注意事项

1. **依赖安装：** 必须安装 `requests` 和 `pypinyin`
2. **网络问题：** 如果无法访问 GitHub，使用方法2手动下载
3. **编码问题：** 确保数据库字符集为 `utf8mb4`
4. **数据清空：** 脚本会先执行 `TRUNCATE TABLE region`，注意备份
5. **执行时间：** 3000+条数据，执行约需 5-10 秒

## 🐛 常见问题

### Q1: 提示 "No module named 'requests'"
```bash
pip install requests pypinyin
```

### Q2: 下载超时
```bash
# 使用国内镜像
pip install requests pypinyin -i https://pypi.tuna.tsinghua.edu.cn/simple

# 或手动下载 JSON 文件
```

### Q3: 拼音生成错误
```bash
# 确保 pypinyin 版本正确
pip install --upgrade pypinyin
```

### Q4: SQL 执行报错
```sql
-- 检查表是否存在
SHOW TABLES LIKE 'region';

-- 检查表结构
DESC region;

-- 检查字符集
SHOW CREATE TABLE region;
```

## 📚 相关资源

- **GitHub 数据源：** https://github.com/modood/Administrative-divisions-of-China
- **国家统计局：** http://www.stats.gov.cn/sj/tjbz/tjyqhdmhcxhfdm/
- **pypinyin 文档：** https://github.com/mozillazg/python-pinyin


