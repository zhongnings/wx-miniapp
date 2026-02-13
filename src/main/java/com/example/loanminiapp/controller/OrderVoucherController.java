package com.example.loanminiapp.controller;

import com.example.loanminiapp.model.PayeeInfo;
import com.example.loanminiapp.model.VoucherInfo;
import com.example.loanminiapp.service.OrderVoucherService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 制单信息控制器
 */
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
}

