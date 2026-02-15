# 数据字典表设计说明

## 概述

将小程序中所有下拉列表的选项数据从前端硬编码改为从后端数据库动态获取，便于后期维护和扩展。

## 表结构设计

### 1. dict_category（数据字典分类表）

存储所有下拉列表的分类信息。

| 字段名 | 类型 | 说明 |
|--------|------|------|
| id | BIGINT | 主键ID |
| category_code | VARCHAR(50) | 分类编码（唯一标识，如 'marital_status'） |
| category_name | VARCHAR(100) | 分类名称（如 '婚姻状况'） |
| description | VARCHAR(255) | 分类描述 |
| sort_order | INT | 排序顺序 |
| is_enabled | TINYINT(1) | 是否启用（1-启用，0-禁用） |
| create_time | DATETIME | 创建时间 |
| update_time | DATETIME | 更新时间 |

### 2. dict_item（数据字典项表）

存储每个分类下的具体选项。

| 字段名 | 类型 | 说明 |
|--------|------|------|
| id | BIGINT | 主键ID |
| category_code | VARCHAR(50) | 分类编码（关联 dict_category） |
| item_code | VARCHAR(50) | 选项编码（可选） |
| item_value | VARCHAR(200) | 选项值（显示给用户的文本） |
| item_label | VARCHAR(200) | 选项标签（可选，用于国际化） |
| sort_order | INT | 排序顺序 |
| is_enabled | TINYINT(1) | 是否启用（1-启用，0-禁用） |
| is_default | TINYINT(1) | 是否默认选项（1-是，0-否） |
| remark | VARCHAR(255) | 备注 |
| create_time | DATETIME | 创建时间 |
| update_time | DATETIME | 更新时间 |

## 已初始化的数据字典分类

### 借款信息相关（step1）

| 分类编码 | 分类名称 | 选项数量 | 说明 |
|----------|----------|----------|------|
| assignee_org | 受让机构 | 4 | 广西云桂实业投资有限公司等 |
| microloan_org | 小贷机构 | 4 | 南宁市益信小额贷款股份有限公司等 |
| payment_channel | 支付渠道 | 5 | 宝付、支付宝、微信支付等 |
| product_type | 产品类型 | 4 | 信用业务、抵押业务、担保业务、质押业务 |
| loan_purpose | 借款用途 | 6 | 资金周转、生产经营、消费贷款等 |
| repayment_method | 还款方式 | 5 | 等额本息、等额本金、先息后本等 |
| dispute_resolution | 解决争议方式 | 3 | 仲裁解决、诉讼解决、协商解决 |
| arbitration_org | 仲裁机构 | 5 | 南平国际仲裁院、北京仲裁委员会等 |
| notarization_type | 公证类型 | 1 | 赋强公证 |
| notarization_item | 公证事项 | 2 | 有抵押赋强、无抵押赋强 |
| borrower_category | 借款人类型 | 2 | 个人、对公 |
| contract_sign_mode | 合同签署方式 | 2 | 在线签署、线下签署 |
| is_notarization | 是否办理赋强公证 | 2 | 是、否 |
| certificate_receive_method | 证书接收方式 | 3 | 电子版、纸质版、电子版+纸质版 |

### 个人信息相关（step2/step3/step4）

| 分类编码 | 分类名称 | 选项数量 | 说明 |
|----------|----------|----------|------|
| id_type | 证件类型 | 6 | 身份证、护照、军官证等 |
| gender | 性别 | 2 | 男、女 |
| marital_status | 婚姻状况 | 4 | 未婚、已婚、离异、丧偶 |
| education | 学历 | 7 | 小学、初中、高中/中专、大专、本科、硕士、博士 |
| occupation | 职业 | 9 | 公务员、企业职员、个体工商户等 |
| industry | 行业 | 19 | 按国民经济行业分类标准 |
| relationship | 关系 | 8 | 配偶、父母、子女、兄弟姐妹等 |

## 使用方式

### 1. 执行 SQL 初始化

```bash
# 在 MySQL 中执行
mysql -u root -p your_database < docs/dict-tables-init.sql
```

### 2. 后端接口开发

需要创建以下接口：

#### 2.1 获取所有分类列表
```
GET /public/dict/categories
响应：
{
  "code": 200,
  "data": [
    {
      "categoryCode": "marital_status",
      "categoryName": "婚姻状况",
      "description": "个人信息-婚姻状况选项"
    },
    ...
  ]
}
```

#### 2.2 获取指定分类的选项列表
```
GET /public/dict/items/{categoryCode}
例如：GET /public/dict/items/marital_status

响应：
{
  "code": 200,
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
    },
    ...
  ]
}
```

#### 2.3 批量获取多个分类的选项（推荐）
```
POST /public/dict/items/batch
请求体：
{
  "categoryCodes": ["marital_status", "gender", "education"]
}

响应：
{
  "code": 200,
  "data": {
    "marital_status": [
      {"itemValue": "未婚", "sortOrder": 1, "isDefault": true},
      {"itemValue": "已婚", "sortOrder": 2, "isDefault": false},
      ...
    ],
    "gender": [
      {"itemValue": "男", "sortOrder": 1, "isDefault": false},
      {"itemValue": "女", "sortOrder": 2, "isDefault": false}
    ],
    ...
  }
}
```

### 3. 前端调用示例

#### 3.1 在 app.js 中预加载常用字典

```javascript
// app.js
App({
  onLaunch() {
    // 预加载常用字典数据
    this.loadCommonDicts();
  },
  
  loadCommonDicts() {
    const req = wx.$request;
    
    // 批量获取常用字典
    req.post('/public/dict/items/batch', {
      categoryCodes: [
        'marital_status',
        'gender',
        'id_type',
        'education',
        'occupation',
        'industry',
        'relationship'
      ]
    }).then(res => {
      if (res.data && res.data.code === 200) {
        // 保存到全局数据
        this.globalData.dictData = res.data.data;
        console.log('[字典] 常用字典数据加载成功');
      }
    }).catch(err => {
      console.error('[字典] 加载失败，使用本地默认值', err);
    });
  },
  
  globalData: {
    dictData: {} // 字典数据缓存
  }
});
```

#### 3.2 在页面中使用字典数据

```javascript
// step2/index.js
Page({
  data: {
    maritalStatusOptions: [] // 婚姻状况选项
  },
  
  onLoad() {
    // 从全局数据获取字典
    const app = getApp();
    const dictData = app.globalData.dictData || {};
    
    // 设置婚姻状况选项
    if (dictData.marital_status) {
      this.setData({
        maritalStatusOptions: dictData.marital_status.map(item => item.itemValue)
      });
    } else {
      // 降级方案：使用本地默认值
      this.setData({
        maritalStatusOptions: ['未婚', '已婚', '离异', '丧偶']
      });
    }
  },
  
  // 选择婚姻状况
  selectMaritalStatus() {
    const that = this;
    wx.showActionSheet({
      itemList: this.data.maritalStatusOptions,
      success: (res) => {
        const status = that.data.maritalStatusOptions[res.tapIndex];
        that.setData({
          'formData.maritalStatus': status
        });
      }
    });
  }
});
```

## 优势

### 1. 便于维护
- ✅ 修改选项只需更新数据库，无需重新发布小程序
- ✅ 可以通过后台管理系统动态管理字典数据
- ✅ 支持启用/禁用选项，灵活控制

### 2. 扩展性强
- ✅ 新增选项只需插入数据，不需要修改代码
- ✅ 支持设置默认选项
- ✅ 支持排序，可调整选项显示顺序

### 3. 统一管理
- ✅ 所有下拉列表数据集中管理
- ✅ 避免前端硬编码，减少维护成本
- ✅ 支持多端（小程序、Web、App）共用

### 4. 性能优化
- ✅ 支持批量获取，减少网络请求
- ✅ 可在 app.js 中预加载，提升用户体验
- ✅ 支持本地缓存，离线也能使用

## 后续优化建议

### 1. 添加字典管理后台
创建管理界面，支持：
- 新增/编辑/删除分类
- 新增/编辑/删除选项
- 启用/禁用选项
- 调整排序顺序
- 设置默认选项

### 2. 添加缓存机制
- 后端：使用 Redis 缓存字典数据
- 前端：使用 Storage 缓存，定期更新

### 3. 支持多语言
利用 `item_label` 字段支持国际化：
```javascript
{
  "itemValue": "married",
  "itemLabel": {
    "zh_CN": "已婚",
    "en_US": "Married"
  }
}
```

### 4. 添加字典版本控制
在 `dict_category` 表中添加 `version` 字段，前端可以根据版本号判断是否需要更新本地缓存。

## 注意事项

1. **向后兼容**：在接口未开发完成前，前端保留本地默认值作为降级方案
2. **性能考虑**：常用字典在 app.js 中预加载，不常用的按需加载
3. **数据一致性**：确保数据库中的选项值与现有代码中的值保持一致
4. **错误处理**：接口调用失败时，使用本地默认值，不影响用户使用

## 迁移步骤

1. ✅ 执行 SQL 初始化数据库表和数据
2. ⏳ 后端开发字典查询接口
3. ⏳ 前端修改代码，从接口获取字典数据
4. ⏳ 测试验证所有下拉列表功能正常
5. ⏳ 上线部署

## 相关文件

- SQL 文件：`docs/dict-tables-init.sql`
- 本说明文档：`docs/dict-tables-design.md`

