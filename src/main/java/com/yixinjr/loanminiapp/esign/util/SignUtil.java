package com.yixinjr.loanminiapp.esign.util;

import cn.hutool.extra.spring.SpringUtil;
import cn.hutool.json.JSONUtil;
import com.yixinjr.loanminiapp.config.EsignProperties;
import com.yixinjr.loanminiapp.esign.comm.EsignHttpHelper;
import com.yixinjr.loanminiapp.esign.comm.EsignHttpResponse;
import com.yixinjr.loanminiapp.esign.enums.EsignRequestType;
import com.yixinjr.loanminiapp.esign.exception.EsignException;
import com.yixinjr.loanminiapp.esign.model.EsignCreateFlowRequest;
import com.yixinjr.loanminiapp.esign.model.EsignUrlRequest;

import java.util.Map;

public class SignUtil {

    private static final EsignProperties props = SpringUtil.getBean(EsignProperties.class);

    /**
     * 发起签署
     *
     * @return EsignHttpResponse
     * @throws EsignException
     */
    public static EsignHttpResponse createByFile(EsignCreateFlowRequest request) throws EsignException {
        String apiaddr = "/v3/sign-flow/create-by-file";
        String jsonParm = JSONUtil.toJsonStr(request);

        //请求方法
        EsignRequestType requestType = EsignRequestType.POST;
        //生成请求签名鉴权方式的Header
        Map<String, String> header = EsignHttpHelper.signAndBuildSignAndJsonHeader(props.getAppId(), props.getAppSecret(), jsonParm, requestType.name(), apiaddr, true);
        //发起接口请求
        return EsignHttpHelper.doCommHttp(props.getApiBaseUrl(), apiaddr, requestType, jsonParm, header, true);
    }

    /**
     * 获取合同文件签署链接
     *
     * @return EsignHttpResponse
     * @throws EsignException
     */
    public static EsignHttpResponse signUrl(EsignUrlRequest request) throws EsignException {
        String apiaddr = "/v3/sign-flow/" + request.getSignFlowId() + "/sign-url";
        String jsonParm = JSONUtil.toJsonStr(request);

        //请求方法
        EsignRequestType requestType = EsignRequestType.POST;
        //生成请求签名鉴权方式的Header
        Map<String, String> header = EsignHttpHelper.signAndBuildSignAndJsonHeader(props.getAppId(), props.getAppSecret(), jsonParm, requestType.name(), apiaddr, true);
        //发起接口请求
        return EsignHttpHelper.doCommHttp(props.getApiBaseUrl(), apiaddr, requestType, jsonParm, header, true);
    }

    /**
     * 下载已签署文件及附属材料     *
     *
     * @return EsignHttpResponse
     * @throws EsignException
     */
    public static EsignHttpResponse fileDownloadUrl(String signFlowId) throws EsignException {
        String apiaddr = "/v3/sign-flow/" + signFlowId + "/file-download-url";
        //请求参数body体,json格式。get或者delete请求时jsonString传空json:"{}"或者null
        String jsonParm = null;

        //请求方法
        EsignRequestType requestType = EsignRequestType.GET;
        //生成签名鉴权方式的的header
        Map<String, String> header = EsignHttpHelper.signAndBuildSignAndJsonHeader(props.getAppId(), props.getAppSecret(), jsonParm, requestType.name(), apiaddr, true);
        //发起接口请求
        return EsignHttpHelper.doCommHttp(props.getApiBaseUrl(), apiaddr, requestType, jsonParm, header, true);
    }

    /**
     * 催签流程中签署人
     *
     * @return EsignHttpResponse
     */
    public static EsignHttpResponse signFlowUrge(String signFlowId, String signerMobile) throws EsignException {
        String apiaddr = "/v3/sign-flow/" + signFlowId + "/urge";
        //请求参数body体,json格式。get或者delete请求时jsonString传空json:"{}"或者null
        String jsonParm = "{\n" +
                "    \"noticeTypes\": \"1\",\n" +
                "    \"urgedOperator\": {\n" +
                "        \"psnAccount\": \"" + signerMobile + "\"\n" +
                "    }\n" +
                "}";
        //请求方法
        EsignRequestType requestType = EsignRequestType.POST;
        //生成签名鉴权方式的的header
        Map<String, String> header = EsignHttpHelper.signAndBuildSignAndJsonHeader(props.getAppId(), props.getAppSecret(), jsonParm, requestType.name(), apiaddr, true);
        //发起接口请求
        return EsignHttpHelper.doCommHttp(props.getApiBaseUrl(), apiaddr, requestType, jsonParm, header, true);
    }
}
