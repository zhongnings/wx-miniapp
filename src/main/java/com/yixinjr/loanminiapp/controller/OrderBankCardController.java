package com.yixinjr.loanminiapp.controller;

import com.yixinjr.loanminiapp.security.OrderAccessCheck;
import com.yixinjr.loanminiapp.dto.step.Step5BankCardDTO;
import com.yixinjr.loanminiapp.entity.OrderBankCard;
import com.yixinjr.loanminiapp.service.OrderBankCardService;
import com.yixinjr.loanminiapp.service.OrderStepService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 银行卡信息控制器（Step5）
 */
@Slf4j
@RestController
@RequestMapping("/public/orders")
@RequiredArgsConstructor
public class OrderBankCardController {

    private final OrderBankCardService bankCardService;
    private final OrderStepService orderStepService;

    /**
     * 批量保存银行卡信息
     */
    @PostMapping("/{orderId}/step5")
    @OrderAccessCheck
    public Map<String, Object> saveBankCards(@PathVariable Long orderId,
                                              @RequestBody Map<String, Object> request) {
        // 解析银行卡列表
        List<Step5BankCardDTO> bankCards = parseBankCardList(request);
        
        // 保存银行卡信息
        bankCardService.batchSave(orderId, bankCards);
        
        // 标记步骤完成
        orderStepService.markStepCompleted(orderId, 5);
        
        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("orderId", orderId);
        return result;
    }

    /**
     * 加载银行卡列表
     */
    @GetMapping("/{orderId}/bankCards")
    @OrderAccessCheck
    public List<OrderBankCard> loadBankCards(@PathVariable Long orderId) {
        return bankCardService.loadList(orderId);
    }

    /**
     * 新增单个银行卡
     */
    @PostMapping("/{orderId}/bankCards")
    @OrderAccessCheck
    public Map<String, Object> addBankCard(@PathVariable Long orderId,
                                            @RequestBody Step5BankCardDTO dto) {
        log.info("新增银行卡: orderId={}, bankName={}, cardNumber={}", 
            orderId, dto.getBankName(), dto.getCardNumber());
        
        Long cardId = bankCardService.addOne(orderId, dto);
        
        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("id", cardId);
        return result;
    }

    /**
     * 更新单个银行卡
     */
    @PutMapping("/{orderId}/bankCards/{cardId}")
    @OrderAccessCheck
    public Map<String, Object> updateBankCard(@PathVariable Long orderId,
                                               @PathVariable Long cardId,
                                               @RequestBody Step5BankCardDTO dto) {
        log.info("更新银行卡: orderId={}, cardId={}, bankName={}, cardNumber={}", 
            orderId, cardId, dto.getBankName(), dto.getCardNumber());
        
        dto.setId(cardId);
        bankCardService.updateOne(orderId, dto);
        
        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        return result;
    }

    /**
     * 删除银行卡
     */
    @DeleteMapping("/{orderId}/bankCards/{cardId}")
    @OrderAccessCheck
    public Map<String, Object> deleteBankCard(@PathVariable Long orderId,
                                               @PathVariable Long cardId) {
        bankCardService.delete(orderId, cardId);
        
        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        return result;
    }

    /**
     * 解析银行卡列表
     */
    @SuppressWarnings("unchecked")
    private List<Step5BankCardDTO> parseBankCardList(Map<String, Object> request) {
        List<Step5BankCardDTO> bankCards = new ArrayList<>();
        
        Object bankCardsObj = request.get("bankCards");
        if (bankCardsObj instanceof List) {
            List<?> list = (List<?>) bankCardsObj;
            for (Object item : list) {
                if (item instanceof Map) {
                    Map<String, Object> map = (Map<String, Object>) item;
                    Step5BankCardDTO dto = new Step5BankCardDTO();
                    
                    if (map.containsKey("id")) {
                        Object idObj = map.get("id");
                        if (idObj != null) {
                            try {
                                dto.setId(Long.valueOf(idObj.toString()));
                            } catch (NumberFormatException e) {
                                // ignore invalid id
                            }
                        }
                    }
                    if (map.containsKey("bankName")) {
                        dto.setBankName((String) map.get("bankName"));
                    }
                    if (map.containsKey("cardholderName")) {
                        dto.setCardholderName((String) map.get("cardholderName"));
                    }
                    if (map.containsKey("cardNumber")) {
                        dto.setCardNumber((String) map.get("cardNumber"));
                    }
                    if (map.containsKey("holderType")) {
                        dto.setHolderType((String) map.get("holderType"));
                    }
                    if (map.containsKey("idType")) {
                        dto.setIdType((String) map.get("idType"));
                    }
                    if (map.containsKey("idNumber")) {
                        dto.setIdNumber((String) map.get("idNumber"));
                    }
                    if (map.containsKey("reservedMobile")) {
                        dto.setReservedMobile((String) map.get("reservedMobile"));
                    }
                    if (map.containsKey("cardFrontImage")) {
                        dto.setCardFrontImage((String) map.get("cardFrontImage"));
                    }
                    
                    bankCards.add(dto);
                }
            }
        }
        
        return bankCards;
    }
}
