package com.yixinjr.loanminiapp.controller;

import com.yixinjr.loanminiapp.service.WeChatService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * 微信相关接口控制器
 */
@Slf4j
@RestController
@RequestMapping("/wechat")
@RequiredArgsConstructor
public class WeChatController {

    private final WeChatService weChatService;

    /**
     * 获取微信access_token
     */
    @GetMapping("/token")
    public ResponseEntity<TokenResponse> getToken() {
        try {
            String token = weChatService.getAccessToken();
            TokenResponse response = new TokenResponse();
            response.setAccessToken(token);
            response.setSuccess(true);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("获取微信token失败", e);
            TokenResponse response = new TokenResponse();
            response.setSuccess(false);
            response.setMessage("获取token失败: " + e.getMessage());
            return ResponseEntity.ok(response);
        }
    }

    /**
     * OCR身份证识别接口（传base64）
     * @param request 包含图片base64和身份证面（front/back）
     */
    @PostMapping("/ocr/idcard")
    public ResponseEntity<OcrResponse> ocrIdCard(@RequestBody OcrRequest request) {
        try {
            log.info("收到OCR识别请求, side: {}", request.getSide());
            
            // 调用微信OCR接口
            Map<String, Object> result = weChatService.ocrIdCard(request.getImage(), request.getSide());
            
            OcrResponse response = new OcrResponse();
            response.setSuccess(true);
            response.setCode(200);
            response.setMessage("识别成功");
            response.setData(result);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("OCR识别失败", e);
            OcrResponse response = new OcrResponse();
            response.setSuccess(false);
            response.setCode(500);
            response.setMessage("识别失败: " + e.getMessage());
            return ResponseEntity.ok(response);
        }
    }

    @Data
    public static class TokenResponse {
        private Boolean success;
        private String accessToken;
        private String message;
    }

    @Data
    public static class OcrRequest {
        private String image; // base64编码的图片
        private String side; // front（人像面）或 back（国徽面）
    }

    @Data
    public static class OcrResponse {
        private Boolean success;
        private Integer code;
        private String message;
        private Map<String, Object> data;
    }
}
