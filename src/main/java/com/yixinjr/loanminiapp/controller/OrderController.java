package com.yixinjr.loanminiapp.controller;

import com.yixinjr.loanminiapp.model.ContractItem;
import com.yixinjr.loanminiapp.model.OrderDetail;
import com.yixinjr.loanminiapp.model.OrderProgressItem;
import com.yixinjr.loanminiapp.model.OrderSummary;
import com.yixinjr.loanminiapp.model.PageResult;
import com.yixinjr.loanminiapp.model.OrderTabStats;
import com.yixinjr.loanminiapp.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
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

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        orderService.delete(id);
        return ResponseEntity.ok().build();
    }

    /**
     * 提交订单（异步处理）
     * 立即返回，后台异步生成合同
     */
    @PostMapping("/{id}/submit")
    public ResponseEntity<Map<String, Object>> submit(@PathVariable Long id) {
        orderService.submitAsync(id);
        Map<String, Object> result = new HashMap<>();
        result.put("message", "订单提交中，请稍候...");
        result.put("orderId", id);
        return ResponseEntity.ok(result);
    }
    
    /**
     * 查询订单提交状态
     * 前端轮询此接口检查提交是否完成
     */
    @GetMapping("/{id}/submit-status")
    public ResponseEntity<Map<String, Object>> getSubmitStatus(@PathVariable Long id) {
        Map<String, Object> status = orderService.getSubmitStatus(id);
        return ResponseEntity.ok(status);
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
     * 通过风控审核（将状态从风控审核中改为待放款）
     */
    @PostMapping("/{id}/approve")
    public ResponseEntity<Void> approve(@PathVariable Long id) {
        orderService.approve(id);
        return ResponseEntity.ok().build();
    }

    /**
     * 获取合同签署二维码（兼容旧版：取该订单下第一份合同）
     */
    @GetMapping("/{id}/contracts/qr-code")
    public ResponseEntity<Map<String, Object>> getContractQRCodeLegacy(@PathVariable Long id) {
        List<ContractItem> list = orderService.contracts(id);
        if (list == null || list.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(orderService.getContractSignQr(id, list.get(0).getId()));
    }

    /**
     * 按合同维度获取签署二维码（电子签平台：返回 signUrl + qrCodeUrl 图片地址）
     */
    @GetMapping("/{orderId}/contracts/{contractId}/qr-code")
    public ResponseEntity<Map<String, Object>> getContractQRCode(
            @PathVariable Long orderId,
            @PathVariable Long contractId) {
        return ResponseEntity.ok(orderService.getContractSignQr(orderId, contractId));
    }

    /**
     * 催签（电子签平台 CreateFlowReminds 或等效能力）
     */
    @PostMapping("/{orderId}/contracts/{contractId}/urge-sign")
    public ResponseEntity<Void> urgeContractSign(
            @PathVariable Long orderId,
            @PathVariable Long contractId) {
        orderService.urgeContractSign(orderId, contractId);
        return ResponseEntity.ok().build();
    }

}


