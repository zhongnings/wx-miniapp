package com.yixinjr.loanminiapp.controller;

import com.yixinjr.loanminiapp.dto.BankIdentifyResponseDTO;
import com.yixinjr.loanminiapp.service.BankIdentifyService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/public/banks")
@RequiredArgsConstructor
public class BankController {

    private final BankIdentifyService bankIdentifyService;

    @GetMapping("/identify")
    public BankIdentifyResponseDTO identify(@RequestParam String cardPrefix) {
        return bankIdentifyService.identify(cardPrefix);
    }
}
