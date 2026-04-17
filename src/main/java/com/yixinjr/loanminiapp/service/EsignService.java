package com.yixinjr.loanminiapp.service;

import cn.hutool.core.util.StrUtil;
import cn.hutool.json.JSONArray;
import cn.hutool.json.JSONObject;
import cn.hutool.json.JSONUtil;
import com.yixinjr.loanminiapp.config.EsignProperties;
import com.yixinjr.loanminiapp.entity.OrderBorrower;
import com.yixinjr.loanminiapp.esign.comm.EsignHttpResponse;
import com.yixinjr.loanminiapp.esign.exception.EsignException;
import com.yixinjr.loanminiapp.esign.model.EsignUrlRequest;
import com.yixinjr.loanminiapp.esign.util.FileUploadUtil;
import com.yixinjr.loanminiapp.esign.model.EsignCreateFlowRequest;
import com.yixinjr.loanminiapp.esign.util.SignUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.stereotype.Service;

import java.nio.file.Path;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class EsignService {

    private final EsignProperties props;

    public String uploadContractFile(Path pdfFile) {
        if (pdfFile == null) {
            throw new RuntimeException("上传合同失败：pdf 文件为空");
        }
        try {
            return FileUploadUtil.upload(pdfFile.toString());
        } catch (EsignException e) {
            throw new RuntimeException("上传合同失败: " + e.getMessage(), e);
        }
    }

    public String createFlowByUploadedFile(String flowName, OrderBorrower borrower, String fileId, String fileName) {
        if (borrower == null || StringUtils.isBlank(borrower.getMobile())) {
            log.warn("[ESIGN] 借款人手机号为空，跳过电子签发起");
            return null;
        }
        if (StringUtils.isBlank(fileId)) {
            throw new RuntimeException("发起签署失败：fileId 为空");
        }

        try {
            String flowTitle = StringUtils.abbreviate(flowName, 200);

            EsignCreateFlowRequest request = EsignCreateFlowRequest.builder()
                    .docs(Collections.singletonList(
                            EsignCreateFlowRequest.Doc.builder()
                                    .fileId(fileId)
                                    .fileName(fileName)
                                    .build()
                    ))
                    .signFlowConfig(EsignCreateFlowRequest.SignFlowConfig.builder()
                            .signFlowTitle(flowTitle)
                            .autoFinish(true)
                            .noticeConfig(EsignCreateFlowRequest.NoticeConfig.builder()
                                    .noticeTypes("1,2")
                                    .build())
                            .notifyUrl(StringUtils.defaultString(props.getNotifyUrl(), ""))
                            .redirectConfig(EsignCreateFlowRequest.RedirectConfig.builder()
                                    .redirectUrl(StringUtils.defaultString(props.getRedirectUrl(), "https://www.esign.cn/"))
                                    .build())
                            .build())
                    .signers(Arrays.asList(
                            EsignCreateFlowRequest.Signer.builder()
                                    .signerType(1)
                                    .signConfig(EsignCreateFlowRequest.SignConfig.builder()
                                            .signOrder(1)
                                            .build())
                                    .signFields(Collections.singletonList(
                                            EsignCreateFlowRequest.SignField.builder()
                                                    .customBizNum("PLATFORM-" + fileId)
                                                    .fileId(fileId)
                                                    .normalSignFieldConfig(EsignCreateFlowRequest.NormalSignFieldConfig.builder()
                                                            .autoSign(true)
                                                            .signFieldStyle(1)
                                                            .signFieldPosition(EsignCreateFlowRequest.SignFieldPosition.builder()
                                                                    .positionPage("5")
                                                                    .positionX(480)
                                                                    .positionY(200)
                                                                    .build())
                                                            .build())
                                                    .build()
                                    ))
                                    .build(),
                            EsignCreateFlowRequest.Signer.builder()
                                    .signerType(0)
                                    .psnSignerInfo(EsignCreateFlowRequest.PsnSignerInfo.builder()
                                            .psnAccount(borrower.getMobile())
                                            .psnInfo(EsignCreateFlowRequest.PsnInfo.builder()
                                                    .psnName(StringUtils.defaultString(borrower.getName(), "签署人"))
                                                    .build())
                                            .build())
                                    .signConfig(EsignCreateFlowRequest.SignConfig.builder()
                                            .forcedReadingTime(10)
                                            .signOrder(2)
                                            .build())
                                    .signFields(Collections.singletonList(
                                            EsignCreateFlowRequest.SignField.builder()
                                                    .customBizNum("BORROWER-" + fileId)
                                                    .fileId(fileId)
                                                    .normalSignFieldConfig(EsignCreateFlowRequest.NormalSignFieldConfig.builder()
                                                            .signFieldStyle(1)
                                                            .signFieldPosition(EsignCreateFlowRequest.SignFieldPosition.builder()
                                                                    .positionPage("5")
                                                                    .positionX(200)
                                                                    .positionY(200)
                                                                    .build())
                                                            .build())
                                                    .build()
                                    ))
                                    .build()
                    ))
                    .build();

            EsignHttpResponse response = SignUtil.createByFile(request);
            JSONObject data = JSONUtil.parseObj(response.getBody());
            String signFlowId = data.getJSONObject("data").getStr("signFlowId");

            log.info("[ESIGN] 创建签署流程成功 flowId={}", signFlowId);
            return signFlowId;
        } catch (EsignException e) {
            throw new RuntimeException("发起签署失败: " + e.getMessage(), e);
        }
    }

    public String createFlowFromLocalPdf(String flowName, OrderBorrower borrower, Path pdfFile) {
        String fileId = uploadContractFile(pdfFile);
        return createFlowByUploadedFile(flowName, borrower, fileId, pdfFile.getFileName().toString());
    }

    public Map<String, Object> buildSignQrPayload(String flowId, String signerMobile) {
        Map<String, Object> result = new HashMap<>();
        EsignUrlRequest request = EsignUrlRequest.builder()
                .signFlowId(flowId)
                .operator(EsignUrlRequest.Operator.builder()
                        .psnAccount(signerMobile).build())
                .build();

        try {
            EsignHttpResponse response = SignUtil.signUrl(request);

            JSONObject urlJson = parseAndCheck(response, "获取签署链接失败");
            JSONObject urlData = urlJson.getJSONObject("data");
            String signUrl = urlData.getStr("shortUrl");
            if (StrUtil.isBlank(signUrl)) {
                throw new RuntimeException("获取签署链接失败：signUrl 为空");
            }

            result.put("signUrl", signUrl);
            result.put("longUrl", urlData.getStr("url", signUrl));

            String encoded;
            try {
                encoded = java.net.URLEncoder.encode(signUrl, "UTF-8");
            } catch (java.io.UnsupportedEncodingException e) {
                throw new RuntimeException("URL 编码失败", e);
            }

            result.put("qrCodeUrl", props.getQrImageBaseUrl() + encoded);
            result.put("tip", "请使用手机浏览器扫码打开签署页");
            return result;
        } catch (EsignException e) {
            throw new RuntimeException(e);
        }
    }

    public void remindFlow(String flowId, String signerMobile) {
        if (StringUtils.isBlank(flowId)) {
            return;
        }

        try {
            EsignHttpResponse response = SignUtil.signFlowUrge(flowId, signerMobile);
            parseAndCheck(response, "催签失败");
            log.info("[ESIGN] 催签成功 flowId={}", flowId);
        } catch (EsignException e) {
            log.error("催签失败: {}", e.getMessage());
            throw new RuntimeException("催签失败");
        }
    }

    public String fetchSignedFileDownloadUrl(String signFlowId) {
        try {
            EsignHttpResponse response = SignUtil.fileDownloadUrl(signFlowId);
            JSONObject json = parseAndCheck(response, "获取已签文件下载地址失败");
            JSONObject data = json.getJSONObject("data");
            if (data == null) {
                return null;
            }
            JSONArray files = data.getJSONArray("files");
            if (files == null || files.isEmpty()) {
                return null;
            }
            return files.getJSONObject(0).getStr("downloadUrl");
        } catch (EsignException e) {
            throw new RuntimeException("获取已签文件下载地址失败: " + e.getMessage(), e);
        }
    }

    private JSONObject parseAndCheck(EsignHttpResponse response, String action) {
        JSONObject json;
        try {
            json = JSONUtil.parseObj(response.getBody());
        } catch (Exception e) {
            throw new RuntimeException(action + "：响应不是合法 JSON，body=" + response.getBody(), e);
        }
        Integer code = json.getInt("code");
        if (code == null) {
            String codeStr = json.getStr("code");
            if (StringUtils.isNumeric(codeStr)) {
                code = Integer.valueOf(codeStr);
            }
        }
        if (code == null) {
            code = json.getInt("errCode");
        }
        if (code != null && code != 0) {
            throw new RuntimeException(action + ": " + json.getStr("message", json.getStr("msg")));
        }
        return json;
    }
}

