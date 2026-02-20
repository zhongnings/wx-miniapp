package com.example.loanminiapp.controller;

import com.example.loanminiapp.dto.FundAccountDTO;
import com.example.loanminiapp.service.FundAccountService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 资金账户管理控制器
 */
@Slf4j
@RestController
@RequestMapping("/public/accounts")
@RequiredArgsConstructor
public class FundAccountController {

    private final FundAccountService fundAccountService;

    /**
     * 查询账户列表
     */
    @GetMapping("/list")
    public Map<String, Object> list() {
        log.info("查询资金账户列表");
        
        List<FundAccountDTO> accounts = fundAccountService.list();
        
        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("data", accounts);
        result.put("total", accounts.size());
        return result;
    }

    /**
     * 根据ID查询账户
     */
    @GetMapping("/{id}")
    public Map<String, Object> getById(@PathVariable Long id) {
        log.info("查询资金账户详情: id={}", id);
        
        FundAccountDTO account = fundAccountService.getById(id);
        
        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("data", account);
        return result;
    }

    /**
     * 新增账户
     */
    @PostMapping
    public Map<String, Object> add(@RequestBody FundAccountDTO dto) {
        log.info("新增资金账户: assignee={}, accountNumber={}", 
            dto.getAssignee(), dto.getAccountNumber());
        
        Long id = fundAccountService.add(dto);
        
        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("id", id);
        result.put("message", "新增成功");
        return result;
    }

    /**
     * 更新账户
     */
    @PutMapping("/{id}")
    public Map<String, Object> update(@PathVariable Long id, 
                                       @RequestBody FundAccountDTO dto) {
        log.info("更新资金账户: id={}, assignee={}, accountNumber={}", 
            id, dto.getAssignee(), dto.getAccountNumber());
        
        fundAccountService.update(id, dto);
        
        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("message", "更新成功");
        return result;
    }

    /**
     * 删除账户
     */
    @DeleteMapping("/{id}")
    public Map<String, Object> delete(@PathVariable Long id) {
        log.info("删除资金账户: id={}", id);
        
        fundAccountService.delete(id);
        
        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("message", "删除成功");
        return result;
    }
}

