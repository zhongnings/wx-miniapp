package com.yixinjr.loanminiapp.service;

import com.yixinjr.loanminiapp.util.HttpUtil;

import cn.hutool.core.util.URLUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;
import java.util.Objects;
import java.util.concurrent.TimeUnit;

import javax.xml.bind.ValidationException;

/**
 * 微信服务类
 * 用于获取微信access_token和调用微信OCR接口
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class WeChatService {

    private final HttpUtil httpUtil;
    private final StringRedisTemplate redisTemplate;

    @Value("${wechat.appid:}")
    private String appId;

    @Value("${wechat.secret:}")
    private String secret;

    private static final String WECHAT_TOKEN_KEY = "wechat:access_token";
    private static final String WECHAT_TOKEN_URL = "https://api.weixin.qq.com/cgi-bin/token";
    private static final String WECHAT_OCR_IDCARD_URL = "https://api.weixin.qq.com/cv/ocr/idcard?access_token=";

    /**
     * 获取微信access_token
     * 先从Redis获取，如果不存在或已过期，则重新获取
     */
    public String getAccessToken() {
        // 先从Redis获取
        String token = redisTemplate.opsForValue().get(WECHAT_TOKEN_KEY);
        if (token != null && !token.isEmpty()) {
            log.debug("从Redis获取微信access_token成功");
            return token;
        }

        // Redis中没有，重新获取
        log.info("从微信服务器获取access_token");
        Map<String, String> params = new HashMap<>();
        params.put("grant_type", "client_credential");
        params.put("appid", appId);
        params.put("secret", secret);

        try {
            // 微信API返回的是JSON格式，使用Map接收
            @SuppressWarnings("unchecked")
            Map<String, Object> response = (Map<String, Object>) httpUtil.get(WECHAT_TOKEN_URL, params, Map.class);
            
            if (response != null && response.containsKey("access_token")) {
                token = (String) response.get("access_token");
                // 存入Redis，有效期7200秒（微信token默认有效期）
                redisTemplate.opsForValue().set(WECHAT_TOKEN_KEY, token, 7200, TimeUnit.SECONDS);
                log.info("获取微信access_token成功，已存入Redis");
                return token;
            } else {
                log.error("获取微信access_token失败: {}", response);
                throw new RuntimeException("获取微信access_token失败: " + response.get("errmsg"));
            }
        } catch (Exception e) {
            log.error("获取微信access_token异常", e);
            throw new RuntimeException("获取微信access_token异常: " + e.getMessage(), e);
        }
    }

    /**
     * 调用微信OCR身份证识别接口
     * @param imageUrl 图片公网URL（而不是base64）
     * @param side 身份证面：front（人像面）或 back（国徽面）
     * @return OCR识别结果
     */
    public Map<String, Object> ocrIdCard(String imageUrl, String side) {
        String token = getAccessToken();
        String url = WECHAT_OCR_IDCARD_URL + token + "&img_url=" + URLUtil.encode(imageUrl);
        
        Map<String, String> params = new HashMap<>();
        // params.put("img_url", imageUrl);  // 改成 img_url，传公网URL

        try {
            log.info("调用微信OCR身份证识别接口, side: {}, imageUrl: {}", side, imageUrl);
            Map<String, Object> result = new HashMap<>();
            
            // 调用微信OCR接口
            Map<String, Object> response = httpUtil.postJson(url, params, Map.class);
            if (Objects.isNull(response.get("errcode")) || (Integer) response.get("errcode") != 0) {
                log.error("微信OCR识别失败: {}", response.get("errmsg"));
                throw new ValidationException("识别失败");
            }

            if (StringUtils.equals(side, "front")) {
                result.put("type", "Front");
                result.put("name", response.get("name"));
                result.put("id", response.get("id"));
                result.put("addr", response.get("addr"));
                result.put("gender", response.get("gender"));
            } else {
                result.put("type", "Back");
                result.put("valid_date", response.get("valid_date"));
            }

            log.info("微信OCR识别完成: side={}, result={}", side, result);
            return result;
        } catch (Exception e) {
            log.error("调用微信OCR接口异常", e);
            throw new RuntimeException("OCR识别失败: " + e.getMessage(), e);
        }
    }

}

