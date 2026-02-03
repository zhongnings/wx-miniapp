package com.example.loanminiapp.util;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.http.client.ClientHttpResponse;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.ResponseErrorHandler;
import org.springframework.web.client.RestTemplate;

import java.io.IOException;
import java.util.Map;

/**
 * HTTP请求工具类
 * 用于调用微信接口等外部API
 */
@Slf4j
@Component
public class HttpUtil {

    private static final int REQ_TIME_OUT = 30000; // 默认超时时间 30秒

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public HttpUtil() {
        this.objectMapper = new ObjectMapper();
        this.restTemplate = createRestTemplate();
    }

    /**
     * 创建配置了超时的 RestTemplate
     */
    private RestTemplate createRestTemplate() {
        RestTemplate restTemplate = new RestTemplate();
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(REQ_TIME_OUT); // 连接超时 30秒
        requestFactory.setReadTimeout(REQ_TIME_OUT); // 读取超时 30秒
        restTemplate.setRequestFactory(requestFactory);
        
        // 非200的HTTP响应码，关闭rest默认抛出的异常
        restTemplate.setErrorHandler(new ResponseErrorHandler() {
            @Override
            public boolean hasError(ClientHttpResponse response) throws IOException {
                return false; // 不将非200状态码视为错误
            }

            @Override
            public void handleError(ClientHttpResponse response) throws IOException {
                // 不处理错误，让调用方自行处理响应
            }
        });
        
        return restTemplate;
    }

    /**
     * GET请求
     */
    public <T> T get(String url, Class<T> responseType) {
        try {
            log.debug("HTTP GET请求: {}", url);
            ResponseEntity<T> response = restTemplate.getForEntity(url, responseType);
            log.debug("HTTP GET响应: {}", response.getStatusCode());
            return response.getBody();
        } catch (Exception e) {
            log.error("HTTP GET请求失败: {}", url, e);
            throw new RuntimeException("HTTP请求失败: " + e.getMessage(), e);
        }
    }

    /**
     * GET请求（带参数）
     */
    public <T> T get(String url, Map<String, String> params, Class<T> responseType) {
        try {
            StringBuilder urlBuilder = new StringBuilder(url);
            if (params != null && !params.isEmpty()) {
                urlBuilder.append("?");
                params.forEach((key, value) -> {
                    urlBuilder.append(key).append("=").append(value).append("&");
                });
                urlBuilder.deleteCharAt(urlBuilder.length() - 1);
            }
            String fullUrl = urlBuilder.toString();
            log.info("HTTP GET请求: {}", fullUrl);
            ResponseEntity<T> response = restTemplate.getForEntity(fullUrl, responseType);
            log.info("HTTP GET响应: {}", response.getStatusCode());
            return response.getBody();
        } catch (Exception e) {
            log.error("HTTP GET请求失败: {}", url, e);
            throw new RuntimeException("HTTP请求失败: " + e.getMessage(), e);
        }
    }

    /**
     * POST请求（JSON）
     */
    public <T> T postJson(String url, Object requestBody, Class<T> responseType) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Object> entity = new HttpEntity<>(requestBody, headers);
            
            log.debug("HTTP POST请求: {}, 请求体: {}", url, objectMapper.writeValueAsString(requestBody));
            ResponseEntity<T> response = restTemplate.postForEntity(url, entity, responseType);
            log.debug("HTTP POST响应: {}", response.getStatusCode());
            return response.getBody();
        } catch (Exception e) {
            log.error("HTTP POST请求失败: {}", url, e);
            throw new RuntimeException("HTTP请求失败: " + e.getMessage(), e);
        }
    }

    /**
     * POST请求（带自定义请求头）
     */
    public <T> T post(String url, Object requestBody, HttpHeaders headers, Class<T> responseType) {
        try {
            HttpEntity<Object> entity = new HttpEntity<>(requestBody, headers);
            
            log.debug("HTTP POST请求: {}", url);
            ResponseEntity<T> response = restTemplate.postForEntity(url, entity, responseType);
            log.debug("HTTP POST响应: {}", response.getStatusCode());
            return response.getBody();
        } catch (Exception e) {
            log.error("HTTP POST请求失败: {}", url, e);
            throw new RuntimeException("HTTP请求失败: " + e.getMessage(), e);
        }
    }

    /**
     * POST请求（表单）
     */
    public <T> T postForm(String url, Map<String, String> formData, Class<T> responseType) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
            
            StringBuilder body = new StringBuilder();
            if (formData != null && !formData.isEmpty()) {
                formData.forEach((key, value) -> {
                    body.append(key).append("=").append(value).append("&");
                });
                body.deleteCharAt(body.length() - 1);
            }
            
            HttpEntity<String> entity = new HttpEntity<>(body.toString(), headers);
            
            log.debug("HTTP POST表单请求: {}", url);
            ResponseEntity<T> response = restTemplate.postForEntity(url, entity, responseType);
            log.debug("HTTP POST响应: {}", response.getStatusCode());
            return response.getBody();
        } catch (Exception e) {
            log.error("HTTP POST表单请求失败: {}", url, e);
            throw new RuntimeException("HTTP请求失败: " + e.getMessage(), e);
        }
    }
}






