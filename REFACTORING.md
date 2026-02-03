# 订单创建流程重构说明

## 📋 重构概述

已完成订单创建流程的架构重构，从原来的**通用 Map 转换方式**改为**独立 Service + Controller 模式**。

### ✅ 重构目标
- **提高可读性**：直接使用 DTO，类型安全
- **单一职责**：每个步骤独立管理
- **易于维护**：代码清晰，逻辑分离
- **符合 RESTful**：每个资源独立的 API

---

## 🏗️ 新架构

### 目录结构

```
src/main/java/com/example/loanminiapp/
├── controller/
│   ├── OrderLoanInfoController.java      ✅ Step1: 借款信息
│   ├── OrderBorrowerController.java      ✅ Step2: 借款人信息
│   ├── OrderCoBorrowerController.java    ✅ Step3: 共借人信息
│   ├── OrderGuarantorController.java     ✅ Step4: 担保人信息
│   ├── OrderBankCardController.java      ✅ Step5: 银行卡信息
│   └── OrderAttachmentController.java    ✅ Step6: 附件上传
├── service/
│   ├── OrderLoanInfoService.java         ✅ 借款信息业务逻辑
│   ├── OrderBorrowerService.java         ✅ 借款人业务逻辑
│   ├── OrderCoBorrowerService.java       ✅ 共借人业务逻辑
│   ├── OrderGuarantorService.java        ✅ 担保人业务逻辑
│   ├── OrderBankCardService.java         ✅ 银行卡业务逻辑
│   ├── OrderAttachmentService.java       ✅ 附件业务逻辑
│   └── OrderStepService.java             ✅ 简化版（只负责创建订单和标记完成）
```

---

## 🔄 新旧对比

### ❌ 旧方式（已废弃）

```java
// 可读性差，容易出错
Map<String, Object> data = new HashMap<>();
data.put("loanAmount", 10000);
data.put("loanDays", 30);

OrderStepSaveRequest request = new OrderStepSaveRequest();
request.setOrderId(orderId);
request.setStep(1);
request.setData(data);
orderStepService.saveStep(request);
```

### ✅ 新方式（推荐）

```java
// 类型安全，清晰明了
Step1LoanInfoDTO dto = new Step1LoanInfoDTO();
dto.setLoanAmount(new BigDecimal("10000"));
dto.setLoanDays(30);

orderLoanInfoService.save(orderId, dto);
orderStepService.markStepCompleted(orderId, 1);
```

---

## 📡 新 API 接口

### Step1: 借款信息

```http
POST /api/order/loanInfo/save
GET  /api/order/{orderId}/loanInfo
```

### Step2: 借款人信息

```http
POST /api/order/borrower/save
GET  /api/order/{orderId}/borrower
```

### Step3: 共借人信息

```http
POST /api/order/{orderId}/coBorrower/save
GET  /api/order/{orderId}/coBorrower
DELETE /api/order/{orderId}/coBorrower
```

### Step4: 担保人信息

```http
POST /api/order/{orderId}/guarantors/save
GET  /api/order/{orderId}/guarantors
```

### Step5: 银行卡信息

```http
POST /api/order/{orderId}/bankCards/save
GET  /api/order/{orderId}/bankCards
DELETE /api/order/{orderId}/bankCards/{cardId}
```

### Step6: 附件信息

```http
POST /api/order/{orderId}/attachments/save
GET  /api/order/{orderId}/attachments
DELETE /api/order/{orderId}/attachments/{attachmentId}
```

---

## 🎯 核心改进

### 1. OrderStepService 简化

**职责：**
- ✅ 创建新订单
- ✅ 标记步骤完成状态

**移除：**
- ❌ Map 转换逻辑
- ❌ 通用 saveStep() 方法
- ❌ saveStep1Data() ~ saveStep6Data() 方法

### 2. 独立的 Service 层

每个步骤都有独立的 Service，负责：
- 数据验证
- 业务逻辑处理
- 数据库操作
- 同步更新订单表

### 3. 独立的 Controller 层

每个步骤都有独立的 Controller，负责：
- 接收请求参数
- 解析 DTO
- 调用 Service
- 返回响应

---

## 💡 使用示例

### 前端调用示例（Step1）

```javascript
// 保存借款信息
wx.request({
  url: '/api/order/loanInfo/save',
  method: 'POST',
  data: {
    orderId: this.data.orderId,  // 如果为 null，会自动创建订单
    assigneeOrg: '受让方机构',
    microloanOrg: '小贷机构',
    loanAmount: 10000,
    loanDays: 30,
    startDate: '2024-01-01',
    endDate: '2024-01-31',
    annualRate: 12.5
    // ... 其他字段
  },
  success: (res) => {
    if (res.data.success) {
      const orderId = res.data.orderId;
      // 保存 orderId，进入下一步
    }
  }
});

// 加载借款信息
wx.request({
  url: `/api/order/${orderId}/loanInfo`,
  method: 'GET',
  success: (res) => {
    if (res.data.success) {
      const loanInfo = res.data.data;
      // 回显数据
    }
  }
});
```

---

## 🔧 后续工作

### 前端调整

需要更新前端页面，调用新的 API 接口：

1. **Step1 (step1/index.js)**
   - 修改保存方法，调用 `/api/order/loanInfo/save`
   - 修改加载方法，调用 `/api/order/{orderId}/loanInfo`

2. **Step2 (step2/index.js)**
   - 修改保存方法，调用 `/api/order/borrower/save`
   - 修改加载方法，调用 `/api/order/{orderId}/borrower`

3. **Step3 (step3/index.js)**
   - ✅ 已完成，使用 `/api/order/{orderId}/coBorrower/*`

4. **Step4 (step4/index.js)**
   - 修改保存方法，调用 `/api/order/{orderId}/guarantors/save`
   - 修改加载方法，调用 `/api/order/{orderId}/guarantors`

5. **Step5 (step5/index.js)**
   - 修改保存方法，调用 `/api/order/{orderId}/bankCards/save`
   - 修改加载方法，调用 `/api/order/{orderId}/bankCards`

6. **Step6 (step6/index.js)**
   - 修改保存方法，调用 `/api/order/{orderId}/attachments/save`
   - 修改加载方法，调用 `/api/order/{orderId}/attachments`

---

## 📊 重构收益

### 代码质量
- ✅ 类型安全，避免类型转换错误
- ✅ 代码清晰，易于理解和维护
- ✅ 符合单一职责原则

### 开发效率
- ✅ 新增字段只需修改 DTO 和 Service
- ✅ 易于测试，每个 Service 独立
- ✅ 易于扩展，添加新功能不影响其他步骤

### 性能优化
- ✅ 移除了 Map 转换的性能开销
- ✅ 直接操作实体对象，更高效

---

## 🎉 总结

重构完成！新架构具有以下优势：

1. **可读性强**：直接使用 DTO，一目了然
2. **类型安全**：编译时检查，避免运行时错误
3. **易于维护**：每个步骤独立，修改不影响其他步骤
4. **符合规范**：遵循 RESTful 风格和单一职责原则

现在可以开始更新前端代码，调用新的 API 接口！

