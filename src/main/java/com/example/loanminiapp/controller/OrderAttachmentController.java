package com.example.loanminiapp.controller;

import com.example.loanminiapp.security.OrderAccessCheck;
import com.example.loanminiapp.dto.step.Step6AttachmentDTO;
import com.example.loanminiapp.entity.OrderAttachment;
import com.example.loanminiapp.service.OrderAttachmentService;
import com.example.loanminiapp.service.OrderStepService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 附件信息控制器（Step6）
 */
@Slf4j
@RestController
@RequestMapping("/public/orders")
@RequiredArgsConstructor
public class OrderAttachmentController {

    private final OrderAttachmentService attachmentService;
    private final OrderStepService orderStepService;

    /**
     * 批量保存附件信息
     */
    @PostMapping("/{orderId}/step6")
    @OrderAccessCheck
    public Map<String, Object> saveAttachments(@PathVariable Long orderId,
                                                @RequestBody Map<String, Object> request) {
        // 解析附件列表
        List<Step6AttachmentDTO> attachments = parseAttachmentList(request);
        
        // 保存附件信息
        attachmentService.batchSave(orderId, attachments);
        
        // 标记步骤完成
        orderStepService.markStepCompleted(orderId, 6);
        
        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("orderId", orderId);
        return result;
    }

    /**
     * 加载附件列表
     */
    @GetMapping("/{orderId}/attachments")
    @OrderAccessCheck
    public Map<String, Object> loadAttachments(@PathVariable Long orderId) {
        List<OrderAttachment> attachments = attachmentService.loadList(orderId);
        
        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("data", attachments);
        return result;
    }

    /**
     * 删除附件
     */
    @DeleteMapping("/{orderId}/attachments/{attachmentId}")
    @OrderAccessCheck
    public Map<String, Object> deleteAttachment(@PathVariable Long orderId,
                                                 @PathVariable Long attachmentId) {
        attachmentService.delete(orderId, attachmentId);
        
        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        return result;
    }

    /**
     * 解析附件列表
     */
    @SuppressWarnings("unchecked")
    private List<Step6AttachmentDTO> parseAttachmentList(Map<String, Object> request) {
        List<Step6AttachmentDTO> attachments = new ArrayList<>();
        
        Object attachmentsObj = request.get("attachments");
        if (attachmentsObj instanceof List) {
            List<?> list = (List<?>) attachmentsObj;
            for (Object item : list) {
                if (item instanceof Map) {
                    Map<String, Object> map = (Map<String, Object>) item;
                    Step6AttachmentDTO dto = new Step6AttachmentDTO();
                    
                    if (map.containsKey("name")) {
                        dto.setName((String) map.get("name"));
                    }
                    if (map.containsKey("originalName")) {
                        dto.setOriginalName((String) map.get("originalName"));
                    }
                    if (map.containsKey("url")) {
                        dto.setUrl((String) map.get("url"));
                    }
                    if (map.containsKey("size")) {
                        Object sizeObj = map.get("size");
                        if (sizeObj != null) {
                            try {
                                dto.setSize(Long.valueOf(sizeObj.toString()));
                            } catch (NumberFormatException e) {
                                // ignore invalid size
                            }
                        }
                    }
                    
                    attachments.add(dto);
                }
            }
        }
        
        return attachments;
    }
}
