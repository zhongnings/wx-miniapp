# 数据字典系统实现文档

## 概述

将小程序中所有下拉列表的硬编码数据改为从后端动态加载，实现数据字典统一管理。

## 数据库设计

### 表结构

#### 1. t_dict_category（数据字典分类表）

```sql
CREATE TABLE IF NOT EXISTS `t_dict_category` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
  `category_code` VARCHAR(50) UNIQUE NOT NULL COMMENT '分类编码',
  `category_name` VARCHAR(100) NOT NULL COMMENT '分类名称',
  `description` VARCHAR(255) COMMENT '分类描述',
  `sort_order` INT DEFAULT 0 COMMENT '排序顺序',
  `is_enabled` TINYINT(1) DEFAULT 1 COMMENT '是否启用',
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

#### 2. t_dict_item（数据字典项表）

```sql
CREATE TABLE IF NOT EXISTS `t_dict_item` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
  `category_code` VARCHAR(50) NOT NULL COMMENT '分类编码',
  `item_code` VARCHAR(50) COMMENT '选项编码',
  `item_value` VARCHAR(200) NOT NULL COMMENT '选项值',
  `item_label` VARCHAR(200) COMMENT '选项标签',
  `sort_order` INT DEFAULT 0 COMMENT '排序顺序',
  `is_enabled` TINYINT(1) DEFAULT 1 COMMENT '是否启用',
  `is_default` TINYINT(1) DEFAULT 0 COMMENT '是否默认选项',
  `remark` VARCHAR(500) COMMENT '备注',
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_category_code` (`category_code`)
);
```

### 字典分类列表

| 分类编码 | 分类名称 | 使用页面 |
|---------|---------|---------|
| assignee_org | 受让机构 | step1 |
| microloan_org | 小贷机构 | step1 |
| payment_channel | 支付渠道 | step1 |
| product_type | 产品类型 | step1 |
| loan_purpose | 借款用途 | step1 |
| repayment_method | 还款方式 | step1 |
| dispute_resolution | 解决争议方式 | step1 |
| arbitration_org | 仲裁机构 | step1 |
| notarization_type | 公证类型 | step1 |
| notarization_item | 公证事项 | step1 |
| marital_status | 婚姻状况 | step2/step3/step4 |
| id_type | 证件类型 | step2/step3/step4 |

## 后端实现

### 1. 实体类

- `DictCategory.java` - 字典分类实体
- `DictItem.java` - 字典项实体

### 2. Mapper

- `DictCategoryMapper.java` - 字典分类 Mapper
- `DictItemMapper.java` - 字典项 Mapper

### 3. Service

- `DictService.java` - 字典服务接口
- `DictServiceImpl.java` - 字典服务实现（包含缓存）

### 4. Controller

- `DictController.java` - 字典控制器

### 5. API 接口

#### 获取单个分类的字典项

```
GET /public/dict/items/{categoryCode}
```

响应示例：
```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "itemValue": "未婚",
      "sortOrder": 1,
      "isDefault": true
    },
    {
      "itemValue": "已婚",
      "sortOrder": 2,
      "isDefault": false
    }
  ]
}
```

#### 批量获取多个分类的字典项

```
POST /public/dict/items/batch
Content-Type: application/json

{
  "categoryCodes": ["marital_status", "id_type"]
}
```

响应示例：
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "marital_status": [
      { "itemValue": "未婚", "sortOrder": 1, "isDefault": true },
      { "itemValue": "已婚", "sortOrder": 2, "isDefault": false }
    ],
    "id_type": [
      { "itemValue": "身份证", "sortOrder": 1, "isDefault": true },
      { "itemValue": "护照", "sortOrder": 2, "isDefault": false }
    ]
  }
}
```

## 前端实现

### 1. API 封装

文件：`wx-miniapp/miniprogram/api/dict.js`

```javascript
function getDictItems(categoryCode) {
  return request.get(`/public/dict/items/${categoryCode}`);
}

function batchGetDictItems(categoryCodes) {
  return request.post('/public/dict/items/batch', {
    categoryCodes: categoryCodes
  });
}
```

### 2. 字典管理器

文件：`wx-miniapp/miniprogram/utils/dict-manager.js`

功能：
- 统一管理字典数据的加载和缓存
- 提供本地默认值作为后备方案
- 优先使用全局缓存，避免重复请求

### 3. 全局预加载

文件：`wx-miniapp/miniprogram/app.js`

在 `onLaunch` 中预加载常用字典数据：

```javascript
loadCommonDicts() {
  dictApi.batchGetDictItems([
    'assignee_org',
    'microloan_org',
    'payment_channel',
    // ... 其他常用字典
  ]).then(res => {
    this.globalData.dictData = res.data;
  });
}
```

### 4. 页面使用

#### step1 示例

```javascript
const dictManager = require('../../../../utils/dict-manager.js');

Page({
  data: {
    assigneeOrgOptions: [],
    microloanOrgOptions: []
  },
  
  onLoad() {
    this.loadDropdownOptions();
  },
  
  loadDropdownOptions() {
    const dictData = dictManager.batchGetDictOptions([
      'assignee_org',
      'microloan_org'
    ]);
    
    this.setData({
      assigneeOrgOptions: dictData.assignee_org,
      microloanOrgOptions: dictData.microloan_org
    });
  }
});
```

#### step2 示例

```javascript
const dictManager = require('../../../../utils/dict-manager.js');

Page({
  data: {
    maritalStatusOptions: []
  },
  
  onLoad() {
    this.loadDictOptions();
  },
  
  loadDictOptions() {
    const maritalStatusOptions = dictManager.getDictOptions('marital_status');
    this.setData({ maritalStatusOptions });
  },
  
  selectMaritalStatus() {
    wx.showActionSheet({
      itemList: this.data.maritalStatusOptions,
      success: (res) => {
        this.setData({
          'formData.maritalStatus': this.data.maritalStatusOptions[res.tapIndex]
        });
      }
    });
  }
});
```

## 数据加载策略

### 三级缓存机制

1. **全局缓存**（优先级最高）
   - 位置：`app.globalData.dictData`
   - 时机：应用启动时预加载常用字典
   - 优点：访问速度最快，避免重复请求

2. **后端接口**（优先级中等）
   - 时机：全局缓存未命中时
   - 优点：数据实时更新
   - 缺点：需要网络请求

3. **本地默认值**（优先级最低）
   - 位置：`dict-manager.js` 中的 `defaultDict`
   - 时机：后端接口请求失败时
   - 优点：保证离线可用性

### 加载流程

```
页面加载
  ↓
检查全局缓存
  ↓
有缓存？
  ├─ 是 → 直接使用
  └─ 否 → 调用后端接口
           ↓
         请求成功？
           ├─ 是 → 更新全局缓存 → 使用
           └─ 否 → 使用本地默认值
```

## 部署步骤

### 1. 数据库初始化

执行 SQL 文件：`docs/dict-tables-init.sql`

```bash
mysql -u root -p your_database < docs/dict-tables-init.sql
```

### 2. 后端部署

1. 确保所有 Java 文件已添加到项目中
2. 重启后端服务
3. 测试接口：
   ```bash
   curl http://localhost:8080/public/dict/items/marital_status
   ```

### 3. 前端部署

1. 确保所有 JS 文件已更新
2. 在微信开发者工具中编译
3. 测试字典加载功能

## 后续优化建议

### 1. 缓存优化

- 添加缓存过期时间
- 支持手动刷新缓存
- 添加缓存版本控制

### 2. 性能优化

- 使用 Redis 缓存字典数据
- 添加 CDN 加速
- 实现增量更新

### 3. 功能扩展

- 支持多语言（国际化）
- 支持字典项的图标配置
- 添加字典管理后台

### 4. 监控告警

- 添加字典加载失败监控
- 统计字典使用频率
- 异常情况告警

## 注意事项

1. **向后兼容**：保留本地默认值，确保后端服务异常时前端仍可用
2. **数据一致性**：确保数据库中的字典值与原硬编码值一致
3. **性能考虑**：使用缓存减少数据库查询
4. **错误处理**：妥善处理网络异常和数据异常
5. **测试覆盖**：充分测试各种场景（正常、异常、离线等）

## 测试清单

- [ ] 数据库表创建成功
- [ ] 初始数据导入成功
- [ ] 后端接口测试通过
- [ ] 前端字典加载成功
- [ ] 全局缓存机制正常
- [ ] 本地默认值后备方案正常
- [ ] 网络异常时降级处理正常
- [ ] step1 所有下拉列表正常
- [ ] step2 婚姻状况选择正常
- [ ] 数据保存和回显正常

