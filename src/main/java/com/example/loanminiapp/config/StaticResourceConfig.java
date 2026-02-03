package com.example.loanminiapp.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.io.File;

/**
 * 静态资源映射配置
 * 
 * 功能说明：
 * - 将 /uploads/** 路径映射到配置文件中的 file.upload-path 目录
 * - 用于访问上传的文件（图片、文档等）
 * 
 * 使用说明：
 * 1. 确保 application-dev.yml 或 application-prod.yml 中配置了 file.upload-path
 * 2. 确保该路径对应的目录存在且有读写权限
 * 3. 如果需要启用此配置，请取消下面的 @Configuration 注解注释
 * 4. 如果需要禁用此配置，可以注释掉 @Configuration 注解，或使用 @ConditionalOnProperty 控制
 * 
 * 示例配置（application-dev.yml）：
 * file:
 *   upload-path: D:/workcode/miniapp/uploads  # Windows路径
 *   # upload-path: /var/data/miniapp/uploads  # Linux路径
 *   # upload-path: /uploads  # 相对路径（相对于项目根目录）
 */
@Slf4j
@Configuration
public class StaticResourceConfig implements WebMvcConfigurer {

    /**
     * 文件上传路径，从配置文件读取
     * 默认值：/uploads
     */
    @Value("${file.upload-path:/uploads}")
    private String uploadPath;

    /**
     * 配置静态资源映射
     * 
     * 访问示例：
     * - 上传的文件保存在：D:/workcode/miniapp/uploads/file-20240101120000-abc12345.jpg
     * - 访问URL：http://localhost:8081/uploads/file-20240101120000-abc12345.jpg
     */
    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // 确保上传目录存在
        File uploadDir = new File(uploadPath);
        if (!uploadDir.exists()) {
            boolean created = uploadDir.mkdirs();
            if (created) {
                log.info("创建上传目录: {}", uploadPath);
            } else {
                log.warn("无法创建上传目录: {}", uploadPath);
            }
        }

        // 将 /uploads/** 映射到实际的上传目录
        // 注意：如果 uploadPath 是绝对路径，需要转换为 file: 协议
        String resourceLocation;
        if (uploadPath.startsWith("/") || uploadPath.matches("^[A-Za-z]:.*")) {
            // 绝对路径（Linux / 开头 或 Windows C: 开头）
            resourceLocation = "file:" + uploadPath + File.separator;
        } else {
            // 相对路径
            resourceLocation = "file:" + System.getProperty("user.dir") + File.separator + uploadPath + File.separator;
        }

        registry.addResourceHandler("/uploads/**")
                .addResourceLocations(resourceLocation)
                .setCachePeriod(3600); // 缓存1小时

        log.info("静态资源映射配置完成: /uploads/** -> {}", resourceLocation);
    }
}

