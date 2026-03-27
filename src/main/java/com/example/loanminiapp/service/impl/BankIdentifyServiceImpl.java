package com.example.loanminiapp.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.example.loanminiapp.dto.BankIdentifyResponseDTO;
import com.example.loanminiapp.entity.BankBinMapping;
import com.example.loanminiapp.entity.BankInfo;
import com.example.loanminiapp.mapper.BankBinMappingMapper;
import com.example.loanminiapp.mapper.BankInfoMapper;
import com.example.loanminiapp.service.BankIdentifyService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.annotation.Resource;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
public class BankIdentifyServiceImpl implements BankIdentifyService {

    @Resource
    private BankBinMappingMapper bankBinMappingMapper;

    @Resource
    private BankInfoMapper bankInfoMapper;

    @Value("${bank.bin.map-version:2026-03-27}")
    private String mapVersion;

    @Override
    public BankIdentifyResponseDTO identify(String cardPrefix) {
        String cleanPrefix = sanitizeCardPrefix(cardPrefix);
        if (cleanPrefix.length() < 4) {
            return buildUnmatched("none");
        }

        Map<String, BankInfo> bankInfoMap = loadBankInfoMap();
        List<BankBinMapping> mappings = loadEnabledMappings();
        if (mappings.isEmpty() || bankInfoMap.isEmpty()) {
            return buildUnmatched("none");
        }

        Optional<BankBinMapping> exactMatch = matchExact(cleanPrefix, mappings);
        if (exactMatch.isPresent()) {
            return buildMatched(exactMatch.get().getBankCode(), "exact", bankInfoMap);
        }

        Optional<String> fallbackBankCode = matchFallback(cleanPrefix, mappings);
        if (fallbackBankCode.isPresent()) {
            return buildMatched(fallbackBankCode.get(), "fallback", bankInfoMap);
        }

        return buildUnmatched("none");
    }

    private String sanitizeCardPrefix(String cardPrefix) {
        if (cardPrefix == null) {
            return "";
        }
        return cardPrefix.replaceAll("\\D", "");
    }

    private List<BankBinMapping> loadEnabledMappings() {
        LambdaQueryWrapper<BankBinMapping> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(BankBinMapping::getIsEnabled, true);
        return bankBinMappingMapper.selectList(wrapper);
    }

    private Map<String, BankInfo> loadBankInfoMap() {
        LambdaQueryWrapper<BankInfo> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(BankInfo::getIsEnabled, true);
        List<BankInfo> bankInfos = bankInfoMapper.selectList(wrapper);
        return bankInfos.stream().collect(Collectors.toMap(BankInfo::getBankCode, b -> b, (a, b) -> a));
    }

    private Optional<BankBinMapping> matchExact(String cleanPrefix, List<BankBinMapping> mappings) {
        int[] exactLens = new int[]{8, 7, 6};
        for (int len : exactLens) {
            if (cleanPrefix.length() < len) {
                continue;
            }
            String typedPrefix = cleanPrefix.substring(0, len);
            for (BankBinMapping mapping : mappings) {
                if (mapping.getPrefixLength() == null || !Boolean.TRUE.equals(mapping.getIsEnabled())) {
                    continue;
                }
                if (mapping.getPrefixLength() == len && typedPrefix.equals(mapping.getBinPrefix())) {
                    return Optional.of(mapping);
                }
            }
        }
        return Optional.empty();
    }

    private Optional<String> matchFallback(String cleanPrefix, List<BankBinMapping> mappings) {
        int[] fallbackLens = new int[]{5, 4};
        for (int len : fallbackLens) {
            if (cleanPrefix.length() < len) {
                continue;
            }
            String typedPrefix = cleanPrefix.substring(0, len);
            Set<String> bankCodes = new HashSet<>();
            for (BankBinMapping mapping : mappings) {
                if (!Boolean.TRUE.equals(mapping.getIsEnabled())) {
                    continue;
                }
                String binPrefix = mapping.getBinPrefix();
                if (binPrefix == null || binPrefix.length() < len) {
                    continue;
                }
                if (binPrefix.startsWith(typedPrefix)) {
                    bankCodes.add(mapping.getBankCode());
                }
            }
            if (bankCodes.size() == 1) {
                return Optional.of(bankCodes.iterator().next());
            }
        }
        return Optional.empty();
    }

    private BankIdentifyResponseDTO buildMatched(String bankCode, String confidence, Map<String, BankInfo> bankInfoMap) {
        BankIdentifyResponseDTO dto = new BankIdentifyResponseDTO();
        BankInfo bankInfo = bankInfoMap.get(bankCode);
        if (bankInfo == null) {
            log.warn("银行卡识别命中 bankCode 但未找到银行信息: bankCode={}", bankCode);
            return buildUnmatched("none");
        }
        dto.setMatched(true);
        dto.setBankCode(bankInfo.getBankCode());
        dto.setBankName(bankInfo.getBankName());
        dto.setLogo(bankInfo.getLogoPath());
        dto.setColor(bankInfo.getColor());
        dto.setConfidence(confidence);
        dto.setMapVersion(mapVersion);
        return dto;
    }

    private BankIdentifyResponseDTO buildUnmatched(String confidence) {
        BankIdentifyResponseDTO dto = new BankIdentifyResponseDTO();
        dto.setMatched(false);
        dto.setConfidence(confidence);
        dto.setMapVersion(mapVersion);
        return dto;
    }
}
