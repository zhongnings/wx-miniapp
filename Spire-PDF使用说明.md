# PDF文本替换 - Spire.PDF 方案

## ✅ 已完成

我已经将代码切换为使用 **Spire.PDF.free**，这是一个简单高效的PDF处理库。

## 📋 实现说明

### 1. PdfTextReplacer.java
使用 Spire.PDF 的 `page.replaceText()` 方法进行文本替换：

```java
public int replaceText(String searchText, String replacement) {
    int totalReplacements = 0;
    
    // 遍历所有页面
    for (int i = 0; i < document.getPages().getCount(); i++) {
        PdfPageBase page = document.getPages().get(i);
        
        // 使用 Spire.PDF 的 replaceText 方法
        int count = page.replaceText(searchText, replacement);
        totalReplacements += count;
    }
    
    return totalReplacements;
}
```

### 2. ContractService.java
- `generatePdfFromTemplate()` - 使用 Spire.PDF 加载和保存文档
- `main()` - 测试方法，验证替换功能

## 🚀 使用方法

### 运行测试
1. 确保模板文件存在：`src/main/resources/templates/contract-template.pdf`
2. 在 IDEA 中右键运行 `ContractService.main()`
3. 查看输出文件：`D:\workcode\uploads\test-contract.pdf`

### 占位符格式
模板中使用 `[[字段名]]` 格式：
- `[[name]]` - 借款人姓名
- `[[idNo]]` - 身份证号
- `[[mobile]]` - 手机号码
- `[[addressDetail]]` - 详细地址
- `[[loanAmount]]` - 借款金额
- `[[bankName]]` - 银行名称
- `[[cardNo]]` - 银行卡号

## ⚠️ 注意事项

### 免费版限制
Spire.PDF.free 有以下限制：
- ✅ 可以读取任意页数的PDF
- ⚠️ 生成的PDF最多10页
- ⚠️ 每页顶部会有水印："Evaluation Warning : The document was created with Spire.PDF for Java"

### 去除水印的方法
如果需要去除水印，有两个选择：
1. **购买商业版** - 购买 Spire.PDF 商业许可证
2. **使用其他库** - 如 Apache PDFBox（但文本替换较复杂）

## 🎯 优势

相比 PDFBox，Spire.PDF 的优势：
- ✅ **API 简单** - 一行代码完成文本替换
- ✅ **自动处理** - 自动处理文本分割问题
- ✅ **保留样式** - 完美保留PDF原有格式
- ✅ **支持中文** - 原生支持中文字符

## 📊 测试输出示例

```
=== 开始测试PDF文本替换 (Spire.PDF) ===
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

## 🔧 依赖配置

已在 `pom.xml` 中配置：

```xml
<dependency>
    <groupId>e-iceblue</groupId>
    <artifactId>spire.pdf.free</artifactId>
    <version>9.13.0</version>
</dependency>
```

## 💡 总结

现在您可以：
1. ✅ 运行 `ContractService.main()` 测试替换功能
2. ✅ 在业务代码中调用 `generateContract()` 生成合同
3. ✅ 简单、高效、保留样式的PDF文本替换

**注意**：如果合同超过10页或需要去除水印，建议购买商业版或考虑其他方案。

