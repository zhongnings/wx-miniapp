package com.yixinjr.loanminiapp.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.yixinjr.loanminiapp.dto.step.Step3CoBorrowerDTO;
import com.yixinjr.loanminiapp.dto.step.Step3CoBorrowerListDTO;
import com.yixinjr.loanminiapp.entity.OrderCoBorrower;
import com.yixinjr.loanminiapp.mapper.OrderCoBorrowerMapper;
import com.yixinjr.loanminiapp.security.OrderAccessCheck;
import com.yixinjr.loanminiapp.service.OrderStepService;
import com.yixinjr.loanminiapp.util.FileDeleteUtil;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
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

    private final OrderStepService orderStepService;
    private final OrderCoBorrowerMapper coBorrowerMapper;
    private final ObjectMapper objectMapper;
    private final FileDeleteUtil fileDeleteUtil;

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
     * 保存共借人（自动判断新增或更新）
     * 根据 orderId 查询，如果存在则更新，不存在则新增
     */
    @PostMapping("/save")
    @OrderAccessCheck
    public Map<String, Object> saveCoBorrower(@PathVariable Long orderId, 
                                              @RequestBody Step3CoBorrowerDTO dto) {
        log.info("保存共借人: orderId={}, type={}, name={}, company={}", 
            orderId, dto.getBorrowerType(), dto.getName(), dto.getCompanyName());
        
        // 验证必填字段
        String error = validateCoBorrower(dto);
        if (error != null) {
            Map<String, Object> result = new HashMap<>();
            result.put("success", false);
            result.put("message", error);
            return result;
        }
        
        // 查询是否已存在共借人
        LambdaQueryWrapper<OrderCoBorrower> query = new LambdaQueryWrapper<>();
        query.eq(OrderCoBorrower::getOrderId, orderId);
        OrderCoBorrower existingBorrower = coBorrowerMapper.selectOne(query);
        
        OrderCoBorrower borrower;
        boolean isUpdate = false;
        
        if (existingBorrower != null) {
            // 更新现有记录
            borrower = existingBorrower;
            mapDTOToEntity(dto, borrower);
            borrower.setUpdatedAt(LocalDateTime.now());
            coBorrowerMapper.updateById(borrower);
            isUpdate = true;
            log.info("更新共借人: id={}, orderId={}", borrower.getId(), orderId);
        } else {
            // 新增记录
            borrower = OrderCoBorrower.builder()
                    .orderId(orderId)
                    .status(0) // 待审核
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .build();
            
            mapDTOToEntity(dto, borrower);
            coBorrowerMapper.insert(borrower);
            log.info("新增共借人: id={}, orderId={}", borrower.getId(), orderId);
        }

        // 标记步骤完成
        orderStepService.markStepCompleted(orderId, 3);
        
        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("message", isUpdate ? "更新成功" : "新增成功");
        result.put("data", convertToDTO(borrower));
        
        return result;
    }

    /**
     * 新增共借人（保留兼容性）
     */
    @PostMapping("/add")
    @OrderAccessCheck
    public Map<String, Object> addCoBorrower(@PathVariable Long orderId, 
                                             @RequestBody Step3CoBorrowerDTO dto) {
        log.info("新增共借人(兼容接口): orderId={}, type={}, name={}, company={}", 
            orderId, dto.getBorrowerType(), dto.getName(), dto.getCompanyName());
        
        // 直接调用 save 方法
        return saveCoBorrower(orderId, dto);
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
        
        // 先查询共借人信息，获取关联的文件URL
        OrderCoBorrower dbEntry = coBorrowerMapper.selectById(id);
        
        Map<String, Object> result = new HashMap<>();
        if (dbEntry == null || !dbEntry.getOrderId().equals(orderId)) {
            result.put("success", false);
            result.put("message", "共借人不存在");
            return result;
        }
        
        // 删除关联的文件
        int deletedFileCount = 0;
        
        // 删除身份证正面
        if (StringUtils.isNotEmpty(dbEntry.getFaceFrontUrl())) {
            if (fileDeleteUtil.deleteFileByUrl(dbEntry.getFaceFrontUrl())) {
                deletedFileCount++;
                log.info("删除身份证正面: url={}", dbEntry.getFaceFrontUrl());
            }
        }
        
        // 删除身份证反面
        if (StringUtils.isNotEmpty(dbEntry.getFaceBackUrl())) {
            if (fileDeleteUtil.deleteFileByUrl(dbEntry.getFaceBackUrl())) {
                deletedFileCount++;
                log.info("删除身份证反面: url={}", dbEntry.getFaceBackUrl());
            }
        }
        
        // 删除营业执照/房产证
        if (StringUtils.isNotEmpty(dbEntry.getBusinessLicenseUrl())) {
            if (fileDeleteUtil.deleteFileByUrl(dbEntry.getBusinessLicenseUrl())) {
                deletedFileCount++;
                log.info("删除营业执照/房产证: url={}", dbEntry.getBusinessLicenseUrl());
            }
        }
        
        // 删除公证材料
        if (StringUtils.isNotEmpty(dbEntry.getNotaryDocumentsJson())) {
            try {
                List<Step3CoBorrowerDTO.NotaryDocument> docs = objectMapper.readValue(
                    dbEntry.getNotaryDocumentsJson(),
                    objectMapper.getTypeFactory().constructCollectionType(List.class, Step3CoBorrowerDTO.NotaryDocument.class)
                );
                for (Step3CoBorrowerDTO.NotaryDocument doc : docs) {
                    if (StringUtils.isNotEmpty(doc.getPath())) {
                        if (fileDeleteUtil.deleteFileByUrl(doc.getPath())) {
                            deletedFileCount++;
                            log.info("删除公证材料: url={}", doc.getPath());
                        }
                    }
                }
            } catch (Exception e) {
                log.warn("解析公证材料JSON失败，跳过文件删除", e);
            }
        }
        
        log.info("共删除 {} 个关联文件", deletedFileCount);
        
        // 删除数据库记录
        LambdaQueryWrapper<OrderCoBorrower> query = new LambdaQueryWrapper<>();
        query.eq(OrderCoBorrower::getId, id)
             .eq(OrderCoBorrower::getOrderId, orderId);
        
        int deleted = coBorrowerMapper.delete(query);
        
        if (deleted > 0) {
            result.put("success", true);
            result.put("message", "删除成功");
            result.put("deletedFileCount", deletedFileCount);
        } else {
            result.put("success", false);
            result.put("message", "删除失败");
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
        } else if ("company".equals(dto.getBorrowerType()) || "property".equals(dto.getBorrowerType())) {
            // 对公/房产类型验证
            String entityName = "company".equals(dto.getBorrowerType()) ? "公司" : "房产证";
            
            if (dto.getCompanyName() == null || dto.getCompanyName().trim().isEmpty()) {
                return "请填写" + ("company".equals(dto.getBorrowerType()) ? "公司名称" : "房产证号码");
            }
            if (dto.getBusinessLicense() == null || dto.getBusinessLicense().trim().isEmpty()) {
                return "请上传" + ("company".equals(dto.getBorrowerType()) ? "营业执照" : "房产证");
            }
            // 验证经办人信息（使用个人信息字段）
            if (dto.getName() == null || dto.getName().trim().isEmpty()) {
                return "请填写经办人姓名";
            }
            if (dto.getPhone() == null || dto.getPhone().trim().isEmpty()) {
                return "请填写经办人手机号";
            }
            if (dto.getIdNumber() == null || dto.getIdNumber().trim().isEmpty()) {
                return "请填写经办人证件号码";
            }
            if (dto.getIdCardFront() == null || dto.getIdCardFront().trim().isEmpty()) {
                return "请上传经办人身份证正面";
            }
            if (dto.getIdCardBack() == null || dto.getIdCardBack().trim().isEmpty()) {
                return "请上传经办人身份证反面";
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
        
        // 个人信息（个人类型使用，对公/房产类型作为经办人信息）
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
        
        // 对公/房产信息
        dto.setBusinessLicense(entity.getBusinessLicenseUrl());
        dto.setCompanyName(entity.getCompanyName());
        dto.setCompanyCreditCode(entity.getCompanyCreditCode());
        dto.setCompanyArea(entity.getCompanyArea());
        dto.setCompanyAddress(entity.getCompanyAddress());
        dto.setAgentMobile(entity.getAgentMobile());
        
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
        
        // 个人信息（个人类型使用，对公/房产类型作为经办人信息）
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
        
        // 对公/房产信息
        entity.setBusinessLicenseUrl(dto.getBusinessLicense());
        entity.setCompanyName(dto.getCompanyName());
        entity.setCompanyCreditCode(dto.getCompanyCreditCode());
        entity.setCompanyArea(dto.getCompanyArea());
        entity.setCompanyAddress(dto.getCompanyAddress());
        entity.setAgentMobile(dto.getAgentMobile());
        
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

