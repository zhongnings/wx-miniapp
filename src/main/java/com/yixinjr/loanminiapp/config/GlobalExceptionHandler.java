package com.yixinjr.loanminiapp.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;

/**
 * 全局异常处理
 * - RuntimeException：业务异常，返回错误信息给前端
 * - 其他异常：系统异常，返回通用提示
 */
@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    /**
     * 处理业务异常（RuntimeException）
     * 主动抛出的异常，将错误信息返回给前端
     */
    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, Object>> handleRuntimeException(RuntimeException ex) {
        log.warn("业务异常: {}", ex.getMessage());
        
        Map<String, Object> response = new HashMap<>();
        response.put("code", 400);
        response.put("message", ex.getMessage());
        
        return ResponseEntity.badRequest().body(response);
    }

    /**
     * 处理其他未捕获的异常
     * 系统异常，返回通用提示，不暴露具体错误
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleException(Exception ex) {
        log.error("系统异常", ex);
        
        Map<String, Object> response = new HashMap<>();
        response.put("code", 500);
        response.put("message", "系统开小差了，请稍后再试");
        
        return ResponseEntity.status(500).body(response);
    }
}

