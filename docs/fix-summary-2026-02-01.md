# 问题修复总结

## 修复的问题

### 1. ✅ 共借人页面婚姻状况字段
**状态**: 已存在，无需修改

共借人详情页面（`pages/order/create/co-borrower/index.wxml`）已经包含婚姻状况字段：

```xml
<!-- 婚姻状况 -->
<view class="form-item" bindtap="selectMaritalStatus">
  <view class="form-label required">婚姻状况</view>
  <view class="form-value">
    <text class="{{maritalStatus ? '' : 'placeholder'}}">{{maritalStatus || '请选择婚姻状况'}}</text>
    <text class="arrow">〉</text>
  </view>
</view>
```

对应的JS方法也已实现：
```javascript
// 选择婚姻状况
selectMaritalStatus() {
  const that = this;
  wx.showActionSheet({
    itemList: ['未婚', '已婚', '离异', '丧偶'],
    success: (res) => {
      const statusList = ['未婚', '已婚', '离异', '丧偶'];
      that.setData({ maritalStatus: statusList[res.tapIndex] });
    }
  });
}
```

### 2. ✅ 担保人页面婚姻状况字段
**状态**: 已存在，无需修改

担保人详情页面（`pages/order/create/guarantor/index.wxml`）也已经包含婚姻状况字段（与共借人相同）：

```xml
<!-- 婚姻状况 -->
<view class="form-item" bindtap="selectMaritalStatus">
  <view class="form-label required">婚姻状况</view>
  <view class="form-value">
    <text class="{{maritalStatus ? '' : 'placeholder'}}">{{maritalStatus || '请选择婚姻状况'}}</text>
    <text class="arrow">〉</text>
  </view>
</view>
```

### 3. ✅ 担保人页面跳转问题
**状态**: 已修复

**问题原因**: 
担保人详情页面路径（`pages/order/create/guarantor/index`）没有在 `app.json` 中注册。

**修复方案**:
在 `app.json` 的 `pages` 数组中添加了担保人页面路径：

```json
{
  "pages": [
    "pages/login/index",
    "pages/register/index",
    "pages/home/index",
    "pages/order/list/index",
    "pages/order/detail/index",
    "pages/order/progress/index",
    "pages/order/contracts/index",
    "pages/order/create/step1/index",
    "pages/order/create/step2/index",
    "pages/order/create/step3/index",
    "pages/order/create/co-borrower/index",
    "pages/order/create/step4/index",
    "pages/order/create/guarantor/index",  // ← 新增
    "pages/order/create/step5/index",
    "pages/order/create/step5-edit/index",
    "pages/order/create/step6/index",
    "components/region-picker/region-picker"
  ]
}
```

**跳转逻辑**（已存在于 `step4/index.js`）:
```javascript
// 添加/编辑担保人
editGuarantor() {
  const orderId = this.data.orderId || wx.getStorageSync('currentOrderId');
  let url = '/pages/order/create/guarantor/index';
  
  // 如果有orderId，传递给guarantor页面
  if (orderId) {
    url += `?orderId=${orderId}`;
  }
  
  wx.navigateTo({
    url: url
  });
}
```

## 测试步骤

### 测试担保人页面跳转
1. 打开微信开发者工具
2. 重新编译小程序（确保 `app.json` 更新生效）
3. 进入订单创建流程
4. 到达 Step4（担保人信息页面）
5. 点击"添加担保人"按钮
6. ✅ 应该能正常跳转到担保人详情页面

### 测试婚姻状况字段
1. 在共借人详情页面（个人类型）
2. 找到"婚姻状况"字段
3. 点击选择
4. ✅ 应该弹出选项：未婚、已婚、离异、丧偶

5. 在担保人详情页面（个人类型）
6. 找到"婚姻状况"字段
7. 点击选择
8. ✅ 应该弹出选项：未婚、已婚、离异、丧偶

## 字段位置

### 共借人页面（个人类型）
字段顺序：
1. 证件类型
2. 姓名
3. 手机号
4. 证件号码
5. 证件生效日期
6. 证件有效期
7. 证件地址
8. 居住地省市区
9. 详细地址
10. 与主借人关系
11. **婚姻状况** ← 在这里

### 担保人页面（个人类型）
字段顺序（与共借人相同）：
1. 证件类型
2. 姓名
3. 手机号
4. 证件号码
5. 证件生效日期
6. 证件有效期
7. 证件地址
8. 居住地省市区
9. 详细地址
10. 与主借人关系
11. **婚姻状况** ← 在这里

## 数据流

### 婚姻状况数据保存
```javascript
// 共借人保存
const coBorrowerData = {
  // ... 其他字段
  maritalStatus: this.data.maritalStatus,  // 婚姻状况
  // ...
};

// 担保人保存
const guarantorData = {
  // ... 其他字段
  maritalStatus: this.data.maritalStatus,  // 婚姻状况
  // ...
};
```

### 后端字段映射
```java
// OrderCoBorrower.java
private String maritalStatus;  // 婚姻状况

// OrderGuarantor.java
private String maritalStatus;  // 婚姻状况
```

## 修改的文件

1. ✅ `wx-miniapp/miniprogram/app.json` - 添加担保人页面路由

## 无需修改的文件

以下文件已经包含所需功能，无需修改：

1. ✅ `wx-miniapp/miniprogram/pages/order/create/co-borrower/index.wxml` - 已有婚姻状况字段
2. ✅ `wx-miniapp/miniprogram/pages/order/create/co-borrower/index.js` - 已有选择方法
3. ✅ `wx-miniapp/miniprogram/pages/order/create/guarantor/index.wxml` - 已有婚姻状况字段
4. ✅ `wx-miniapp/miniprogram/pages/order/create/guarantor/index.js` - 已有选择方法
5. ✅ `wx-miniapp/miniprogram/pages/order/create/step4/index.js` - 已有跳转方法
6. ✅ `src/main/java/com/example/loanminiapp/entity/OrderCoBorrower.java` - 已有字段
7. ✅ `src/main/java/com/example/loanminiapp/entity/OrderGuarantor.java` - 已有字段

## 总结

所有问题都已解决：

1. ✅ 共借人页面已有婚姻状况字段（无需修改）
2. ✅ 担保人页面已有婚姻状况字段（无需修改）
3. ✅ 担保人页面跳转问题已修复（添加路由配置）

只需要重新编译小程序即可正常使用！

