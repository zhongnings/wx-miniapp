# 行政区划数据方案设计文档

## 一、方案概述

本文档提供了完整的行政区划数据管理方案，支持从硬编码数据平滑迁移到数据库驱动。

## 二、数据库设计

### 表结构
```sql
CREATE TABLE `t_region` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `code` VARCHAR(12) NOT NULL COMMENT '行政区划代码',
  `name` VARCHAR(100) NOT NULL COMMENT '区划名称',
  `full_name` VARCHAR(200) DEFAULT NULL COMMENT '全称',
  `pinyin` VARCHAR(200) DEFAULT NULL COMMENT '拼音',
  `pinyin_abbr` VARCHAR(50) DEFAULT NULL COMMENT '拼音首字母缩写',
  `level` TINYINT NOT NULL COMMENT '层级：1-省级，2-市级，3-区县级',
  `parent_code` VARCHAR(12) DEFAULT NULL COMMENT '父级区划代码',
  `sort_order` INT DEFAULT 0 COMMENT '排序',
  `is_enabled` TINYINT DEFAULT 1 COMMENT '是否启用',
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_code` (`code`),
  KEY `idx_parent_code` (`parent_code`),
  KEY `idx_level` (`level`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

## 三、后端API接口

### 1. 获取省级区划
```
GET /public/region/provinces
```

### 2. 获取城市列表
```
GET /public/region/cities/{provinceCode}
```

### 3. 获取区县列表
```
GET /public/region/districts/{cityCode}
```

### 4. 搜索区划
```
GET /public/region/search?keyword={keyword}
```

## 四、前端组件改造

### region-picker.js 配置项

```javascript
Component({
  properties: {
    // 数据源模式：'local' 本地数据，'api' 接口数据
    dataSource: {
      type: String,
      value: 'local' // 默认使用本地数据，保持向后兼容
    },
    // API基础路径
    apiBaseUrl: {
      type: String,
      value: '/public/region'
    }
  }
})
```

### 使用方式

#### 方式一：使用本地数据（当前方式，无需改动）
```xml
<region-picker 
  show="{{showRegionPicker}}" 
  title="选择签约地"
  current-value="{{formData.signPlace}}"
  bind:close="onRegionPickerClose"
  bind:confirm="onRegionPickerConfirm"
/>
```

#### 方式二：使用API数据（推荐）
```xml
<region-picker 
  show="{{showRegionPicker}}" 
  title="选择签约地"
  current-value="{{formData.signPlace}}"
  data-source="api"
  api-base-url="/public/region"
  bind:close="onRegionPickerClose"
  bind:confirm="onRegionPickerConfirm"
/>
```

## 五、数据导入方案

### 方案A：使用开源数据（推荐）

#### 1. GitHub开源项目
- **modood/Administrative-divisions-of-China**
  - 地址：https://github.com/modood/Administrative-divisions-of-China
  - 特点：数据最全，包含省市区三级，带拼音
  - 格式：JSON、SQL、CSV多种格式

- **mumuy/data_location**
  - 地址：https://github.com/mumuy/data_location
  - 特点：轻量级，数据精简
  - 格式：JSON

#### 2. 民政部官方数据
- 地址：http://www.mca.gov.cn/article/sj/xzqh/
- 特点：权威、准确、定期更新
- 需要：手动整理转换

### 方案B：自建数据

使用提供的SQL脚本手动录入或批量导入。

## 六、迁移步骤

### 阶段一：准备阶段（当前）
1. ✅ 创建数据库表
2. ✅ 创建后端实体类和接口
3. ✅ 保持前端使用本地数据

### 阶段二：数据导入
1. 选择数据源（推荐使用开源数据）
2. 导入数据到 t_region 表
3. 验证数据完整性

### 阶段三：接口测试
1. 测试后端API接口
2. 验证数据返回格式
3. 性能测试和优化

### 阶段四：前端切换
1. 修改 region-picker 组件支持API模式
2. 在测试环境切换到API模式
3. 验证功能正常

### 阶段五：生产部署
1. 部署后端接口
2. 部署前端代码
3. 监控运行状态

## 七、性能优化建议

### 1. 缓存策略
- 使用 Spring Cache 缓存省市区数据
- 缓存过期时间：24小时
- 支持手动刷新缓存

### 2. 数据预加载
- 小程序启动时预加载省级数据
- 用户选择省份后加载市级数据
- 按需加载区县数据

### 3. CDN加速
- 将静态地区数据发布到CDN
- 减少服务器压力

## 八、数据更新维护

### 1. 定期更新
- 每年检查民政部最新数据
- 更新变更的行政区划

### 2. 版本管理
- 记录每次数据更新的版本号
- 保留历史数据便于追溯

### 3. 监控告警
- 监控API调用失败率
- 数据异常告警

## 九、完整数据获取方式

### 推荐：使用 modood/Administrative-divisions-of-China

```bash
# 1. 克隆仓库
git clone https://github.com/modood/Administrative-divisions-of-China.git

# 2. 使用SQL文件
# 文件位置：dist/data.sql
# 直接导入到数据库即可

# 3. 或使用JSON文件自行转换
# 文件位置：dist/pca-code.json
```

### 数据格式示例
```json
{
  "110000": {
    "code": "110000",
    "name": "北京市",
    "children": {
      "110100": {
        "code": "110100",
        "name": "市辖区",
        "children": {
          "110101": {
            "code": "110101",
            "name": "东城区"
          }
        }
      }
    }
  }
}
```

## 十、联系与支持

如有问题，请参考：
1. 数据库设计：`docs/region_table_design.sql`
2. 后端代码：`src/main/java/com/example/loanminiapp/`
3. 前端组件：`wx-miniapp/miniprogram/components/region-picker/`

