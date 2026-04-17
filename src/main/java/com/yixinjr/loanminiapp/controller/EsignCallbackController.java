package com.yixinjr.loanminiapp.controller;

import com.yixinjr.loanminiapp.esign.model.EsignSignCallbackRequest;
import com.yixinjr.loanminiapp.service.EsignCallbackService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/public/esign/callback")
@RequiredArgsConstructor
public class EsignCallbackController {

    private final EsignCallbackService esignCallbackService;

    @PostMapping("/sign")
    public ResponseEntity<Map<String, Object>> signCallback(
            @RequestHeader(value = "X-Tsign-Open-App-Id", required = false) String appId,
            @RequestHeader(value = "X-Tsign-Open-TIMESTAMP", required = false) String timestamp,
            @RequestHeader(value = "X-Tsign-Open-SIGNATURE", required = false) String signature,
            @RequestBody(required = false) EsignSignCallbackRequest request) {
        log.info("[ESIGN_CALLBACK] receive appId={}, timestamp={}, action={}, flowId={}",
                appId, timestamp, request != null ? request.getAction() : null, request != null ? request.getSignFlowId() : null);
        esignCallbackService.handleSignCallback(request);
        Map<String, Object> resp = new HashMap<>();
        resp.put("code", 0);
        resp.put("message", "success");
        return ResponseEntity.ok(resp);
    }
}

