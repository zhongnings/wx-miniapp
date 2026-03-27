package com.example.loanminiapp.controller;

import com.example.loanminiapp.service.WeChatService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;
import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 通用上传接口
 * - 支持通用上传（原有逻辑）
 * - 支持身份证图片上传（按身份证ID创建文件夹，按类型命名）
 */
@Slf4j
@RestController
@RequestMapping("/public")
public class UploadController {

    private final WeChatService weChatService;

    public UploadController(WeChatService weChatService) {
        this.weChatService = weChatService;
    }

    private static final DateTimeFormatter TS = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");

    /**
     * 上传根目录（文件系统路径），来自配置 file.upload-path
     * 示例：/uploads 或 D:/data/miniapp/uploads
     */
    @Value("${file.upload-path:uploads}")
    private String uploadPath;

    /**
     * 服务器地址（用于返回完整URL），来自配置 server.base-url
     * 示例：http://localhost:8080 或 https://api.example.com
     */
    @Value("${server.base-url:}")
    private String serverBaseUrl;

    /**
     * 最大文件大小（字节），来自配置 file.max-file-size
     */
    @Value("${file.max-file-size:10485760}")
    private long maxFileSize;

    /**
     * 允许的文件类型（扩展名，逗号分隔），来自配置 file.allowed-types
     */
    @Value("${file.allowed-types:jpg,jpeg,png,gif,pdf,docx}")
    private String allowedTypes;

    /**
     * 通用上传接口（保持向后兼容）
     * @param file 文件
     * @param bizType 业务类型（可选）
     * @param orderId 订单ID（推荐，用于订单文件上传：身份证、银行卡、合同等）
     * @param idNumber 身份证号（可选，兼容旧逻辑，不再作为目录主键）
     * @param imageType 图片类型（可选）：idFront（身份证正面）、idBack（身份证反面）、bankCard（银行卡）、contract（合同）、notaryDoc（法人证明书）、attachment（附件）等
     * @param enableOcr 是否启用OCR（可选，默认根据imageType和文件类型自动判断）
     */
    @PostMapping("/upload")
    public ResponseEntity<Map<String, Object>> upload(@RequestParam("file") MultipartFile file,
                                                      @RequestParam(value = "bizType", required = false) String bizType,
                                                      @RequestParam(value = "orderId", required = false) Long orderId,
                                                      @RequestParam(value = "idNumber", required = false) String idNumber,
                                                      @RequestParam(value = "imageType", required = false) String imageType,
                                                      @RequestParam(value = "enableOcr", required = false) String enableOcrStr) {
        // 微信小程序的 wx.uploadFile 会将 formData 中的值转换为字符串
        // 因此需要手动将字符串转换为布尔值
        Boolean enableOcr = null;
        if (enableOcrStr != null && !enableOcrStr.trim().isEmpty()) {
            enableOcr = "true".equalsIgnoreCase(enableOcrStr.trim());
        }
        if (file == null || file.isEmpty()) {
            Map<String, Object> error = new HashMap<>();
            error.put("message", "文件为空");
            return ResponseEntity.badRequest().body(error);
        }
        
        String originalName = file.getOriginalFilename();
        String ext = StringUtils.getFilenameExtension(originalName);

        // 校验文件类型
        List<String> allowList = Arrays.asList(allowedTypes.toLowerCase().split(","));
        if (ext == null || !allowList.contains(ext.toLowerCase())) {
            Map<String, Object> error = new HashMap<>();
            error.put("message", "不支持的文件类型: " + ext);
            return ResponseEntity.badRequest().body(error);
        }

        // 校验文件大小
        if (file.getSize() > maxFileSize) {
            Map<String, Object> error = new HashMap<>();
            error.put("message", "文件大小超过限制: 最大 " + (maxFileSize / (1024 * 1024)) + "MB");
            return ResponseEntity.badRequest().body(error);
        }

        // 统一上传逻辑：如果有 orderId，都放在订单目录下；否则放在根目录（向后兼容）
        // 如果有 orderId 和 imageType，使用订单文件上传逻辑（支持OCR）
        if (orderId != null && imageType != null) {
            return uploadOrderFile(file, orderId, idNumber, imageType, ext, enableOcr);
        }

        // 通用上传逻辑（如果有 orderId，也放在订单目录下；否则放在根目录）
        String time = LocalDateTime.now().format(TS);
        String fileName = (bizType == null ? "file" : bizType) + "-" + time + (ext != null ? ("." + ext) : "");

        // 统一使用 saveFileToOrderDir 方法保存文件
        try {
            String relativePath = saveFileToOrderDir(file, orderId, fileName);
            String url = buildFileUrl(relativePath);

            Map<String, Object> resp = new HashMap<>();
            resp.put("url", url);
            resp.put("name", fileName);
            resp.put("originalName", originalName);
            resp.put("size", file.getSize());
            if (orderId != null) {
                resp.put("orderId", orderId);
            }
            return ResponseEntity.ok(resp);
        } catch (IOException e) {
            log.error("保存上传文件失败", e);
            Map<String, Object> error = new HashMap<>();
            error.put("message", "文件保存失败: " + e.getMessage());
            return ResponseEntity.internalServerError().body(error);
        }
    }

    /**
     * 订单文件上传专用方法（身份证、银行卡、合同、法人证明书等）
     * 支持自动OCR识别（仅对身份证图片，且文件为图片格式）
     * @param file 文件
     * @param orderId 订单ID（作为文件夹名）
     * @param idNumber 身份证号（可选，仅用于日志记录或后续处理）
     * @param imageType 文件类型：idFront（身份证正面）、idBack（身份证反面）、bankCard（银行卡）、contract（合同）、notaryDoc（法人证明书）、attachment（附件）等
     * @param ext 文件扩展名
     * @param enableOcr 是否启用OCR（可选，默认根据imageType和文件类型自动判断）
     */
    private ResponseEntity<Map<String, Object>> uploadOrderFile(MultipartFile file,
                                                                Long orderId,
                                                                String idNumber,
                                                                String imageType,
                                                                String ext,
                                                                Boolean enableOcr) {
        // 构建文件名：idFront.***、idBack.***、bankCard.***、contract.*** 等
        String fileName = imageType + (ext != null ? ("." + ext) : "");

        try {
            // 统一使用 saveFileToOrderDir 方法保存文件
            String relativePath = saveFileToOrderDir(file, orderId, fileName);
            String url = buildFileUrl(relativePath);

            log.info("订单文件上传成功: orderId={}, idNumber={}, imageType={}, fileName={}",
                    orderId, idNumber, imageType, fileName);

            Map<String, Object> resp = new HashMap<>();
            resp.put("url", url);
            resp.put("name", fileName);
            resp.put("originalName", file.getOriginalFilename());
            resp.put("size", file.getSize());
            resp.put("orderId", orderId);
            resp.put("idNumber", idNumber);
            resp.put("imageType", imageType);

            // 判断是否需要OCR识别
            boolean needOcr = shouldPerformOcr(imageType, ext, enableOcr);
            
            if (needOcr) {
                try {
                    // 读取已保存的文件并转换为base64
                    /*Path root = resolveUploadRoot();
                    Path targetFile = orderId != null 
                        ? root.resolve(String.valueOf(orderId)).resolve(fileName)
                        : root.resolve(fileName);
                    byte[] fileBytes = Files.readAllBytes(targetFile);
                    String imageBase64 = Base64.getEncoder().encodeToString(fileBytes);*/
                    
                    // 转换side：idFront -> front（人像面），idBack -> back（国徽面）
                    // 微信OCR定义：front=人像面（姓名、身份证号、地址），back=国徽面（有效期）
                    String side = "idFront".equals(imageType) ? "front" : "back";
                    
                    log.info("开始OCR识别: orderId={}, imageType={}, side={}, ext={}", orderId, imageType, side, ext);
                    Map<String, Object> ocrResult = weChatService.ocrIdCard(url, side);
                    
                    resp.put("ocr", ocrResult);
                    resp.put("ocrSuccess", true);
                    log.info("OCR识别成功: orderId={}, imageType={}", orderId, imageType);
                } catch (Exception e) {
                    // OCR失败不影响文件上传，只记录日志
                    log.warn("OCR识别失败，但文件已上传成功: orderId={}, imageType={}, ext={}, error={}",
                            orderId, imageType, ext, e.getMessage());
                    resp.put("ocrSuccess", false);
                    resp.put("ocrError", e.getMessage());
                }
            } else {
                log.debug("跳过OCR识别: orderId={}, imageType={}, ext={}, enableOcr={}",
                        orderId, imageType, ext, enableOcr);
            }

            return ResponseEntity.ok(resp);

        } catch (IOException e) {
            log.error("保存订单文件失败: orderId={}, imageType={}", orderId, imageType, e);
            Map<String, Object> error = new HashMap<>();
            error.put("message", "文件保存失败: " + e.getMessage());
            return ResponseEntity.internalServerError().body(error);
        }
    }

    /**
     * 统一文件保存方法：保存文件到订单目录或根目录
     * @param file 文件
     * @param orderId 订单ID（如果为 null，保存到根目录；否则保存到订单目录）
     * @param fileName 文件名
     * @return 相对路径（用于构建URL），格式：orderId/fileName 或 fileName
     * @throws IOException 文件保存失败
     */
    private String saveFileToOrderDir(MultipartFile file, Long orderId, String fileName) throws IOException {
        Path root = resolveUploadRoot();
        Path targetDir;
        String relativePath;

        if (orderId != null) {
            // 有订单ID：保存到订单目录 uploads/{orderId}/
            targetDir = root.resolve(String.valueOf(orderId));
            relativePath = orderId + "/" + fileName;
        } else {
            // 无订单ID：保存到根目录 uploads/（向后兼容）
            targetDir = root;
            relativePath = fileName;
        }

        // 确保目录存在
        if (!Files.exists(targetDir)) {
            Files.createDirectories(targetDir);
            log.info("创建目录: {}", targetDir);
        }

        // 构建完整文件路径
        Path targetFile = targetDir.resolve(fileName);

        // 如果文件已存在，覆盖（先删除旧文件）
        if (Files.exists(targetFile)) {
            Files.delete(targetFile);
            log.info("覆盖已存在的文件: {}", targetFile);
        }

        // 保存文件
        Files.copy(file.getInputStream(), targetFile);
        log.info("文件保存成功: relativePath={}, orderId={}", relativePath, orderId);

        return relativePath;
    }

    /**
     * 构建文件访问URL
     * 格式：服务器地址 + uploads + 相对路径
     * 例如：http://localhost:8080/uploads/123456789012345678/idFront.jpg
     */
    private String buildFileUrl(String relativePath) {
        // 确保 relativePath 不以 / 开头
        if (relativePath.startsWith("/")) {
            relativePath = relativePath.substring(1);
        }

        // 如果有配置服务器地址，使用配置的地址；否则使用相对路径
        if (serverBaseUrl != null && !serverBaseUrl.trim().isEmpty()) {
            String baseUrl = serverBaseUrl.endsWith("/") ? serverBaseUrl.substring(0, serverBaseUrl.length() - 1)
                    : serverBaseUrl;
            return baseUrl + "/uploads/" + relativePath;
        } else {
            // 返回相对路径，前端会自动拼接当前域名
            return "/uploads/" + relativePath;
        }
    }

    /**
     * 判断是否需要执行OCR识别
     * 规则：
     * 1. 如果 enableOcr 明确指定为 false，不进行OCR
     * 2. 如果 enableOcr 明确指定为 true，且是图片格式，进行OCR
     * 3. 如果 enableOcr 为 null（未指定），则根据 imageType 和文件扩展名自动判断：
     *    - imageType 为 idFront 或 idBack，且文件是图片格式（jpg/jpeg/png），进行OCR
     *    - 其他情况不进行OCR
     * 
     * @param imageType 文件类型
     * @param ext 文件扩展名
     * @param enableOcr 是否启用OCR（可选）
     * @return 是否需要OCR
     */
    private boolean shouldPerformOcr(String imageType, String ext, Boolean enableOcr) {
        // 如果明确指定不启用OCR，直接返回false
        if (enableOcr != null && !enableOcr) {
            return false;
        }
        
        // 如果明确指定启用OCR，检查文件是否为图片格式
        if (enableOcr != null && enableOcr) {
            return isImageFile(ext);
        }
        
        // 如果未指定 enableOcr，根据 imageType 和文件类型自动判断
        // 只有身份证图片（idFront/idBack）且是图片格式才进行OCR
        boolean isIdCardImage = "idFront".equals(imageType) || "idBack".equals(imageType);
        boolean isImage = isImageFile(ext);
        
        return isIdCardImage && isImage;
    }
    
    /**
     * 判断文件是否为图片格式
     * @param ext 文件扩展名
     * @return 是否为图片
     */
    private boolean isImageFile(String ext) {
        if (ext == null) {
            return false;
        }
        String extLower = ext.toLowerCase();
        return extLower.equals("jpg") || extLower.equals("jpeg") || 
               extLower.equals("png") || extLower.equals("gif") || 
               extLower.equals("bmp") || extLower.equals("webp");
    }

    /**
     * 解析上传根目录到文件系统路径（兼容 Windows 和 Linux）
     * - Windows: D:/data/uploads 或 D:\\data\\uploads
     * - Linux: /data/uploads 或 uploads（相对路径）
     */
    private Path resolveUploadRoot() {
        String path = uploadPath;
        if (path == null || path.trim().isEmpty()) {
            path = "uploads";
        }

        // 处理路径分隔符，确保兼容 Windows 和 Linux
        // Paths.get() 会自动处理不同操作系统的路径分隔符
        if (path.startsWith("/") && !path.startsWith("//")) {
            // Linux 绝对路径：/uploads -> uploads（去掉前导 /，使用相对路径）
            // 或者保持绝对路径（如果确实需要）
            path = path.substring(1);
        }

        // 使用 Paths.get() 自动处理路径分隔符（Windows 使用 \，Linux 使用 /）
        Path rootPath = Paths.get(path);
        
        // 如果是相对路径，转换为绝对路径
        if (!rootPath.isAbsolute()) {
            rootPath = rootPath.toAbsolutePath();
        }

        return rootPath;
    }

    /**
     * 删除订单文件（根据文件名）
     * DELETE /public/orders/{orderId}/files/{fileName}
     * @param orderId 订单ID
     * @param fileName 文件名（URL编码）
     * @return 删除结果
     */
    @DeleteMapping("/orders/{orderId}/files/{fileName}")
    public ResponseEntity<Map<String, Object>> deleteOrderFile(@PathVariable Long orderId,
                                                                @PathVariable String fileName) {
        Map<String, Object> resp = new HashMap<>();
        
        try {
            // 解析上传根目录
            Path root = resolveUploadRoot();
            Path orderDir = root.resolve(String.valueOf(orderId));
            Path targetFile = orderDir.resolve(fileName);
            
            // 安全检查：确保文件在订单目录下（防止路径遍历攻击）
            if (!targetFile.normalize().startsWith(orderDir.normalize())) {
                log.warn("非法文件路径访问: orderId={}, fileName={}", orderId, fileName);
                resp.put("success", false);
                resp.put("message", "非法文件路径");
                return ResponseEntity.badRequest().body(resp);
            }
            
            // 检查文件是否存在
            if (!Files.exists(targetFile)) {
                log.warn("文件不存在: orderId={}, fileName={}, path={}", orderId, fileName, targetFile);
                resp.put("success", false);
                resp.put("message", "文件不存在");
                return ResponseEntity.ok(resp); // 返回200，但success=false
            }
            
            // 删除文件
            Files.delete(targetFile);
            log.info("文件删除成功: orderId={}, fileName={}, path={}", orderId, fileName, targetFile);
            
            resp.put("success", true);
            resp.put("message", "删除成功");
            return ResponseEntity.ok(resp);
            
        } catch (IOException e) {
            log.error("删除文件失败: orderId={}, fileName={}", orderId, fileName, e);
            resp.put("success", false);
            resp.put("message", "删除失败: " + e.getMessage());
            return ResponseEntity.internalServerError().body(resp);
        }
    }

    /**
     * 通用文件删除接口（根据完整URL地址删除文件）
     * DELETE /public/files/delete-by-url
     * 
     * 请求体示例：
     * {
     *   "url": "http://localhost:8081/uploads/1/coBorrower-idFront.png"
     * }
     * 
     * 支持的URL格式：
     * - 完整URL: http://localhost:8081/uploads/1/coBorrower-idFront.png
     * - 相对路径: /uploads/1/coBorrower-idFront.png
     * - 简化路径: uploads/1/coBorrower-idFront.png
     * 
     * @param requestBody 包含url字段的请求体
     * @return 删除结果
     */
    @DeleteMapping("/files/delete-by-url")
    public ResponseEntity<Map<String, Object>> deleteFileByUrl(@RequestBody Map<String, String> requestBody) {
        Map<String, Object> resp = new HashMap<>();
        
        String fileUrl = requestBody.get("url");
        if (fileUrl == null || fileUrl.trim().isEmpty()) {
            resp.put("success", false);
            resp.put("message", "文件URL不能为空");
            return ResponseEntity.badRequest().body(resp);
        }
        
        try {
            // 从URL中提取相对路径
            // 支持格式：
            // 1. http://localhost:8081/uploads/1/coBorrower-idFront.png -> 1/coBorrower-idFront.png
            // 2. /uploads/1/coBorrower-idFront.png -> 1/coBorrower-idFront.png
            // 3. uploads/1/coBorrower-idFront.png -> 1/coBorrower-idFront.png
            String relativePath = extractRelativePath(fileUrl);
            
            if (relativePath == null || relativePath.isEmpty()) {
                log.warn("无法从URL提取有效路径: url={}", fileUrl);
                resp.put("success", false);
                resp.put("message", "无效的文件URL");
                return ResponseEntity.badRequest().body(resp);
            }
            
            // 解析上传根目录
            Path root = resolveUploadRoot();
            Path targetFile = root.resolve(relativePath);
            
            // 安全检查：确保文件在上传根目录下（防止路径遍历攻击）
            if (!targetFile.normalize().startsWith(root.normalize())) {
                log.warn("非法文件路径访问: url={}, relativePath={}", fileUrl, relativePath);
                resp.put("success", false);
                resp.put("message", "非法文件路径");
                return ResponseEntity.badRequest().body(resp);
            }
            
            // 检查文件是否存在
            if (!Files.exists(targetFile)) {
                log.warn("文件不存在: url={}, relativePath={}, path={}", fileUrl, relativePath, targetFile);
                resp.put("success", false);
                resp.put("message", "文件不存在");
                return ResponseEntity.ok(resp); // 返回200，但success=false
            }
            
            // 删除文件
            Files.delete(targetFile);
            log.info("文件删除成功: url={}, relativePath={}, path={}", fileUrl, relativePath, targetFile);
            
            resp.put("success", true);
            resp.put("message", "删除成功");
            resp.put("deletedUrl", fileUrl);
            resp.put("deletedPath", relativePath);
            return ResponseEntity.ok(resp);
            
        } catch (IOException e) {
            log.error("删除文件失败: url={}", fileUrl, e);
            resp.put("success", false);
            resp.put("message", "删除失败: " + e.getMessage());
            return ResponseEntity.internalServerError().body(resp);
        }
    }

    /**
     * 从文件URL中提取相对路径
     * 
     * 支持的URL格式：
     * 1. http://localhost:8081/uploads/1/coBorrower-idFront.png -> 1/coBorrower-idFront.png
     * 2. /uploads/1/coBorrower-idFront.png -> 1/coBorrower-idFront.png
     * 3. uploads/1/coBorrower-idFront.png -> 1/coBorrower-idFront.png
     * 
     * @param fileUrl 文件URL
     * @return 相对路径（相对于上传根目录）
     */
    private String extractRelativePath(String fileUrl) {
        if (fileUrl == null || fileUrl.trim().isEmpty()) {
            return null;
        }
        
        String url = fileUrl.trim();
        
        // 1. 如果是完整URL（http://或https://），提取路径部分
        if (url.startsWith("http://") || url.startsWith("https://")) {
            // 找到第三个 / 的位置（协议://域名/路径）
            int firstSlash = url.indexOf("://");
            if (firstSlash != -1) {
                int pathStart = url.indexOf("/", firstSlash + 3);
                if (pathStart != -1) {
                    url = url.substring(pathStart); // 得到 /uploads/1/coBorrower-idFront.png
                } else {
                    return null; // 没有路径部分
                }
            }
        }
        
        // 2. 移除 /uploads/ 前缀（如果存在）
        if (url.startsWith("/uploads/")) {
            url = url.substring("/uploads/".length()); // 得到 1/coBorrower-idFront.png
        } else if (url.startsWith("uploads/")) {
            url = url.substring("uploads/".length()); // 得到 1/coBorrower-idFront.png
        }
        
        // 3. 移除前导 /（如果存在）
        if (url.startsWith("/")) {
            url = url.substring(1);
        }
        
        return url;
    }
}


