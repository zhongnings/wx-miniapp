package com.example.loanminiapp.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.example.loanminiapp.dto.step.Step3CoBorrowerDTO;
import com.example.loanminiapp.dto.step.Step3CoBorrowerListDTO;
import com.example.loanminiapp.entity.OrderCoBorrower;
import com.example.loanminiapp.mapper.OrderCoBorrowerMapper;
import com.example.loanminiapp.security.OrderAccessCheck;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 共借人信息管理接口（使用独立表）
 */
@Slf4j
@RestController
@RequestMapping("/public/orders/{orderId}/coBorrower")
@RequiredArgsConstructor
public class OrderCoBorrowerController {

    private final OrderCoBorrowerMapper coBorrowerMapper;
    private final ObjectMapper objectMapper;

    /**
     * 获取共借人列表
     */
    @GetMapping("/list")
    @OrderAccessCheck
    public Map<String, Object> getCoBorrowerList(@PathVariable Long orderId) {
        log.info("获取共借人列表: orderId={}", orderId);
        
        LambdaQueryWrapper<OrderCoBorrower> query = new LambdaQueryWrapper<>();
        query.eq(OrderCoBorrower::getOrderId, orderId)
             .orderByAsc(OrderCoBorrower::getId);
        
        List<OrderCoBorrower> borrowers = coBorrowerMapper.selectList(query);
        List<Step3CoBorrowerDTO> dtoList = new ArrayList<>();
        
        for (OrderCoBorrower borrower : borrowers) {
            Step3CoBorrowerDTO dto = convertToDTO(borrower);
            dtoList.add(dto);
        }
        
        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("data", dtoList);
        result.put("total", dtoList.size());
        
        return result;
    }

    /**
     * 获取单个共借人信息
     */
    @GetMapping("/{id}")
    @OrderAccessCheck
    public Map<String, Object> getCoBorrower(@PathVariable Long orderId, @PathVariable Long id) {
        log.info("获取共借人信息: orderId={}, id={}", orderId, id);
        
        LambdaQueryWrapper<OrderCoBorrower> query = new LambdaQueryWrapper<>();
        query.eq(OrderCoBorrower::getId, id)
             .eq(OrderCoBorrower::getOrderId, orderId);
        
        OrderCoBorrower borrower = coBorrowerMapper.selectOne(query);
        
        Map<String, Object> result = new HashMap<>();
        if (borrower != null) {
            result.put("success", true);
            result.put("data", convertToDTO(borrower));
        } else {
            result.put("success", false);
            result.put("message", "共借人不存在");
        }
        
        return result;
    }

    /**
     * 新增共借人
     */
    @PostMapping("/add")
    @OrderAccessCheck
    public Map<String, Object> addCoBorrower(@PathVariable Long orderId, 
                                             @RequestBody Step3CoBorrowerDTO dto) {
        log.info("新增共借人: orderId={}, type={}, name={}, company={}", 
            orderId, dto.getBorrowerType(), dto.getName(), dto.getCompanyName());
        
        // 验证必填字段
        String error = validateCoBorrower(dto);
        if (error != null) {
            Map<String, Object> result = new HashMap<>();
            result.put("success", false);
            result.put("message", error);
            return result;
        }
        
        // 构建实体
        OrderCoBorrower borrower = OrderCoBorrower.builder()
                .orderId(orderId)
                .status(0) // 待审核
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
        
        mapDTOToEntity(dto, borrower);
        
        // 保存
        coBorrowerMapper.insert(borrower);
        
        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("message", "新增成功");
        result.put("data", convertToDTO(borrower));
        
        return result;
    }

    /**
     * 更新共借人
     */
    @PutMapping("/{id}")
    @OrderAccessCheck
    public Map<String, Object> updateCoBorrower(@PathVariable Long orderId,
                                                @PathVariable Long id,
                                                @RequestBody Step3CoBorrowerDTO dto) {
        log.info("更新共借人: orderId={}, id={}, type={}, name={}, company={}", 
            orderId, id, dto.getBorrowerType(), dto.getName(), dto.getCompanyName());
        
        // 验证必填字段
        String error = validateCoBorrower(dto);
        if (error != null) {
            Map<String, Object> result = new HashMap<>();
            result.put("success", false);
            result.put("message", error);
            return result;
        }
        
        // 查询现有记录
        LambdaQueryWrapper<OrderCoBorrower> query = new LambdaQueryWrapper<>();
        query.eq(OrderCoBorrower::getId, id)
             .eq(OrderCoBorrower::getOrderId, orderId);
        
        OrderCoBorrower borrower = coBorrowerMapper.selectOne(query);
        
        Map<String, Object> result = new HashMap<>();
        if (borrower == null) {
            result.put("success", false);
            result.put("message", "共借人不存在");
            return result;
        }
        
        // 更新字段
        mapDTOToEntity(dto, borrower);
        borrower.setUpdatedAt(LocalDateTime.now());
        
        // 保存
        coBorrowerMapper.updateById(borrower);
        
        result.put("success", true);
        result.put("message", "更新成功");
        result.put("data", convertToDTO(borrower));
        
        return result;
    }

    /**
     * 删除共借人
     */
    @DeleteMapping("/{id}")
    @OrderAccessCheck
    public Map<String, Object> deleteCoBorrower(@PathVariable Long orderId, @PathVariable Long id) {
        log.info("删除共借人: orderId={}, id={}", orderId, id);
        
        LambdaQueryWrapper<OrderCoBorrower> query = new LambdaQueryWrapper<>();
        query.eq(OrderCoBorrower::getId, id)
             .eq(OrderCoBorrower::getOrderId, orderId);
        
        int deleted = coBorrowerMapper.delete(query);
        
        Map<String, Object> result = new HashMap<>();
        if (deleted > 0) {
            result.put("success", true);
            result.put("message", "删除成功");
        } else {
            result.put("success", false);
            result.put("message", "共借人不存在");
        }
        
        return result;
    }

    /**
     * 批量保存共借人（兼容step3保存）
     */
    @PostMapping("/batch-save")
    @OrderAccessCheck
    public Map<String, Object> batchSaveCoBorrowers(@PathVariable Long orderId,
                                                     @RequestBody Step3CoBorrowerListDTO listDTO) {
        log.info("批量保存共借人: orderId={}, count={}", orderId, 
            listDTO.getCoBorrowers() != null ? listDTO.getCoBorrowers().size() : 0);
        
        try {
            // 删除原有共借人
            LambdaQueryWrapper<OrderCoBorrower> delQuery = new LambdaQueryWrapper<>();
            delQuery.eq(OrderCoBorrower::getOrderId, orderId);
            coBorrowerMapper.delete(delQuery);
            
            // 批量插入新的共借人
            if (listDTO.getCoBorrowers() != null && !listDTO.getCoBorrowers().isEmpty()) {
                for (Step3CoBorrowerDTO dto : listDTO.getCoBorrowers()) {
                    // 验证必填字段
                    String error = validateCoBorrower(dto);
                    if (error != null) {
                        log.warn("共借人数据验证失败: {}", error);
                        continue;
                    }
                    
                    OrderCoBorrower borrower = OrderCoBorrower.builder()
                            .orderId(orderId)
                            .status(0)
                            .createdAt(LocalDateTime.now())
                            .updatedAt(LocalDateTime.now())
                            .build();
                    
                    mapDTOToEntity(dto, borrower);
                    coBorrowerMapper.insert(borrower);
                }
            }
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("message", "保存成功");
            result.put("orderId", orderId);
            
            return result;
        } catch (Exception e) {
            log.error("批量保存共借人失败", e);
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", false);
            result.put("message", "保存失败: " + e.getMessage());
            
            return result;
        }
    }

    /**
     * 审核共借人
     */
    @PostMapping("/{id}/audit")
    @OrderAccessCheck
    public Map<String, Object> auditCoBorrower(@PathVariable Long orderId,
                                               @PathVariable Long id,
                                               @RequestParam Integer status,
                                               @RequestParam(required = false) String remark) {
        log.info("审核共借人: orderId={}, id={}, status={}, remark={}", orderId, id, status, remark);
        
        LambdaQueryWrapper<OrderCoBorrower> query = new LambdaQueryWrapper<>();
        query.eq(OrderCoBorrower::getId, id)
             .eq(OrderCoBorrower::getOrderId, orderId);
        
        OrderCoBorrower borrower = coBorrowerMapper.selectOne(query);
        
        Map<String, Object> result = new HashMap<>();
        if (borrower == null) {
            result.put("success", false);
            result.put("message", "共借人不存在");
            return result;
        }
        
        borrower.setStatus(status);
        borrower.setAuditRemark(remark);
        borrower.setUpdatedAt(LocalDateTime.now());
        
        coBorrowerMapper.updateById(borrower);
        
        result.put("success", true);
        result.put("message", "审核成功");
        
        return result;
    }

    /**
     * 验证共借人必填字段
     */
    private String validateCoBorrower(Step3CoBorrowerDTO dto) {
        if (dto.getBorrowerType() == null || dto.getBorrowerType().isEmpty()) {
            return "请选择共借人类型";
        }
        
        if ("personal".equals(dto.getBorrowerType())) {
            // 个人类型验证
            if (dto.getName() == null || dto.getName().trim().isEmpty()) {
                return "请填写姓名";
            }
            if (dto.getPhone() == null || dto.getPhone().trim().isEmpty()) {
                return "请填写手机号";
            }
            if (dto.getIdNumber() == null || dto.getIdNumber().trim().isEmpty()) {
                return "请填写证件号码";
            }
            if (dto.getIdCardFront() == null || dto.getIdCardFront().trim().isEmpty()) {
                return "请上传身份证正面";
            }
            if (dto.getIdCardBack() == null || dto.getIdCardBack().trim().isEmpty()) {
                return "请上传身份证反面";
            }
        } else if ("company".equals(dto.getBorrowerType())) {
            // 对公类型验证
            if (dto.getCompanyName() == null || dto.getCompanyName().trim().isEmpty()) {
                return "请填写公司名称";
            }
            if (dto.getCompanyCreditCode() == null || dto.getCompanyCreditCode().trim().isEmpty()) {
                return "请填写公司信用代码";
            }
            if (dto.getBusinessLicense() == null || dto.getBusinessLicense().trim().isEmpty()) {
                return "请上传营业执照";
            }
            if (dto.getAgentName() == null || dto.getAgentName().trim().isEmpty()) {
                return "请填写经办人姓名";
            }
            if (dto.getAgentIdNumber() == null || dto.getAgentIdNumber().trim().isEmpty()) {
                return "请填写经办人证件号码";
            }
        }
        
        return null;
    }

    /**
     * Entity 转 DTO
     */
    private Step3CoBorrowerDTO convertToDTO(OrderCoBorrower entity) {
        Step3CoBorrowerDTO dto = new Step3CoBorrowerDTO();
        
        dto.setBorrowerType(entity.getBorrowerType());
        
        // 个人信息
        dto.setName(entity.getName());
        dto.setIdType(entity.getIdType());
        dto.setIdNumber(entity.getIdNo());
        dto.setPhone(entity.getMobile());
        dto.setIdStartDate(entity.getIdIssueDate() != null ? entity.getIdIssueDate().toString() : null);
        dto.setIdEndDate(entity.getIdExpireDate() != null ? entity.getIdExpireDate().toString() : null);
        dto.setIdAddress(entity.getIdAddress());
        dto.setResidenceArea(entity.getProvinceCity());
        dto.setDetailAddress(entity.getAddressDetail());
        dto.setRelationship(entity.getRelationship());
        dto.setMaritalStatus(entity.getMaritalStatus());
        dto.setIdCardFront(entity.getFaceFrontUrl());
        dto.setIdCardBack(entity.getFaceBackUrl());
        
        // 对公信息
        dto.setBusinessLicense(entity.getBusinessLicenseUrl());
        dto.setCompanyName(entity.getCompanyName());
        dto.setCompanyCreditCode(entity.getCompanyCreditCode());
        dto.setCompanyArea(entity.getCompanyArea());
        dto.setCompanyAddress(entity.getCompanyAddress());
        dto.setAgentName(entity.getAgentName());
        dto.setAgentPhone(entity.getAgentMobile());
        dto.setAgentPhone2(entity.getAgentMobile());
        dto.setAgentIdType(entity.getAgentIdType());
        dto.setAgentIdNumber(entity.getAgentIdNo());
        dto.setAgentIdStartDate(entity.getAgentIdIssueDate() != null ? entity.getAgentIdIssueDate().toString() : null);
        dto.setAgentIdEndDate(entity.getAgentIdExpireDate() != null ? entity.getAgentIdExpireDate().toString() : null);
        dto.setAgentIdAddress(entity.getAgentIdAddress());
        dto.setAgentIdCardFront(entity.getAgentFaceFrontUrl());
        dto.setAgentIdCardBack(entity.getAgentFaceBackUrl());
        dto.setCompanyRelationship(entity.getRelationship());
        
        // 公证材料
        if (entity.getNotaryDocumentsJson() != null && !entity.getNotaryDocumentsJson().isEmpty()) {
            try {
                List<Step3CoBorrowerDTO.NotaryDocument> docs = objectMapper.readValue(
                    entity.getNotaryDocumentsJson(),
                    objectMapper.getTypeFactory().constructCollectionType(List.class, Step3CoBorrowerDTO.NotaryDocument.class)
                );
                dto.setNotaryDocuments(docs);
            } catch (Exception e) {
                log.warn("解析公证材料JSON失败", e);
            }
        }
        
        return dto;
    }

    /**
     * DTO 映射到 Entity
     */
    private void mapDTOToEntity(Step3CoBorrowerDTO dto, OrderCoBorrower entity) {
        entity.setBorrowerType(dto.getBorrowerType());
        
        // 个人信息
        entity.setName(dto.getName());
        entity.setIdType(dto.getIdType());
        entity.setIdNo(dto.getIdNumber());
        entity.setMobile(dto.getPhone());
        entity.setIdIssueDate(parseDate(dto.getIdStartDate()));
        entity.setIdExpireDate(parseDate(dto.getIdEndDate()));
        entity.setIdAddress(dto.getIdAddress());
        entity.setProvinceCity(dto.getResidenceArea());
        entity.setAddressDetail(dto.getDetailAddress());
        entity.setRelationship(dto.getRelationship());
        entity.setMaritalStatus(dto.getMaritalStatus());
        entity.setFaceFrontUrl(dto.getIdCardFront());
        entity.setFaceBackUrl(dto.getIdCardBack());
        
        // 对公信息
        entity.setBusinessLicenseUrl(dto.getBusinessLicense());
        entity.setCompanyName(dto.getCompanyName());
        entity.setCompanyCreditCode(dto.getCompanyCreditCode());
        entity.setCompanyArea(dto.getCompanyArea());
        entity.setCompanyAddress(dto.getCompanyAddress());
        entity.setAgentName(dto.getAgentName());
        entity.setAgentMobile(dto.getAgentPhone() != null ? dto.getAgentPhone() : dto.getAgentPhone2());
        entity.setAgentIdType(dto.getAgentIdType());
        entity.setAgentIdNo(dto.getAgentIdNumber());
        entity.setAgentIdIssueDate(parseDate(dto.getAgentIdStartDate()));
        entity.setAgentIdExpireDate(parseDate(dto.getAgentIdEndDate()));
        entity.setAgentIdAddress(dto.getAgentIdAddress());
        entity.setAgentFaceFrontUrl(dto.getAgentIdCardFront());
        entity.setAgentFaceBackUrl(dto.getAgentIdCardBack());
        
        // 对公的关系字段
        if (dto.getCompanyRelationship() != null) {
            entity.setRelationship(dto.getCompanyRelationship());
        }
        
        // 公证材料
        if (dto.getNotaryDocuments() != null && !dto.getNotaryDocuments().isEmpty()) {
            try {
                entity.setNotaryDocumentsJson(objectMapper.writeValueAsString(dto.getNotaryDocuments()));
            } catch (Exception e) {
                log.warn("公证材料JSON序列化失败", e);
            }
        }
    }

    /**
     * 解析日期字符串
     */
    private java.time.LocalDate parseDate(String dateStr) {
        if (dateStr == null || dateStr.isEmpty() || "长期".equals(dateStr)) {
            return null;
        }
        try {
            return java.time.LocalDate.parse(dateStr);
        } catch (Exception e) {
            log.warn("日期解析失败: {}", dateStr);
            return null;
        }
    }
}

