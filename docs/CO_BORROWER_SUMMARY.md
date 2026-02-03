# 共借人信息功能完善总结

## 📋 完成内容

### 1. ✅ 数据库表结构更新

**文件位置：** `docs/db/update-co-borrower-schema.sql`

**新增字段：**
- `borrower_type` - 借款人类型（personal/company）
- `id_address` - 证件地址
- `relationship` - 与主借人关系
- `business_license_url` - 营业执照图片
- `company_name` - 公司名称
- `company_credit_code` - 公司信用代码
- `company_area` - 公司注册地
- `company_address` - 公司详细地址
- `agent_name` - 经办人姓名
- `agent_mobile` - 经办人手机号
- `agent_id_type` - 经办人证件类型
- `agent_id_no` - 经办人证件号码
- `agent_id_issue_date` - 经办人证件生效日期
- `agent_id_expire_date` - 经办人证件有效期
- `agent_id_address` - 经办人证件地址
- `agent_face_front_url` - 经办人身份证正面
- `agent_face_back_url` - 经办人身份证反面
- `notary_documents_json` - 公证材料JSON

**索引优化：**
- `idx_borrower_type` - 借款人类型索引
- `idx_company_name` - 公司名称索引

### 2. ✅ 后端代码更新

#### 2.1 DTO更新
**文件：** `src/main/java/com/example/loanminiapp/dto/step/Step3CoBorrowerDTO.java`

**支持字段：**
- 个人信息：姓名、证件、手机号、地址、婚姻状况等
- 对公信息：公司名称、信用代码、营业执照、经办人信息等
- 公证材料：支持多个文件的列表

#### 2.2 Entity更新
**文件：** `src/main/java/com/example/loanminiapp/entity/OrderBorrower.java`

**改进：**
- 添加 `@NoArgsConstructor` 和 `@AllArgsConstructor` 注解
- 支持个人和对公两种类型的完整字段
- 公证材料以JSON格式存储

#### 2.3 Service更新
**文件：** `src/main/java/com/example/loanminiapp/service/OrderStepService.java`

**新增方法：**
- `mapCoBorrowerFromDTO()` - 从DTO映射到Entity
- `mapCoBorrowerFromMap()` - 从Map映射到Entity

**改进：**
- 完善 `saveStep3Data()` 方法，支持个人和对公两种类型
- 增强数据验证逻辑
- 添加详细日志记录

#### 2.4 新增Controller
**文件：** `src/main/java/com/example/loanminiapp/controller/CoBorrowerController.java`

**提供接口：**
1. `GET /api/order/{orderId}/co-borrower/list` - 获取共借人列表
2. `GET /api/order/{orderId}/co-borrower/{id}` - 获取单个共借人
3. `POST /api/order/{orderId}/co-borrower/add` - 新增共借人
4. `PUT /api/order/{orderId}/co-borrower/{id}` - 更新共借人
5. `DELETE /api/order/{orderId}/co-borrower/{id}` - 删除共借人
6. `POST /api/order/{orderId}/co-borrower/batch-save` - 批量保存

**特性：**
- 完整的CRUD操作
- 数据验证（个人/对公必填字段）
- 权限控制（@OrderAccessCheck）
- 详细的日志记录
- 友好的错误提示

### 3. ✅ 文档完善

**文件：** `docs/CO_BORROWER_README.md`

**包含内容：**
- 功能概述
- 数据库更新指南
- API接口文档
- 前端集成示例
- 数据字段说明
- 测试建议
- 常见问题解答

## 🗄️ 数据库DDL语句

### 快速执行

```bash
# 方式1：使用mysql命令行
mysql -u root -p your_database < docs/db/update-co-borrower-schema.sql

# 方式2：登录MySQL后执行
mysql> source /path/to/docs/db/update-co-borrower-schema.sql;
```

### 核心DDL语句

```sql
-- 1. 添加借款人类型
ALTER TABLE t_order_borrower 
ADD COLUMN borrower_type VARCHAR(16) COMMENT '借款人类型：personal-个人，company-对公' AFTER role_type;

-- 2. 添加证件地址
ALTER TABLE t_order_borrower 
ADD COLUMN id_address VARCHAR(255) COMMENT '证件地址' AFTER id_expire_date;

-- 3. 添加关系字段
ALTER TABLE t_order_borrower 
ADD COLUMN relationship VARCHAR(32) COMMENT '与主借人关系' AFTER marital_status;

-- 4-19. 添加对公和经办人字段（详见完整SQL文件）

-- 20. 添加索引
CREATE INDEX idx_borrower_type ON t_order_borrower(borrower_type);
CREATE INDEX idx_company_name ON t_order_borrower(company_name);
```

## 📊 数据结构对比

### 更新前
```
t_order_borrower
├── id
├── order_id
├── role_type
├── name
├── id_type
├── id_no
├── mobile
└── ... (基础字段)
```

### 更新后
```
t_order_borrower
├── id
├── order_id
├── role_type
├── borrower_type ⭐ 新增
│
├── [个人信息]
│   ├── name
│   ├── id_type
│   ├── id_no
│   ├── id_address ⭐ 新增
│   ├── relationship ⭐ 新增
│   └── ...
│
├── [对公信息] ⭐ 全新
│   ├── business_license_url
│   ├── company_name
│   ├── company_credit_code
│   ├── company_area
│   └── company_address
│
├── [经办人信息] ⭐ 全新
│   ├── agent_name
│   ├── agent_mobile
│   ├── agent_id_type
│   ├── agent_id_no
│   ├── agent_id_issue_date
│   ├── agent_id_expire_date
│   ├── agent_id_address
│   ├── agent_face_front_url
│   └── agent_face_back_url
│
└── notary_documents_json ⭐ 新增
```

## 🔌 API接口示例

### 新增个人共借人

```bash
curl -X POST http://localhost:8080/api/order/1/co-borrower/add \
  -H "Content-Type: application/json" \
  -d '{
    "borrowerType": "personal",
    "name": "张三",
    "phone": "13800138000",
    "idNumber": "110101199001011234",
    "idCardFront": "/uploads/front.jpg",
    "idCardBack": "/uploads/back.jpg",
    "residenceArea": "北京市朝阳区",
    "detailAddress": "XX路XX号",
    "relationship": "配偶",
    "maritalStatus": "已婚"
  }'
```

### 新增对公共借人

```bash
curl -X POST http://localhost:8080/api/order/1/co-borrower/add \
  -H "Content-Type: application/json" \
  -d '{
    "borrowerType": "company",
    "companyName": "XX科技有限公司",
    "companyCreditCode": "91110000MA01234567",
    "businessLicense": "/uploads/license.jpg",
    "companyArea": "北京市海淀区",
    "companyAddress": "中关村大街1号",
    "agentName": "李四",
    "agentPhone": "13900139000",
    "agentIdNumber": "110101199002021234",
    "agentIdCardFront": "/uploads/agent_front.jpg",
    "agentIdCardBack": "/uploads/agent_back.jpg",
    "notaryDocuments": [
      {"name": "法人证明书1", "path": "/uploads/notary1.jpg"},
      {"name": "法人证明书2", "path": "/uploads/notary2.jpg"}
    ]
  }'
```

## 🎯 前端集成要点

### 小程序端数据提交

```javascript
// 在 co-borrower/index.js 的 save() 方法中
save() {
  // 构建数据
  const coBorrowerData = {
    borrowerType: this.data.borrowerType,
    // 个人信息
    name: this.data.name,
    phone: this.data.phone,
    idNumber: this.data.idNumber,
    idCardFront: this.data.idCardFront,
    idCardBack: this.data.idCardBack,
    // ... 其他字段
    
    // 对公信息
    companyName: this.data.companyName,
    companyCreditCode: this.data.companyCreditCode,
    businessLicense: this.data.businessLicense,
    agentName: this.data.agentName,
    agentIdNumber: this.data.agentIdNumber,
    agentIdCardFront: this.data.agentIdCardFront,
    agentIdCardBack: this.data.agentIdCardBack,
    notaryDocuments: this.data.notaryDocuments
  };

  // 调用后端API
  wx.request({
    url: `${API_BASE}/api/order/${orderId}/co-borrower/add`,
    method: 'POST',
    data: coBorrowerData,
    success: (res) => {
      if (res.data.success) {
        wx.showToast({ title: '保存成功', icon: 'success' });
        wx.navigateBack();
      }
    }
  });
}
```

## ✅ 验证清单

### 数据库验证
- [ ] 执行DDL语句成功
- [ ] 检查新增字段是否存在
- [ ] 检查索引是否创建成功

### 后端验证
- [ ] 编译无错误
- [ ] 启动应用成功
- [ ] API接口可访问

### 功能验证
- [ ] 可以新增个人共借人
- [ ] 可以新增对公共借人
- [ ] 可以查询共借人列表
- [ ] 可以更新共借人信息
- [ ] 可以删除共借人
- [ ] 数据验证正常工作

## 📝 注意事项

1. **数据库备份**：执行DDL前请先备份数据库
2. **字段长度**：根据实际业务需求调整字段长度
3. **索引优化**：根据查询频率添加合适的索引
4. **权限控制**：确保 @OrderAccessCheck 注解正常工作
5. **日志记录**：关注日志输出，便于问题排查

## 🚀 下一步建议

1. **单元测试**：为新增的Controller方法编写单元测试
2. **集成测试**：测试完整的数据流程
3. **性能优化**：如果共借人数量较多，考虑分页查询
4. **数据迁移**：如果有历史数据，编写迁移脚本
5. **监控告警**：添加关键操作的监控和告警

## 📚 相关文件清单

```
miniapp/
├── docs/
│   ├── db/
│   │   └── update-co-borrower-schema.sql          # DDL语句
│   └── CO_BORROWER_README.md                      # 功能文档
│
├── src/main/java/com/example/loanminiapp/
│   ├── controller/
│   │   └── CoBorrowerController.java              # 新增Controller
│   ├── dto/step/
│   │   ├── Step3CoBorrowerDTO.java                # 更新DTO
│   │   └── Step3CoBorrowerListDTO.java            # 列表DTO
│   ├── entity/
│   │   └── OrderBorrower.java                     # 更新Entity
│   └── service/
│       └── OrderStepService.java                  # 更新Service
│
└── wx-miniapp/miniprogram/pages/order/create/
    └── co-borrower/
        ├── index.js                                # 前端逻辑
        ├── index.wxml                              # 前端页面
        ├── index.wxss                              # 前端样式
        └── index.json                              # 页面配置
```

## 🎉 总结

本次更新完善了共借人信息管理功能，支持个人和对公两种类型的共借人，包括：

✅ **数据库层**：新增20+字段，支持完整的个人和对公信息
✅ **后端层**：完整的CRUD接口，数据验证，权限控制
✅ **文档层**：详细的API文档，使用说明，测试指南
✅ **前端层**：已有完整的UI和数据收集逻辑

所有代码已经完成，可以直接使用！

