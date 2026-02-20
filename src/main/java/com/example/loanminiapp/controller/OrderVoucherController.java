package com.example.loanminiapp.controller;

import com.example.loanminiapp.model.PayeeInfo;
import com.example.loanminiapp.model.VoucherInfo;
import com.example.loanminiapp.security.CurrentUser;
import com.example.loanminiapp.security.CurrentUserContext;
import com.example.loanminiapp.service.OrderVoucherService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 制单信息控制器
 */
@Slf4j
@RestController
@RequestMapping("/public/orders/{orderId}/vouchers")
@RequiredArgsConstructor
public class OrderVoucherController {

    private final OrderVoucherService orderVoucherService;

    /**
     * 获取制单列表
     */
    @GetMapping
    public ResponseEntity<List<VoucherInfo>> list(@PathVariable Long orderId) {
        return ResponseEntity.ok(orderVoucherService.listByOrderId(orderId));
    }

    /**
     * 获取收款方列表
     */
    @GetMapping("/payees")
    public ResponseEntity<List<PayeeInfo>> getPayees(@PathVariable Long orderId) {
        return ResponseEntity.ok(orderVoucherService.getPayeeList(orderId));
    }

    /**
     * 获取制单限额信息
     */
    @GetMapping("/limit")
    public ResponseEntity<OrderVoucherService.VoucherLimitInfo> getLimitInfo(@PathVariable Long orderId) {
        return ResponseEntity.ok(orderVoucherService.getLimitInfo(orderId));
    }

    /**
     * 新增制单
     */
    @PostMapping
    public ResponseEntity<Void> add(@PathVariable Long orderId, @RequestBody VoucherInfo voucherInfo) {
        voucherInfo.setOrderId(orderId);
        orderVoucherService.addVoucher(voucherInfo);
        return ResponseEntity.ok().build();
    }

    /**
     * 删除制单
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long orderId, @PathVariable Long id) {
        orderVoucherService.deleteVoucher(id);
        return ResponseEntity.ok().build();
    }

    /**
     * 提交放款申请（需要权限：order:pay）
     */
    @PostMapping("/{voucherId}/apply")
    public ResponseEntity<Map<String, Object>> applyLoan(
            @PathVariable Long orderId,
            @PathVariable Long voucherId,
            @RequestBody Map<String, String> request) {
        
        try {
            // 权限校验
            CurrentUser currentUser = CurrentUserContext.get();
            if (currentUser == null || currentUser.getPermissions() == null) {
                log.warn("用户未登录或无权限信息");
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("code", 401);
                errorResponse.put("message", "未登录或登录已过期");
                return ResponseEntity.status(401).body(errorResponse);
            }

            if (!currentUser.getPermissions().contains("order:pay")) {
                log.warn("用户无放款权限: userId={}, permissions={}", 
                    currentUser.getUserId(), currentUser.getPermissions());
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("code", 403);
                errorResponse.put("message", "您没有放款权限，请联系管理员");
                return ResponseEntity.status(403).body(errorResponse);
            }

            String paymentPassword = request.get("paymentPassword");
            if (paymentPassword == null || paymentPassword.trim().isEmpty()) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("code", 400);
                errorResponse.put("message", "请输入支付密码");
                return ResponseEntity.badRequest().body(errorResponse);
            }

            log.info("用户申请放款: userId={}, orderId={}, voucherId={}", 
                currentUser.getUserId(), orderId, voucherId);

            // TODO: 实现放款申请逻辑
            // 1. 验证支付密码
            // 2. 更新制单状态
            // 3. 记录操作日志

            Map<String, Object> successResponse = new HashMap<>();
            successResponse.put("code", 200);
            successResponse.put("message", "放款申请提交成功");
            return ResponseEntity.ok(successResponse);
            
        } catch (Exception e) {
            log.error("放款申请失败: orderId={}, voucherId={}, error={}", 
                orderId, voucherId, e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("code", 500);
            errorResponse.put("message", "放款申请失败：" + e.getMessage());
            return ResponseEntity.status(500).body(errorResponse);
        }
    }
}

