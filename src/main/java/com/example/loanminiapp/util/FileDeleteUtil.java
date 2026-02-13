package com.example.loanminiapp.util;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

/**
 * 文件删除工具类
 * 用于根据文件URL删除对应的物理文件
 */
@Slf4j
@Component
public class FileDeleteUtil {

    /**
     * 上传根目录（文件系统路径），来自配置 file.upload-path
     */
    @Value("${file.upload-path:uploads}")
    private String uploadPath;

    /**
     * 根据文件URL删除物理文件
     * 
     * 支持的URL格式：
     * 1. http://localhost:8081/uploads/1/coBorrower-idFront.png
     * 2. /uploads/1/coBorrower-idFront.png
     * 3. uploads/1/coBorrower-idFront.png
     * 
     * @param fileUrl 文件URL
     * @return 是否删除成功
     */
    public boolean deleteFileByUrl(String fileUrl) {
        if (fileUrl == null || fileUrl.trim().isEmpty()) {
            log.warn("文件URL为空，跳过删除");
            return false;
        }

        try {
            // 从URL中提取相对路径
            String relativePath = extractRelativePath(fileUrl);
            
            if (relativePath == null || relativePath.isEmpty()) {
                log.warn("无法从URL提取有效路径: url={}", fileUrl);
                return false;
            }

            // 解析上传根目录
            Path root = resolveUploadRoot();
            Path targetFile = root.resolve(relativePath);

            // 安全检查：确保文件在上传根目录下（防止路径遍历攻击）
            if (!targetFile.normalize().startsWith(root.normalize())) {
                log.warn("非法文件路径访问: url={}, relativePath={}", fileUrl, relativePath);
                return false;
            }

            // 检查文件是否存在
            if (!Files.exists(targetFile)) {
                log.warn("文件不存在: url={}, relativePath={}, path={}", fileUrl, relativePath, targetFile);
                return false;
            }

            // 删除文件
            Files.delete(targetFile);
            log.info("文件删除成功: url={}, relativePath={}, path={}", fileUrl, relativePath, targetFile);
            
            return true;

        } catch (IOException e) {
            log.error("删除文件失败: url={}", fileUrl, e);
            return false;
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

    /**
     * 解析上传根目录到文件系统路径（兼容 Windows 和 Linux）
     */
    private Path resolveUploadRoot() {
        String path = uploadPath;
        if (path == null || path.trim().isEmpty()) {
            path = "uploads";
        }

        // 处理路径分隔符，确保兼容 Windows 和 Linux
        if (path.startsWith("/") && !path.startsWith("//")) {
            path = path.substring(1);
        }

        Path rootPath = Paths.get(path);

        // 如果是相对路径，转换为绝对路径
        if (!rootPath.isAbsolute()) {
            rootPath = rootPath.toAbsolutePath();
        }

        return rootPath;
    }
}

