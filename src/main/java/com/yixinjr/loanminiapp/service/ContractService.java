package com.yixinjr.loanminiapp.service;

import com.yixinjr.loanminiapp.entity.Order;
import com.yixinjr.loanminiapp.entity.OrderBankCard;
import com.yixinjr.loanminiapp.entity.OrderBorrower;
import com.yixinjr.loanminiapp.entity.OrderGuarantor;
import com.yixinjr.loanminiapp.entity.OrderLoanInfo;
import com.google.common.collect.Maps;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import com.spire.pdf.PdfDocument;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.net.URL;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;

/**
 * 合同生成服务
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ContractService {

    @Value("${file.upload-path:uploads}")
    private String uploadPath;

    @Value("${server.base-url:}")
    private String serverBaseUrl;

    private static final DateTimeFormatter TS = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");
    /**
     * 合同里常见的“下划线填空”字符：
     * - 使用全角下划线（U+FF3F）在中文合同里更美观，且宽度更接近中文字符
     */
    private static final char UNDERLINE_CHAR = '＿';

    /**
     * 生成合同PDF文件
     * 
     * @param order    订单信息
     * @param borrower 借款人信息
     * @param loanInfo 借款信息
     * @param bankCard 银行卡信息（第一个银行卡）
     * @return 合同文件相对路径
     */
    public String generateContract(Order order, OrderBorrower borrower, OrderLoanInfo loanInfo,
                                   OrderBankCard bankCard, OrderGuarantor guarantor)
            throws IOException {
        // 构建合同数据
        Map<String, String> contractData = buildContractData(order, borrower, loanInfo, bankCard, guarantor);

        // 合同文件名：合同-{订单ID}-{时间戳}.pdf
        String fileName = "contract-" + order.getId() + "-" + LocalDateTime.now().format(TS) + ".pdf";

        // 保存到订单目录
        Path orderDir = resolveUploadRoot().resolve(String.valueOf(order.getId()));
        if (!Files.exists(orderDir)) {
            Files.createDirectories(orderDir);
        }

        Path contractFile = orderDir.resolve(fileName);

        // 1. 加载PDF模板
        // 2. 替换占位符
        // 3. 保存为新PDF文件
        generatePdfFromTemplate(contractFile, contractData);

        log.info("合同生成成功: orderId={}, fileName={}", order.getId(), fileName);

        // 返回相对路径
        return order.getId() + "/" + fileName;
    }

    /**
     * 构建合同数据（用于替换模板中的占位符）
     */
    private Map<String, String> buildContractData(Order order, OrderBorrower borrower, OrderLoanInfo loanInfo,
                                                  OrderBankCard bankCard, OrderGuarantor guarantor) {
        Map<String, String> data = new HashMap<>();
        LocalDateTime now = LocalDateTime.now();

        // 借款人信息
        if (borrower != null) {
            data.put("name", borrower.getName() != null ? borrower.getName() : "");
            data.put("idNo", borrower.getIdNo() != null ? borrower.getIdNo() : "");
            data.put("addressDetail", borrower.getAddressDetail() != null ? borrower.getAddressDetail() : "");
            data.put("mobile", borrower.getMobile() != null ? borrower.getMobile() : "");
            data.put("address", (borrower.getProvinceCity() != null ? borrower.getProvinceCity() : "")
                    + (borrower.getAddressDetail() != null ? borrower.getAddressDetail() : ""));
            data.put("email", ""); // 邮箱字段，如需要可从borrower扩展
        }

        // 银行卡信息
        if (bankCard != null) {
            data.put("accounName", bankCard.getAccountName() != null ? bankCard.getAccountName() : "");
            data.put("bankName", bankCard.getBankName() != null ? bankCard.getBankName() : "");
            data.put("cardNo", bankCard.getCardNo() != null ? bankCard.getCardNo() : "");
        } else {
            data.put("accounName", "");
            data.put("bankName", "");
            data.put("cardNo", "");
        }

        // 借款信息
        data.put("loanAmount", order.getLoanAmount() != null ? order.getLoanAmount().toString() : "0.00");
        data.put("loanAmountUppercase",
                loanInfo != null && loanInfo.getLoanAmountUppercase() != null ? loanInfo.getLoanAmountUppercase() : "");
        data.put("usageDesc", loanInfo != null && loanInfo.getUsageDesc() != null ? loanInfo.getUsageDesc() : "");
        data.put("repayMode", loanInfo != null && loanInfo.getRepayMode() != null ? loanInfo.getRepayMode() : "");
        data.put("disputeWay", loanInfo != null && loanInfo.getDisputeWay() != null ? loanInfo.getDisputeWay() : "");
        data.put("arbitrationOrg",
                loanInfo != null && loanInfo.getArbitrationOrg() != null ? loanInfo.getArbitrationOrg() : "");
        data.put("signPlace", loanInfo != null && loanInfo.getSignPlace() != null ? loanInfo.getSignPlace() : "");

        // 日期处理
        if (loanInfo != null && loanInfo.getStartDate() != null) {
            java.time.LocalDate startDate = loanInfo.getStartDate();
            data.put("startDateYear", String.valueOf(startDate.getYear()));
            data.put("startDateMonth", String.valueOf(startDate.getMonthValue()));
            data.put("startDateDay", String.valueOf(startDate.getDayOfMonth()));
        } else {
            data.put("startDateYear", "");
            data.put("startDateMonth", "");
            data.put("startDateDay", "");
        }

        if (loanInfo != null && loanInfo.getEndDate() != null) {
            java.time.LocalDate endDate = loanInfo.getEndDate();
            data.put("endDateYear", String.valueOf(endDate.getYear()));
            data.put("endDateMonth", String.valueOf(endDate.getMonthValue()));
            data.put("endDateDay", String.valueOf(endDate.getDayOfMonth()));
        } else {
            data.put("endDateYear", "");
            data.put("endDateMonth", "");
            data.put("endDateDay", "");
        }

        // 当前日期
        data.put("nowYear", String.valueOf(now.getYear()));
        data.put("nowMonth", String.valueOf(now.getMonthValue()));
        data.put("nowDay", String.valueOf(now.getDayOfMonth()));

        /* 担保人类型：personal-个人，company-对公，property-房产 */
        String guarantorType = "";
        String guarantorName = "";
        String otherGuarantorType = "";
        String propertyGuarantorName = "";
        String propertyCode = "";
        String propertyAddress = "";

        if (guarantor != null) {
            if (StringUtils.equals("personal", guarantor.getBorrowerType())) {
                guarantorType = "贰";
                guarantorName = guarantor.getName();
            } else if (StringUtils.equals("company", guarantor.getBorrowerType())) {
                guarantorType = "叁";
                otherGuarantorType = "公司担保";
            } else if (StringUtils.equals("property", guarantor.getBorrowerType())) {
                guarantorType = "壹";
                propertyGuarantorName = guarantor.getName();
                propertyCode = guarantor.getCompanyCreditCode();
                propertyAddress = guarantor.getCompanyArea() + guarantor.getCompanyAddress();
            } else {
                guarantorType = "肆";
            }
        } else {
            // 担保方式，默认"肆. 无担保"，可根据需要调整
            guarantorType = "肆";
        }

        data.put("guarantorType", guarantorType);
        data.put("guarantorName", guarantorName);
        data.put("otherGuarantorType", otherGuarantorType);
        data.put("propertyGuarantorName", propertyGuarantorName);
        data.put("propertyCode", propertyCode);
        data.put("propertyAddress", propertyAddress);

        // 其他字段
        data.put("otherAgreedMatters", "");
        data.put("orderNo", order.getOrderNo());

        // 让“填空”更美观：对少数字段按固定长度补齐下划线，避免右侧留白过大
//        applyUnderlineFillForContract(data);

        return data;
    }

    /**
     * 合同里部分字段通常配有“下划线填空”，但纯文本替换后会显得右侧留白太多。
     * 这里用“值 + 若干下划线”的方式补齐到一个大致的视觉长度（不依赖PDF字体度量）。
     */
    private void applyUnderlineFillForContract(Map<String, String> data) {
        // 签订地一般 6-12 个字足够
        data.computeIfPresent("signPlace", (k, v) -> padRightWithUnderline(v, 12));
        // 其他约定事项通常一整行，给一个较长的“填空”长度
        data.computeIfPresent("otherAgreedMatters", (k, v) -> padRightWithUnderline(v, 30));
        data.computeIfPresent("desc", (k, v) -> padRightWithUnderline(v, 30));

        // 日期类字段：如果模板里是“下划线填空”，替换后可能会显得空白太多（或原下划线样式丢失）
        data.computeIfPresent("nowYear", (k, v) -> padRightWithUnderline(v, 6));
        data.computeIfPresent("nowMonth", (k, v) -> padRightWithUnderline(v, 2));
        data.computeIfPresent("nowDay", (k, v) -> padRightWithUnderline(v, 2));
    }

    private String padRightWithUnderline(String value, int totalChars) {
        String safe = value == null ? "" : value.trim();
        int len = safe.codePointCount(0, safe.length());
        if (len >= totalChars) {
            return safe;
        }
        StringBuilder sb = new StringBuilder(safe);
        for (int i = len; i < totalChars; i++) {
            sb.append(UNDERLINE_CHAR);
        }
        return sb.toString();
    }

    /**
     * 根据相对路径（如 orderId/contract-xxx.pdf）解析本地文件，供电子签上传等使用。
     */
    public Path resolveUploadedFilePath(String relativePath) {
        if (relativePath == null || relativePath.isEmpty()) {
            return null;
        }
        return resolveUploadRoot().resolve(relativePath);
    }

    /**
     * 解析上传根目录
     */
    private Path resolveUploadRoot() {
        Path root = Paths.get(uploadPath);
        if (!root.isAbsolute()) {
            // 相对路径：相对于工作目录
            root = Paths.get(System.getProperty("user.dir"), uploadPath);
        }
        return root;
    }

    /**
     * 构建合同文件URL
     */
    public String buildContractUrl(String relativePath) {
        if (serverBaseUrl.isEmpty()) {
            return "/uploads/" + relativePath;
        }
        return serverBaseUrl + "/uploads/" + relativePath;
    }

    /**
     * 将电子签平台返回的已签文件下载到本地订单目录，并返回相对路径。
     */
    public String saveSignedContractFromUrl(Long orderId, String downloadUrl) throws IOException {
        if (orderId == null) {
            throw new IllegalArgumentException("orderId 不能为空");
        }
        if (StringUtils.isBlank(downloadUrl)) {
            throw new IllegalArgumentException("downloadUrl 不能为空");
        }

        String fileName = "contract-" + orderId + "-" + LocalDateTime.now().format(TS) + "-signed.pdf";
        Path orderDir = resolveUploadRoot().resolve(String.valueOf(orderId));
        if (!Files.exists(orderDir)) {
            Files.createDirectories(orderDir);
        }
        Path target = orderDir.resolve(fileName);

        URL url = new URL(downloadUrl);
        try (InputStream in = url.openStream()) {
            Files.copy(in, target, StandardCopyOption.REPLACE_EXISTING);
        }
        log.info("已签合同下载成功: orderId={}, file={}", orderId, target);
        return orderId + "/" + fileName;
    }

    /**
     * 删除合同文件
     */
    public void deleteContractFile(String pdfUrl) {
        try {
            // 从URL中提取相对路径
            String relativePath = pdfUrl;
            if (pdfUrl.contains("/uploads/")) {
                relativePath = pdfUrl.substring(pdfUrl.indexOf("/uploads/") + "/uploads/".length());
            } else if (pdfUrl.startsWith("uploads/")) {
                relativePath = pdfUrl.substring("uploads/".length());
            }

            Path filePath = resolveUploadRoot().resolve(relativePath);
            if (Files.exists(filePath)) {
                Files.delete(filePath);
                log.info("合同文件删除成功: {}", filePath);
            } else {
                log.warn("合同文件不存在: {}", filePath);
            }
        } catch (IOException e) {
            log.error("删除合同文件失败: {}", pdfUrl, e);
        }
    }

    /**
     * 从PDF模板生成合同PDF文件（替换占位符）
     * 使用 Spire.PDF 的文本替换方式
     */
    private void generatePdfFromTemplate(Path contractFile, Map<String, String> contractData) throws IOException {
        // 加载PDF模板
        ClassPathResource templateResource = new ClassPathResource("templates/contract-template.pdf");
        if (!templateResource.exists()) {
            throw new IOException("合同模板文件不存在: templates/contract-template.pdf");
        }

        // 使用 Spire.PDF 加载文档
        PdfDocument document = new PdfDocument();
        document.loadFromStream(templateResource.getInputStream());
        
        try {
            // 使用文本替换工具
            PdfTextUtil replacer = new PdfTextUtil(document);
            
            contractData.forEach((k, v) -> {
                replacer.replaceText(k, v);
            });
            
            // 保存文件
            document.saveToFile(contractFile.toString());

            log.info("=== 替换完成 ===");
            log.info("输出文件: {}", contractFile.toString());

        } finally {
            document.close();
        }
    }

    /**
     * 测试方法：生成合同PDF (使用 Spire.PDF)
     */
    public static void main(String[] args) throws Exception {
        System.out.println("=== 开始测试PDF文本替换 (Spire.PDF) ===");
        
        // 准备测试数据
        Map<String, String> contractData = Maps.newHashMap();
        contractData.put("name", "张三");
        // contractData.put("idNo", "110101199001011234");
        // contractData.put("addressDetail", "北京市朝阳区某某街道123号");
        // contractData.put("mobile", "13800138000");
        // contractData.put("loanAmount", "100000.00");
        // contractData.put("bankName", "中国工商银行");
        // contractData.put("cardNo", "6222021234567890");

        // 输出文件
        File contractFile = new File("D:\\workcode\\uploads\\1\\contract-1-20260127100000.pdf");
        if (contractFile.getParentFile() != null && !contractFile.getParentFile().exists()) {
            contractFile.getParentFile().mkdirs();
        }
        if (contractFile.exists()) {
            contractFile.delete();
        }

        // 加载模板
        ClassPathResource templateResource = new ClassPathResource("templates/contract-template.pdf");
        if (!templateResource.exists()) {
            System.out.println("模板文件不存在: templates/contract-template.pdf");
            return;
        }

        // 执行替换
        PdfDocument document = new PdfDocument();
        document.loadFromStream(templateResource.getInputStream());
        
        try {
            PdfTextUtil replacer = new PdfTextUtil(document);
            
            contractData.forEach((k, v) -> {
                replacer.replaceText(k, v);
            });
            
            // 保存文件
            document.saveToFile(contractFile.getAbsolutePath());
            System.out.println("=== 替换完成 ===");
            System.out.println("输出文件: " + contractFile.getAbsolutePath());
            
        } catch (Exception e) {
            log.error("PDF生成失败: " + e.getMessage());
        } finally {
            document.close();
        }
    }

}
