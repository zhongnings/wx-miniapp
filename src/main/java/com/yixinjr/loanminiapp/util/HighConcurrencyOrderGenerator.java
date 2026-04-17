package com.yixinjr.loanminiapp.util;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * 高并发场景下的订单号生成工具类
 */
public class HighConcurrencyOrderGenerator {
    private static final ThreadLocal<SimpleDateFormat> DATE_FORMATTER = ThreadLocal.withInitial(
            () -> new SimpleDateFormat("yyyyMMddHHmmss")
    );
    // 原子递增数，保证多线程下安全递增
    private static final AtomicInteger SEQUENCE = new AtomicInteger(0);
    // 递增数最大值（6位）
    private static final int MAX_SEQUENCE = 999999;

    /**
     * 生成高并发安全的订单号：14位时间 + 6位原子递增数
     * @return 18位唯一订单号
     */
    public static String generateUniqueOrderNumber() {
        // 1. 获取14位时间部分
        String timePart = DATE_FORMATTER.get().format(new Date());
        
        // 2. 获取6位递增数（用完重置）
        int currentSeq = SEQUENCE.getAndIncrement();
        // 超过最大值时重置为0，避免数字过长
        if (currentSeq > MAX_SEQUENCE) {
            synchronized (HighConcurrencyOrderGenerator.class) {
                if (SEQUENCE.get() > MAX_SEQUENCE) {
                    SEQUENCE.set(0);
                }
            }
            currentSeq = SEQUENCE.getAndIncrement();
        }
        String seqPart = String.format("%06d", currentSeq);
        
        return timePart + seqPart;
    }

    // 测试高并发场景
    public static void main(String[] args) throws InterruptedException {
        // 模拟100个线程同时生成订单号
        for (int i = 0; i < 100; i++) {
            new Thread(() -> {
                String orderNo = generateUniqueOrderNumber();
                System.out.println(Thread.currentThread().getName() + " -> " + orderNo);
            }).start();
        }
        // 等待所有线程执行完成
        Thread.sleep(2000);
    }
}
