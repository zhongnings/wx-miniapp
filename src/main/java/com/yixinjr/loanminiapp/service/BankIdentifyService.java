package com.yixinjr.loanminiapp.service;

import com.yixinjr.loanminiapp.dto.BankIdentifyResponseDTO;

public interface BankIdentifyService {
    BankIdentifyResponseDTO identify(String cardPrefix);
}
