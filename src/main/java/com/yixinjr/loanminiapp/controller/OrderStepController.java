package com.yixinjr.loanminiapp.controller;

import com.yixinjr.loanminiapp.service.OrderStepService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 订单步骤保存接口（分步骤，不合并）
 * - 支持新建订单：不带 orderId 的接口会先创建订单
 * - 支持更新订单：带 orderId 的接口会更新现有订单
 */
@RestController
@RequestMapping("/public/orders")
@RequiredArgsConstructor
public class OrderStepController {

    private final OrderStepService orderStepService;

    /**
     * 保存步骤1（新建或更新）
     * - POST /public/orders/step1 - 新建订单并保存步骤1数据，返回 orderId
     * - POST /public/orders/{id}/step1 - 更新订单的步骤1数据
     */
    // @PostMapping("/step1")
    // public ResponseEntity<Map<String, Object>> createOrderAndSaveStep1(@RequestBody Step1LoanInfoDTO dto) {
    //     Long orderId = orderStepService.saveStep1(null, dto);
    //     Map<String, Object> result = new HashMap<>();
    //     result.put("orderId", orderId);
    //     return ResponseEntity.ok(result);
    // }

    // @PostMapping("/{id}/step1")
    // public ResponseEntity<Void> saveStep1(@PathVariable Long id, @RequestBody Step1LoanInfoDTO dto) {
    //     orderStepService.saveStep1(id, dto);
    //     return ResponseEntity.ok().build();
    // }

    // /**
    //  * 保存步骤2（新建或更新）
    //  */
    // @PostMapping("/step2")
    // public ResponseEntity<Map<String, Object>> createOrderAndSaveStep2(@RequestBody Step2BorrowerDTO dto) {
    //     Long orderId = orderStepService.saveStep2(null, dto);
    //     Map<String, Object> result = new HashMap<>();
    //     result.put("orderId", orderId);
    //     return ResponseEntity.ok(result);
    // }

    // @PostMapping("/{id}/step2")
    // public ResponseEntity<Void> saveStep2(@PathVariable Long id, @RequestBody Step2BorrowerDTO dto) {
    //     orderStepService.saveStep2(id, dto);
    //     return ResponseEntity.ok().build();
    // }

    // /**
    //  * 保存步骤3（新建或更新）
    //  */
    // @PostMapping("/step3")
    // public ResponseEntity<Map<String, Object>> createOrderAndSaveStep3(@RequestBody Step3CoBorrowerListDTO dto) {
    //     Long orderId = orderStepService.saveStep3(null, dto);
    //     Map<String, Object> result = new HashMap<>();
    //     result.put("orderId", orderId);
    //     return ResponseEntity.ok(result);
    // }

    // @PostMapping("/{id}/step3")
    // public ResponseEntity<Void> saveStep3(@PathVariable Long id, @RequestBody Step3CoBorrowerListDTO dto) {
    //     orderStepService.saveStep3(id, dto);
    //     return ResponseEntity.ok().build();
    // }

    // /**
    //  * 保存步骤4（新建或更新）
    //  */
    // @PostMapping("/step4")
    // public ResponseEntity<Map<String, Object>> createOrderAndSaveStep4(@RequestBody Step4GuarantorListDTO dto) {
    //     Long orderId = orderStepService.saveStep4(null, dto);
    //     Map<String, Object> result = new HashMap<>();
    //     result.put("orderId", orderId);
    //     return ResponseEntity.ok(result);
    // }

    // @PostMapping("/{id}/step4")
    // public ResponseEntity<Void> saveStep4(@PathVariable Long id, @RequestBody Step4GuarantorListDTO dto) {
    //     orderStepService.saveStep4(id, dto);
    //     return ResponseEntity.ok().build();
    // }

    // /**
    //  * 保存步骤5（新建或更新）
    //  */
    // @PostMapping("/step5")
    // public ResponseEntity<Map<String, Object>> createOrderAndSaveStep5(@RequestBody Step5BankCardListDTO dto) {
    //     Long orderId = orderStepService.saveStep5(null, dto);
    //     Map<String, Object> result = new HashMap<>();
    //     result.put("orderId", orderId);
    //     return ResponseEntity.ok(result);
    // }

    // @PostMapping("/{id}/step5")
    // public ResponseEntity<Void> saveStep5(@PathVariable Long id, @RequestBody Step5BankCardListDTO dto) {
    //     orderStepService.saveStep5(id, dto);
    //     return ResponseEntity.ok().build();
    // }

    // /**
    //  * 保存步骤6（新建或更新）
    //  */
    // @PostMapping("/step6")
    // public ResponseEntity<Map<String, Object>> createOrderAndSaveStep6(@RequestBody Step6AttachmentListDTO dto) {
    //     Long orderId = orderStepService.saveStep6(null, dto);
    //     Map<String, Object> result = new HashMap<>();
    //     result.put("orderId", orderId);
    //     return ResponseEntity.ok(result);
    // }

    // @PostMapping("/{id}/step6")
    // public ResponseEntity<Void> saveStep6(@PathVariable Long id, @RequestBody Step6AttachmentListDTO dto) {
    //     orderStepService.saveStep6(id, dto);
    //     return ResponseEntity.ok().build();
    // }
}


