package com.yixinjr.loanminiapp.esign.util;

import cn.hutool.extra.spring.SpringUtil;
import com.google.gson.Gson;
import com.google.gson.JsonObject;
import com.yixinjr.loanminiapp.config.EsignProperties;
import com.yixinjr.loanminiapp.esign.comm.EsignFileBean;
import com.yixinjr.loanminiapp.esign.comm.EsignHttpHelper;
import com.yixinjr.loanminiapp.esign.comm.EsignHttpResponse;
import com.yixinjr.loanminiapp.esign.enums.EsignHeaderConstant;
import com.yixinjr.loanminiapp.esign.enums.EsignRequestType;
import com.yixinjr.loanminiapp.esign.exception.EsignException;
import lombok.extern.slf4j.Slf4j;

import java.util.Map;
import java.util.concurrent.TimeUnit;

@Slf4j
public class FileUploadUtil extends Exception {

    private static final EsignProperties props = SpringUtil.getBean(EsignProperties.class);

    /**
     *
     * @param filePath 文件地址
     * @return fileId
     * @throws EsignException
     */
    public static String upload(String filePath) throws EsignException {
        //获取文件id以及文件上传地址
        EsignHttpResponse getUploadUrl = getUploadUrl(filePath);
        Gson gson = new Gson();
        JsonObject getUploadUrlJsonObject = gson.fromJson(getUploadUrl.getBody(), JsonObject.class);
        JsonObject data = getUploadUrlJsonObject.getAsJsonObject("data");

        //文件id后续发起签署使用
        String fileId = data.get("fileId").getAsString();
        String fileUploadUrl = data.get("fileUploadUrl").getAsString();
        log.info("获取文件id以及文件上传地址成功，文件id:" + fileId);
        log.info("上传链接" + fileUploadUrl);

        //文件上传
        EsignHttpResponse uploadFileResponse = uploadFile(fileUploadUrl, filePath);
        JsonObject uploadFileResponseJsonObject = gson.fromJson(uploadFileResponse.getBody(), JsonObject.class);
        String code = uploadFileResponseJsonObject.get("errCode").getAsString();
        log.info("文件上传成功，状态码:" + code);

        //文件上传成功后文件会有一个异步处理过程，建议轮询文件状态，正常后发起签署
        //查询文件上传状态
        int i = 0;
        while (i < 3) {
            EsignHttpResponse fileStatus = getFileStatus(fileId);
            JsonObject fileStatusJsonObject = gson.fromJson(fileStatus.getBody(), JsonObject.class);
            String status = fileStatusJsonObject.getAsJsonObject("data").get("fileStatus").getAsString();
            log.info("查询文件状态执行第{}}次", i + 1);

            if ("2".equalsIgnoreCase(status) || "5".equalsIgnoreCase(status)) {//查询状态为2或者5代表文件准备完成
                log.info("文件准备完成");
                break;
            }

            log.info("文件未准备完成,等待两秒重新查询");
            try {
                TimeUnit.SECONDS.sleep(2);
            } catch (InterruptedException e) {
                throw new RuntimeException(e);
            }
            i++;
        }

        return fileId;
    }

    /**
     * 获取文件上传地址
     *
     * @return
     */
    public static EsignHttpResponse getUploadUrl(String filePath) throws EsignException {
        //自定义的文件封装类，传入文件地址可以获取文件的名称大小,文件流等数据
        EsignFileBean esignFileBean = new EsignFileBean(filePath);
        String apiaddr = "/v3/files/file-upload-url";
        //请求参数body体,json格式。get或者delete请求时jsonString传空json:"{}"或者null
        String jsonParm = "{\n" +
                "    \"contentMd5\": \"" + esignFileBean.getFileContentMD5() + "\",\n" +
                "    \"fileName\":\"" + esignFileBean.getFileName() + "\"," +
                "    \"fileSize\": " + esignFileBean.getFileSize() + ",\n" +
                "    \"convertToPDF\": false,\n" +
                "    \"contentType\": \"" + EsignHeaderConstant.CONTENTTYPE_STREAM.VALUE() + "\"\n" +
                "}";
        //请求方法
        EsignRequestType requestType = EsignRequestType.POST;
        //生成签名鉴权方式的的header
        Map<String, String> header = EsignHttpHelper.signAndBuildSignAndJsonHeader(props.getAppId(), props.getAppSecret(), jsonParm, requestType.name(), apiaddr, true);
        //发起接口请求
        return EsignHttpHelper.doCommHttp(props.getApiBaseUrl(), apiaddr, requestType, jsonParm, header, true);
    }

    /**
     * 文件流上传
     *
     * @return
     */
    public static EsignHttpResponse uploadFile(String uploadUrl, String filePath) throws EsignException {
        //根据文件地址获取文件contentMd5
        EsignFileBean esignFileBean = new EsignFileBean(filePath);
        //请求方法
        EsignRequestType requestType = EsignRequestType.PUT;
        return EsignHttpHelper.doUploadHttp(uploadUrl, requestType, esignFileBean.getFileBytes(), esignFileBean.getFileContentMD5(), EsignHeaderConstant.CONTENTTYPE_STREAM.VALUE(), true);
    }

    /**
     * 获取文件上传状态
     */
    public static EsignHttpResponse getFileStatus(String fileId) throws EsignException {
        String apiaddr = "/v3/files/" + fileId;

        //请求参数body体,json格式。get或者delete请求时jsonString传空json:"{}"或者null
        String jsonParm = null;
        //请求方法
        EsignRequestType requestType = EsignRequestType.GET;
        //生成签名鉴权方式的的header
        Map<String, String> header = EsignHttpHelper.signAndBuildSignAndJsonHeader(props.getAppId(), props.getAppSecret(), jsonParm, requestType.name(), apiaddr, true);
        //发起接口请求
        return EsignHttpHelper.doCommHttp(props.getApiBaseUrl(), apiaddr, requestType, jsonParm, header, true);
    }
}
