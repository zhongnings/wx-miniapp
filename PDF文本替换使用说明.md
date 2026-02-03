# PDF文本替换方案使用说明

## 📋 方案说明

根据您的合同模板（使用 `[[占位符]]` 格式），我已经实现了**文本替换方案**，可以：
- ✅ 保留PDF原有样式
- ✅ 支持中文内容
- ✅ 简单高效
- ✅ 无水印

## 🎯 占位符格式

您的模板使用双方括号格式：`[[占位符名称]]`

例如：
- `[[name]]` - 借款人姓名
- `[[idNo]]` - 身份证号
- `[[addressDetail]]` - 详细地址
- `[[mobile]]` - 手机号码

## 📝 已支持的字段

根据 `buildContractData` 方法，系统已支持以下字段：

### 借款人信息
- `[[name]]` - 姓名
- `[[idNo]]` - 身份证号
- `[[addressDetail]]` - 详细地址
- `[[mobile]]` - 手机号码
- `[[address]]` - 完整地址（省市+详细地址）
- `[[email]]` - 邮箱

### 银行卡信息
- `[[accounName]]` - 账户名
- `[[bankName]]` - 银行名称
- `[[cardNo]]` - 银行卡号

### 借款信息
- `[[loanAmount]]` - 借款金额（数字）
- `[[loanAmountUppercase]]` - 借款金额（大写）
- `[[usageDesc]]` - 用途说明
- `[[repayMode]]` - 还款方式
- `[[disputeWay]]` - 争议解决方式
- `[[arbitrationOrg]]` - 仲裁机构
- `[[signPlace]]` - 签署地点

### 日期信息
- `[[startDateYear]]` - 开始年份
- `[[startDateMonth]]` - 开始月份
- `[[startDateDay]]` - 开始日期
- `[[endDateYear]]` - 结束年份
- `[[endDateMonth]]` - 结束月份
- `[[endDateDay]]` - 结束日期
- `[[nowYear]]` - 当前年份
- `[[nowMonth]]` - 当前月份
- `[[nowDay]]` - 当前日期

### 其他
- `[[type]]` - 担保方式
- `[[desc]]` - 其他约定事项

## 🔧 使用方法

### 方法1：在代码中调用

```java
// 在业务代码中调用
String contractPath = contractService.generateContract(order, borrower, loanInfo, bankCard);
```

### 方法2：运行测试方法

直接运行 `ContractService.main()` 方法进行测试：

```java
// 会生成测试文件到：D:\workcode\uploads\test-contract.pdf
ContractService.main(new String[]{});
```

## 📄 准备PDF模板

### 步骤1：创建Word文档

在Word中创建合同内容，在需要填充数据的位置使用占位符：

```
借款合同

甲方（出借人）：南宁市益信小额贷款股份有限公司
统一社会信用代码：914501005794165304
地址：南宁市东盟商务区中泰路3号"盈都·东盟时代广场"1-14楼二层203号房

乙方（借款人）：[[name]]
身份证号/统一社会信用代码：[[idNo]]
地址：[[addressDetail]]
电话：[[mobile]]
```

### 步骤2：导出为PDF

1. 在Word中点击：**文件 → 另存为 → PDF**
2. 保存为：`contract-template.pdf`
3. 复制到：`src/main/resources/templates/contract-template.pdf`

### 步骤3：验证占位符

确保PDF中的占位符格式正确：
- ✅ 正确：`[[name]]`
- ❌ 错误：`{ {name} }`、`{{name}}`、`[name]`

## 🧪 测试步骤

### 1. 准备模板文件

将您的合同模板PDF放到：
```
src/main/resources/templates/contract-template.pdf
```

### 2. 运行测试

在IDEA中右键点击 `ContractService.java`，选择 **Run 'ContractService.main()'**

### 3. 查看结果

测试文件会生成到：
```
D:\workcode\uploads\test-contract.pdf
```

打开查看是否替换成功！

## 📊 输出示例

运行测试后会看到：

```
=== 开始测试PDF文本替换 ===
✅ 替换成功: [[name]] -> 张三 (共1处)
✅ 替换成功: [[idNo]] -> 110101199001011234 (共1处)
✅ 替换成功: [[addressDetail]] -> 北京市朝阳区某某街道123号 (共1处)
✅ 替换成功: [[mobile]] -> 13800138000 (共1处)
✅ 替换成功: [[loanAmount]] -> 100000.00 (共1处)
✅ 替换成功: [[bankName]] -> 中国工商银行 (共1处)
✅ 替换成功: [[cardNo]] -> 6222021234567890 (共1处)

=== 替换完成 ===
📊 总共替换: 7 处
📁 输出文件: D:\workcode\uploads\test-contract.pdf
```

## ⚠️ 注意事项

### 1. 占位符格式必须一致

模板中：`[[name]]`  
代码中：`contractData.put("name", "张三")`

### 2. 中文支持

- PDF模板必须使用支持中文的字体（如宋体、黑体）
- 如果替换后中文显示为乱码，需要在模板中嵌入字体

### 3. 长文本处理

如果替换的文本比占位符长，可能会：
- 超出原有位置
- 换行显示

建议：在模板中为占位符预留足够空间

### 4. 特殊字符

避免在占位符中使用特殊字符：
- ✅ 推荐：`[[name]]`、`[[idNo]]`
- ❌ 避免：`[[姓名]]`、`[[id-no]]`

## 🔍 故障排查

### 问题1：占位符没有被替换

**原因**：占位符格式不匹配

**解决**：
1. 用文本编辑器打开PDF，搜索占位符
2. 确认格式是否为 `[[name]]`
3. 检查是否有多余空格

### 问题2：替换后中文乱码

**原因**：PDF字体不支持中文

**解决**：
1. 在Word中设置字体为"宋体"或"黑体"
2. 重新导出PDF
3. 确保"嵌入字体"选项已勾选

### 问题3：替换后文本位置错乱

**原因**：替换文本长度差异过大

**解决**：
1. 在模板中为占位符预留更多空间
2. 使用下划线占位：`[[name]]___________`
3. 调整字体大小

## 📚 相关文件

- **服务类**: `ContractService.java` - 合同生成服务
- **工具类**: `PdfTextReplacer.java` - PDF文本替换工具
- **模板文件**: `src/main/resources/templates/contract-template.pdf`
- **测试输出**: `D:\workcode\uploads\test-contract.pdf`

## 🎉 完成！

现在您可以：
1. ✅ 准备好带占位符的PDF模板
2. ✅ 运行测试方法验证
3. ✅ 在业务代码中调用生成合同

**简单、高效、保留样式！** 🚀

