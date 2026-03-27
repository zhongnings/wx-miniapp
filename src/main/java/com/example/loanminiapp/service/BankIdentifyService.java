package com.example.loanminiapp.service;

import com.example.loanminiapp.dto.BankIdentifyResponseDTO;

public interface BankIdentifyService {
    BankIdentifyResponseDTO identify(String cardPrefix);
}
