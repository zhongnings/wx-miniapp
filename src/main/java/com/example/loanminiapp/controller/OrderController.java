package com.example.loanminiapp.controller;

import com.example.loanminiapp.entity.OrderLoanInfo;
import com.example.loanminiapp.model.ContractItem;
import com.example.loanminiapp.model.OrderDetail;
import com.example.loanminiapp.model.OrderProgressItem;
import com.example.loanminiapp.model.OrderSummary;
import com.example.loanminiapp.model.PageResult;
import com.example.loanminiapp.model.OrderTabStats;
import com.example.loanminiapp.security.OrderAccessCheck;
import com.example.loanminiapp.service.OrderLoanInfoService;
import com.example.loanminiapp.service.OrderService;
import com.example.loanminiapp.service.OrderStepService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/public/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;
    private final OrderLoanInfoService loanInfoService;
    private final OrderStepService orderStepService;

    /**
     * tab = manage | history
     * status = all | pending | reviewing | rejected | pending_loan | loaning | pending_transfer | signing | pending_face | completed
     */
    @GetMapping
    public ResponseEntity<PageResult<OrderSummary>> list(
            @RequestParam(defaultValue = "manage") String tab,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "10") Integer size) {
        return ResponseEntity.ok(orderService.listWithPage(tab, keyword, status, page, size));
    }

    /**
     * 订单管理 / 历史订单 数量统计
     * - 复用与列表相同的过滤条件（keyword、status、角色等）
     */
    @GetMapping("/stats")
    public ResponseEntity<OrderTabStats> stats(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String status) {
        return ResponseEntity.ok(orderService.tabStats(keyword, status));
    }

    @GetMapping("/{id}")
    public ResponseEntity<OrderDetail> detail(@PathVariable Long id) {
        return ResponseEntity.ok(orderService.detail(id));
    }

    @GetMapping("/{id}/progress")
    public ResponseEntity<List<OrderProgressItem>> progress(@PathVariable Long id) {
        return ResponseEntity.ok(orderService.progress(id));
    }

    @GetMapping("/{id}/contracts")
    public ResponseEntity<List<ContractItem>> contracts(@PathVariable Long id) {
        return ResponseEntity.ok(orderService.contracts(id));
    }

    // 银行卡接口已迁移到 OrderBankCardController，避免路由冲突
    // @GetMapping("/{id}/bankCards")
    // public ResponseEntity<List<OrderDetail.BankCardInfo>> bankCards(@PathVariable Long id) {
    //     return ResponseEntity.ok(orderService.getBankCards(id));
    // }

    // @GetMapping("/{id}/attachments")
    // public ResponseEntity<List<com.example.loanminiapp.model.AttachmentItem>> attachments(@PathVariable Long id) {
    //     return ResponseEntity.ok(orderService.getAttachments(id));
    // }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        orderService.delete(id);
        return ResponseEntity.ok().build();
    }

    /**
     * 提交订单
     */
    @PostMapping("/{id}/submit")
    public ResponseEntity<Void> submit(@PathVariable Long id) {
        orderService.submit(id);
        return ResponseEntity.ok().build();
    }

    /**
     * 驳回订单（删除合同，将状态改回待提交）
     */
    @PostMapping("/{id}/reject")
    public ResponseEntity<Void> reject(@PathVariable Long id) {
        orderService.reject(id);
        return ResponseEntity.ok().build();
    }

    /**
     * 获取合同签署二维码
     */
    @GetMapping("/{id}/contracts/qr-code")
    public ResponseEntity<Map<String, Object>> getContractQRCode(@PathVariable Long id) {
        // TODO: 生成真实的签署二维码
        // 这里返回一个占位的二维码URL，实际应该调用二维码生成服务
        Map<String, Object> result = new HashMap<>();
        try {
            String signUrl = "https://example.com/sign?orderId=" + id;
            String encodedUrl = java.net.URLEncoder.encode(signUrl, "UTF-8");
            result.put("qrCodeUrl", "https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=" + encodedUrl);
        } catch (Exception e) {
            result.put("qrCodeUrl", "https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=error");
        }
        return ResponseEntity.ok(result);
    }

}


