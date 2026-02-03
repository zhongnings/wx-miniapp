package com.example.loanminiapp.util;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.concurrent.ThreadLocalRandom;

/**
 * 订单号生成工具类
 *
 * 规则示例：20251113135233588000
 *  - 前14位：时间戳 yyyyMMddHHmmss
 *  - 后5位：随机数，减少重复概率
 */
public class OrderNoGenerator {

    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");

    /**
     * 生成订单号（无前缀）
     */
    public static String generate() {
        return generate(null);
    }

    /**
     * 生成订单号（可选前缀）
     *
     * @param prefix 业务前缀，例如 "JDY"；为 null 或空串则不加前缀
     */
    public static String generate(String prefix) {
        String timePart = LocalDateTime.now().format(FORMATTER);
        int randomPart = ThreadLocalRandom.current().nextInt(10000, 99999);
        String core = timePart + randomPart;
        if (prefix == null || prefix.isEmpty()) {
            return core;
        }
        return prefix + core;
    }
}


