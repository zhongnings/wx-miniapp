# 共借人/担保人附件上传和删除问题分析及修复

## ✅ 已修复

**修复时间**: 2025-02-15  
**修复内容**: 
1. 将附件上传改为立即上传模式
2. 修复删除逻辑，支持删除后端文件

---

---

## 修复方案总结

### 修改的文件

1. **共借人页面** (`wx-miniapp/miniprogram/pages/order/create/co-borrower/index.js`)
2. **担保人页面** (`wx-miniapp/miniprogram/pages/order/create/guarantor/index.js`)

### 修改的方法

#### 1. `uploadNotaryDocument()` - 改为立即上传

**修改前**（延迟上传）：
```javascript
// 选择文件后只保存本地路径
notaryDocuments.push({
  name: timestampFileName,
  originalName: file.name,
  path: file.path,  // 只有本地路径
  size: file.size
});
```

**修改后**（立即上传）：
```javascript
// 选择文件后立即上传到服务器
const result = await wx.$upload.uploadOrderFile(file.path, 'notaryDoc', orderId);

notaryDocuments.push({
  name: result.name || timestampFileName,
  originalName: result.originalName || file.name,
  url: result.url,  // 服务器URL
  size: result.size || file.size
});
```

**优点**：
- 用户体验好，选择后立即上传
- 删除时可以正确删除后端文件
- 保存时 `uploadFilesIfNeeded` 会自动跳过已上传的文件（因为有 `url`）

#### 2. `previewNotaryDocument()` - 支持服务器URL

**修改**：
```javascript
// 优先使用服务器URL，其次使用本地路径
const fileUrl = doc.url || doc.path;
```

#### 3. `deleteNotaryDocument()` - 支持删除后端文件

**修改前**：
```javascript
// 调用通用删除方法（但文件没有 id 和 url，无法删除后端）
wx.$upload.deleteOrderFile({
  file: document,
  fileType: 'notary-documents'
});
```

**修改后**：
```javascript
// 如果文件已上传到服务器（有url），则删除后端文件
if (document.url && /^https?:\/\//i.test(document.url)) {
  const orderId = wx.getStorageSync('currentOrderId');
  if (orderId) {
    wx.$upload.deleteImageByUrl(document.url, orderId)
      .then(() => {
        logger.info('[公证材料] 后端文件删除成功', { url: document.url });
      })
      .catch((err) => {
        logger.error('[公证材料] 后端文件删除失败', { url: document.url, error: err });
      });
  }
}
```

---

## 问题1：附件删除没有删除后端文件

### 当前代码分析

**共借人页面 `deleteNotaryDocument` 方法**（第1088-1110行）：

```javascript
deleteNotaryDocument(e) {
  const index = e.currentTarget.dataset.index;
  const document = this.data.notaryDocuments[index];
  const that = this;
  
  wx.showModal({
    title: '确认删除',
    content: '你确认要删除该文件吗?',
    confirmText: '确认',
    cancelText: '取消',
    confirmColor: '#ff6f6f',
    success: (res) => {
      if (res.confirm) {
        // 用户确认删除
        const docs = that.data.notaryDocuments;
        docs.splice(index, 1);
        that.setData({
          notaryDocuments: docs
        });
        
        // 调用通用删除方法
        wx.$upload.deleteOrderFile({
          file: document,
          fileType: 'notary-documents'
        });
      }
    }
  });
}
```

### 问题分析

**问题1：文件对象缺少必要字段**

`deleteOrderFile` 方法需要文件对象包含以下字段：
- `id` - 后端文件ID（必需）
- `url` - 文件URL（必需，用于判断是否已上传）

但是 `uploadNotaryDocument` 方法选择文件后，只设置了：
```javascript
{
  name: timestampFileName,
  originalName: file.name,
  path: file.path,  // 本地临时路径
  size: file.size
}
```

**缺少 `id` 和 `url` 字段！**

**问题2：上传逻辑在保存时才执行**

附件上传是在 `save()` 方法中才执行的：
```javascript
// 如果有法人证明书需要上传，先上传到服务器
let uploadedNotaryDocs = [];
if (this.data.notaryDocuments && this.data.notaryDocuments.length > 0) {
  wx.showLoading({ title: '上传文件中...', mask: true });
  try {
    const orderId = wx.getStorageSync('currentOrderId');
    uploadedNotaryDocs = await wx.$upload.uploadFilesIfNeeded(
      this.data.notaryDocuments,
      (filePath) => wx.$upload.uploadOrderFile(filePath, 'notaryDoc', orderId)
    );
    // ...
  }
}
```

这意味着：
1. 用户选择文件后，文件只保存在本地，没有立即上传
2. 删除时，文件还没有 `id` 和 `url`，所以 `deleteOrderFile` 无法删除后端文件
3. 只有点击"保存"按钮后，文件才会上传到后端

---

## 问题2：upload.js 工具类方法混乱

### 当前方法列表

```javascript
1. uploadFile(options)                    // 核心上传方法
2. uploadIdCardImage(...)                 // 上传身份证（带OCR）
3. uploadBankCardImage(...)               // 上传银行卡图片
4. uploadContractFile(...)                // 上传合同文件
5. uploadGenericFile(...)                 // 通用文件上传
6. uploadOrderFile(...)                   // 上传订单文件
7. uploadFilesIfNeeded(...)               // 批量上传文件
8. deleteOrderFile(...)                   // 删除订单文件
9. deleteImageByUrl(...)                  // 根据URL删除图片
```

### 方法使用情况分析

#### ✅ 正在使用的方法

1. **uploadIdCardImage** - 身份证上传（step2, co-borrower, guarantor）
2. **uploadBankCardImage** - 银行卡图片上传（step5）
3. **uploadOrderFile** - 订单文件上传（co-borrower, guarantor 的公证材料）
4. **uploadFilesIfNeeded** - 批量上传（co-borrower, guarantor 保存时）
5. **deleteImageByUrl** - 删除图片（step2, co-borrower, guarantor 的身份证/营业执照）
6. **deleteOrderFile** - 删除订单文件（co-borrower, guarantor 的公证材料）

#### ❓ 可能未使用的方法

7. **uploadContractFile** - 上传合同文件
   - 搜索结果：未找到使用
   - 建议：保留（可能用于 step6 或其他合同上传场景）

8. **uploadGenericFile** - 通用文件上传
   - 搜索结果：未找到使用
   - 建议：保留（作为通用上传接口）

9. **uploadFile** - 核心上传方法
   - 被其他所有上传方法调用
   - 必须保留

### 方法职责分析

| 方法 | 职责 | OCR | 使用场景 | 状态 |
|------|------|-----|----------|------|
| uploadFile | 核心上传逻辑 | 可选 | 被其他方法调用 | ✅ 必需 |
| uploadIdCardImage | 身份证上传 | ✅ | step2, co-borrower, guarantor | ✅ 使用中 |
| uploadBankCardImage | 银行卡图片 | ❌ | step5 | ✅ 使用中 |
| uploadContractFile | 合同文件 | ❌ | step6（可能） | ⚠️ 未使用 |
| uploadGenericFile | 通用上传 | ❌ | 通用场景 | ⚠️ 未使用 |
| uploadOrderFile | 订单文件 | ❌ | 公证材料等 | ✅ 使用中 |
| uploadFilesIfNeeded | 批量上传 | - | 保存时批量上传 | ✅ 使用中 |
| deleteOrderFile | 删除订单文件 | - | 删除公证材料 | ✅ 使用中 |
| deleteImageByUrl | 删除图片 | - | 删除身份证等 | ✅ 使用中 |

---

## 解决方案

### 方案1：立即上传附件（推荐）

**优点**：
- 用户体验好，选择文件后立即上传
- 删除时可以正确删除后端文件
- 避免保存时批量上传导致的等待时间过长

**缺点**：
- 如果用户选择文件后不保存，会产生垃圾文件
- 需要后端定期清理未关联的文件

**实现步骤**：

1. 修改 `uploadNotaryDocument` 方法，选择文件后立即上传
2. 上传成功后，将返回的 `url` 和 `id` 保存到文件对象
3. 删除时，`deleteOrderFile` 可以正确删除后端文件

### 方案2：延迟上传 + 改进删除逻辑

**优点**：
- 避免产生垃圾文件
- 只有保存时才上传

**缺点**：
- 删除本地文件时无法删除后端文件（因为还没上传）
- 逻辑复杂，需要区分本地文件和已上传文件

**实现步骤**：

1. 保持当前上传逻辑不变
2. 修改 `deleteNotaryDocument`，判断文件是否已上传
3. 如果已上传（有 `url` 和 `id`），调用 `deleteOrderFile`
4. 如果未上传，只删除本地数据

---

## upload.js 优化建议

### 建议1：保持现有方法（推荐）

**理由**：
- 所有方法都有明确的职责
- `uploadContractFile` 和 `uploadGenericFile` 虽然暂未使用，但提供了扩展性
- 删除未使用的方法可能导致未来需要时重新实现

**操作**：
- 不做修改，保持现状
- 添加注释说明每个方法的使用场景

### 建议2：添加使用说明注释

在 `upload.js` 顶部添加详细的使用说明：

```javascript
/**
 * 通用文件上传工具
 * 
 * 使用场景：
 * 1. uploadIdCardImage - 身份证上传（自动OCR）
 *    - step2: 借款人身份证
 *    - co-borrower: 共借人身份证
 *    - guarantor: 担保人身份证
 * 
 * 2. uploadBankCardImage - 银行卡图片上传
 *    - step5: 银行卡照片
 * 
 * 3. uploadOrderFile - 订单文件上传（不OCR）
 *    - co-borrower: 公证材料
 *    - guarantor: 公证材料
 *    - step6: 其他附件
 * 
 * 4. uploadContractFile - 合同文件上传（预留）
 *    - 未来可能用于合同上传
 * 
 * 5. uploadGenericFile - 通用文件上传（预留）
 *    - 通用场景，不关联订单
 * 
 * 删除方法：
 * 1. deleteImageByUrl - 删除图片（根据URL）
 * 2. deleteOrderFile - 删除订单文件（根据ID）
 */
```

### 建议3：添加方法使用统计

创建一个文档记录每个方法的使用情况，便于后续维护。

---

## 总结

### 问题1：附件删除问题

**根本原因**：文件选择后没有立即上传，导致删除时文件对象缺少 `id` 和 `url` 字段

**推荐方案**：修改为立即上传模式

### 问题2：upload.js 方法混乱

**分析结果**：方法职责清晰，不混乱

**建议**：
- 保持现有方法不变
- 添加详细的使用说明注释
- 创建使用情况文档

---

## 下一步行动

1. **立即修复**：修改共借人和担保人的附件上传逻辑，改为立即上传
2. **文档优化**：为 upload.js 添加详细的使用说明
3. **测试验证**：测试附件上传和删除功能

