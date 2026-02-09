package com.example.loanminiapp.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.example.loanminiapp.dto.step.Step4GuarantorDTO;
import com.example.loanminiapp.dto.step.Step4GuarantorListDTO;
import com.example.loanminiapp.entity.OrderGuarantor;
import com.example.loanminiapp.mapper.OrderGuarantorMapper;
import com.example.loanminiapp.security.OrderAccessCheck;
import com.example.loanminiapp.service.OrderStepService;
import com.example.loanminiapp.util.FileDeleteUtil;
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
 * 担保人信息管理接口（使用独立表）
 */
@Slf4j
@RestController
@RequestMapping("/public/orders/{orderId}/guarantor")
@RequiredArgsConstructor
public class OrderGuarantorController {

    private final OrderStepService orderStepService;
    private final OrderGuarantorMapper guarantorMapper;
    private final ObjectMapper objectMapper;
    private final FileDeleteUtil fileDeleteUtil;

    /**
     * 获取担保人列表
     */
    @GetMapping("/list")
    @OrderAccessCheck
    public Map<String, Object> getGuarantorList(@PathVariable Long orderId) {
        log.info("获取担保人列表: orderId={}", orderId);
        
        LambdaQueryWrapper<OrderGuarantor> query = new LambdaQueryWrapper<>();
        query.eq(OrderGuarantor::getOrderId, orderId)
             .orderByAsc(OrderGuarantor::getId);
        
        List<OrderGuarantor> guarantors = guarantorMapper.selectList(query);
        List<Step4GuarantorDTO> dtoList = new ArrayList<>();
        
        for (OrderGuarantor guarantor : guarantors) {
            Step4GuarantorDTO dto = convertToDTO(guarantor);
            dtoList.add(dto);
        }
        
        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("data", dtoList);
        result.put("total", dtoList.size());
        
        return result;
    }

    /**
     * 获取单个担保人信息
     */
    @GetMapping("/{id}")
    @OrderAccessCheck
    public Map<String, Object> getGuarantor(@PathVariable Long orderId, @PathVariable Long id) {
        log.info("获取担保人信息: orderId={}, id={}", orderId, id);
        
        LambdaQueryWrapper<OrderGuarantor> query = new LambdaQueryWrapper<>();
        query.eq(OrderGuarantor::getId, id)
             .eq(OrderGuarantor::getOrderId, orderId);
        
        OrderGuarantor guarantor = guarantorMapper.selectOne(query);
        
        Map<String, Object> result = new HashMap<>();
        if (guarantor != null) {
            result.put("success", true);
            result.put("data", convertToDTO(guarantor));
        } else {
            result.put("success", false);
            result.put("message", "担保人不存在");
        }
        
        return result;
    }

    /**
     * 新增担保人
     */
    @PostMapping("/add")
    @OrderAccessCheck
    public Map<String, Object> addGuarantor(@PathVariable Long orderId, 
                                             @RequestBody Step4GuarantorDTO dto) {
        log.info("新增担保人: orderId={}, type={}, name={}, company={}", 
            orderId, dto.getBorrowerType(), dto.getName(), dto.getCompanyName());
        
        // 验证必填字段
        String error = validateGuarantor(dto);
        if (error != null) {
            Map<String, Object> result = new HashMap<>();
            result.put("success", false);
            result.put("message", error);
            return result;
        }
        
        // 构建实体
        OrderGuarantor guarantor = OrderGuarantor.builder()
                .orderId(orderId)
                .status(0) // 待审核
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
        
        mapDTOToEntity(dto, guarantor);
        
        // 保存
        guarantorMapper.insert(guarantor);

        // 标记步骤完成
        orderStepService.markStepCompleted(orderId, 4);
        
        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("message", "新增成功");
        result.put("data", convertToDTO(guarantor));
        
        return result;
    }

    /**
     * 更新担保人
     */
    @PutMapping("/{id}")
    @OrderAccessCheck
    public Map<String, Object> updateGuarantor(@PathVariable Long orderId,
                                                @PathVariable Long id,
                                                @RequestBody Step4GuarantorDTO dto) {
        log.info("更新担保人: orderId={}, id={}, type={}, name={}, company={}", 
            orderId, id, dto.getBorrowerType(), dto.getName(), dto.getCompanyName());
        
        // 验证必填字段
        String error = validateGuarantor(dto);
        if (error != null) {
            Map<String, Object> result = new HashMap<>();
            result.put("success", false);
            result.put("message", error);
            return result;
        }
        
        // 查询现有记录
        LambdaQueryWrapper<OrderGuarantor> query = new LambdaQueryWrapper<>();
        query.eq(OrderGuarantor::getId, id)
             .eq(OrderGuarantor::getOrderId, orderId);
        
        OrderGuarantor guarantor = guarantorMapper.selectOne(query);
        
        Map<String, Object> result = new HashMap<>();
        if (guarantor == null) {
            result.put("success", false);
            result.put("message", "担保人不存在");
            return result;
        }
        
        // 更新字段
        mapDTOToEntity(dto, guarantor);
        guarantor.setUpdatedAt(LocalDateTime.now());
        
        // 保存
        guarantorMapper.updateById(guarantor);
        
        result.put("success", true);
        result.put("message", "更新成功");
        result.put("data", convertToDTO(guarantor));
        
        return result;
    }

    /**
     * 删除担保人
     */
    @DeleteMapping("/{id}")
    @OrderAccessCheck
    public Map<String, Object> deleteGuarantor(@PathVariable Long orderId, @PathVariable Long id) {
        log.info("删除担保人: orderId={}, id={}", orderId, id);
        
        // 先查询担保人信息，获取关联的文件URL
        OrderGuarantor dbEntry = guarantorMapper.selectById(id);
        
        Map<String, Object> result = new HashMap<>();
        if (dbEntry == null || !dbEntry.getOrderId().equals(orderId)) {
            result.put("success", false);
            result.put("message", "担保人不存在");
            return result;
        }
        
        // 删除关联的文件
        int deletedFileCount = 0;
        
        // 删除个人身份证正面
        if (StringUtils.isNotEmpty(dbEntry.getFaceFrontUrl())) {
            if (fileDeleteUtil.deleteFileByUrl(dbEntry.getFaceFrontUrl())) {
                deletedFileCount++;
                log.info("删除个人身份证正面: url={}", dbEntry.getFaceFrontUrl());
            }
        }
        
        // 删除个人身份证反面
        if (StringUtils.isNotEmpty(dbEntry.getFaceBackUrl())) {
            if (fileDeleteUtil.deleteFileByUrl(dbEntry.getFaceBackUrl())) {
                deletedFileCount++;
                log.info("删除个人身份证反面: url={}", dbEntry.getFaceBackUrl());
            }
        }
        
        // 删除营业执照
        if (StringUtils.isNotEmpty(dbEntry.getBusinessLicenseUrl())) {
            if (fileDeleteUtil.deleteFileByUrl(dbEntry.getBusinessLicenseUrl())) {
                deletedFileCount++;
                log.info("删除营业执照: url={}", dbEntry.getBusinessLicenseUrl());
            }
        }
        
        // 删除经办人身份证正面
        if (StringUtils.isNotEmpty(dbEntry.getAgentFaceFrontUrl())) {
            if (fileDeleteUtil.deleteFileByUrl(dbEntry.getAgentFaceFrontUrl())) {
                deletedFileCount++;
                log.info("删除经办人身份证正面: url={}", dbEntry.getAgentFaceFrontUrl());
            }
        }
        
        // 删除经办人身份证反面
        if (StringUtils.isNotEmpty(dbEntry.getAgentFaceBackUrl())) {
            if (fileDeleteUtil.deleteFileByUrl(dbEntry.getAgentFaceBackUrl())) {
                deletedFileCount++;
                log.info("删除经办人身份证反面: url={}", dbEntry.getAgentFaceBackUrl());
            }
        }

        log.info("共删除 {} 个关联文件", deletedFileCount);
        
        // 删除数据库记录
        LambdaQueryWrapper<OrderGuarantor> query = new LambdaQueryWrapper<>();
        query.eq(OrderGuarantor::getId, id)
             .eq(OrderGuarantor::getOrderId, orderId);
        
        int deleted = guarantorMapper.delete(query);
        
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
     * 批量保存担保人（兼容step4保存）
     */
    @PostMapping("/batch-save")
    @OrderAccessCheck
    public Map<String, Object> batchSaveGuarantors(@PathVariable Long orderId,
                                                     @RequestBody Step4GuarantorListDTO listDTO) {
        log.info("批量保存担保人: orderId={}, count={}", orderId, 
            listDTO.getGuarantors() != null ? listDTO.getGuarantors().size() : 0);
        
        try {
            // 删除原有担保人
            LambdaQueryWrapper<OrderGuarantor> delQuery = new LambdaQueryWrapper<>();
            delQuery.eq(OrderGuarantor::getOrderId, orderId);
            guarantorMapper.delete(delQuery);
            
            // 批量插入新的担保人
            if (listDTO.getGuarantors() != null && !listDTO.getGuarantors().isEmpty()) {
                for (Step4GuarantorDTO dto : listDTO.getGuarantors()) {
                    // 验证必填字段
                    String error = validateGuarantor(dto);
                    if (error != null) {
                        log.warn("担保人数据验证失败: {}", error);
                        continue;
                    }
                    
                    OrderGuarantor guarantor = OrderGuarantor.builder()
                            .orderId(orderId)
                            .status(0)
                            .createdAt(LocalDateTime.now())
                            .updatedAt(LocalDateTime.now())
                            .build();
                    
                    mapDTOToEntity(dto, guarantor);
                    guarantorMapper.insert(guarantor);
                }
            }
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("message", "保存成功");
            result.put("orderId", orderId);
            
            return result;
        } catch (Exception e) {
            log.error("批量保存担保人失败", e);
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", false);
            result.put("message", "保存失败: " + e.getMessage());
            
            return result;
        }
    }

    /**
     * 审核担保人
     */
    @PostMapping("/{id}/audit")
    @OrderAccessCheck
    public Map<String, Object> auditGuarantor(@PathVariable Long orderId,
                                               @PathVariable Long id,
                                               @RequestParam Integer status,
                                               @RequestParam(required = false) String remark) {
        log.info("审核担保人: orderId={}, id={}, status={}, remark={}", orderId, id, status, remark);
        
        LambdaQueryWrapper<OrderGuarantor> query = new LambdaQueryWrapper<>();
        query.eq(OrderGuarantor::getId, id)
             .eq(OrderGuarantor::getOrderId, orderId);
        
        OrderGuarantor guarantor = guarantorMapper.selectOne(query);
        
        Map<String, Object> result = new HashMap<>();
        if (guarantor == null) {
            result.put("success", false);
            result.put("message", "担保人不存在");
            return result;
        }
        
        guarantor.setStatus(status);
        guarantor.setAuditRemark(remark);
        guarantor.setUpdatedAt(LocalDateTime.now());
        
        guarantorMapper.updateById(guarantor);
        
        result.put("success", true);
        result.put("message", "审核成功");
        
        return result;
    }

    /**
     * 验证担保人必填字段
     */
    private String validateGuarantor(Step4GuarantorDTO dto) {
        if (dto.getBorrowerType() == null || dto.getBorrowerType().isEmpty()) {
            return "请选择担保人类型";
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
    private Step4GuarantorDTO convertToDTO(OrderGuarantor entity) {
        Step4GuarantorDTO dto = new Step4GuarantorDTO();
        
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

        return dto;
    }

    /**
     * DTO 映射到 Entity
     */
    private void mapDTOToEntity(Step4GuarantorDTO dto, OrderGuarantor entity) {
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
        entity.setMaritalStatus(dto.getMaritalStatus());
        entity.setFaceFrontUrl(dto.getIdCardFront());
        entity.setFaceBackUrl(dto.getIdCardBack());
        
        // 关系字段：个人类型使用 relationship，对公/房产类型使用 companyRelationship
        if ("personal".equals(dto.getBorrowerType())) {
            entity.setRelationship(dto.getRelationship());
        } else if ("company".equals(dto.getBorrowerType()) || "property".equals(dto.getBorrowerType())) {
            entity.setRelationship(dto.getCompanyRelationship());
        }
        
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
