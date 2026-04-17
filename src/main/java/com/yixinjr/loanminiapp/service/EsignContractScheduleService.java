package com.yixinjr.loanminiapp.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.yixinjr.loanminiapp.entity.OrderBorrower;
import com.yixinjr.loanminiapp.entity.OrderContract;
import com.yixinjr.loanminiapp.mapper.OrderBorrowerMapper;
import com.yixinjr.loanminiapp.mapper.OrderContractMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.concurrent.atomic.AtomicBoolean;

@Slf4j
@Service
@RequiredArgsConstructor
public class EsignContractScheduleService {

    private final OrderContractMapper orderContractMapper;
    private final OrderBorrowerMapper orderBorrowerMapper;
    private final ContractService contractService;
    private final EsignService esignService;
    private final AtomicBoolean running = new AtomicBoolean(false);

    /**
     * 每2秒推进一次电子签流程：
     * 0 -> 上传文件成功(1)
     * 1 -> 发起签署(2)
     * 3 -> 下载已签文件(4)
     * 异常时不推进状态，下一轮任务可继续处理。
     */
    @Scheduled(fixedDelay = 2000)
    public void advanceContractStatus() {
        // 防重入：上一次调度还没结束时，直接跳过本轮。
        if (!running.compareAndSet(false, true)) {
            log.warn("[ESIGN_SCHEDULE] 上一轮任务仍在执行，跳过本轮");
            return;
        }
        try {
        List<OrderContract> contracts = orderContractMapper.selectList(new LambdaQueryWrapper<OrderContract>()
                .in(OrderContract::getStatus, 0, 1, 3));
        if (contracts == null || contracts.isEmpty()) {
            return;
        }
        for (OrderContract contract : contracts) {
            try {
                processContractSequentially(contract);
            } catch (Exception e) {
                log.error("[ESIGN_SCHEDULE] 推进失败 contractId={}, status={}", contract.getId(), contract.getStatus(), e);
            }
        }
        } finally {
            running.set(false);
        }
    }

    /**
     * 单合同在一次调度内尽量连贯推进：
     * - 正常发起链路：0 -> 1 -> 2
     * - 签署完成后下载链路：3 -> 4
     * 出错时立即停在当前状态，等待下一轮定时任务重试。
     */
    private void processContractSequentially(OrderContract contract) {
        int guard = 0;
        while (guard++ < 5) {
            int status = contract.getStatus() == null ? 0 : contract.getStatus();
            boolean progressed;
            if (status == 0) {
                progressed = handleUpload(contract);
            } else if (status == 1) {
                progressed = handleCreateFlow(contract);
            } else if (status == 3) {
                progressed = handleDownload(contract);
            } else {
                break;
            }
            // 本轮没有推进（如依赖条件不足/外部接口失败），交给下一轮重试
            if (!progressed) {
                break;
            }
        }
    }

    private boolean handleUpload(OrderContract contract) {
        Path pdfPath = contractService.resolveUploadedFilePath(contract.getLocalPath());
        if (pdfPath == null || !Files.exists(pdfPath)) {
            log.warn("[ESIGN_SCHEDULE] 合同本地文件不存在 contractId={}, localPath={}", contract.getId(), contract.getLocalPath());
            return false;
        }
        String fileId = esignService.uploadContractFile(pdfPath);
        if (StringUtils.isBlank(fileId)) {
            return false;
        }
        contract.setFileId(fileId);
        contract.setStatus(1);
        orderContractMapper.updateById(contract);
        return true;
    }

    private boolean handleCreateFlow(OrderContract contract) {
        if (StringUtils.isBlank(contract.getFileId())) {
            log.warn("[ESIGN_SCHEDULE] fileId为空，无法发起签署 contractId={}", contract.getId());
            return false;
        }
        OrderBorrower borrower = orderBorrowerMapper.selectOne(new LambdaQueryWrapper<OrderBorrower>()
                .eq(OrderBorrower::getOrderId, contract.getOrderId())
                .eq(OrderBorrower::getRoleType, "borrower")
                .last("LIMIT 1"));
        if (borrower == null) {
            log.warn("[ESIGN_SCHEDULE] 借款人不存在，无法发起签署 contractId={}, orderId={}", contract.getId(), contract.getOrderId());
            return false;
        }
        String flowId = esignService.createFlowByUploadedFile(contract.getName(), borrower, contract.getFileId(), contract.getName() + ".pdf");
        if (StringUtils.isBlank(flowId)) {
            return false;
        }
        contract.setFlowId(flowId);
        contract.setStatus(2);
        orderContractMapper.updateById(contract);
        return true;
    }

    private boolean handleDownload(OrderContract contract) {
        if (StringUtils.isBlank(contract.getFlowId())) {
            log.warn("[ESIGN_SCHEDULE] flowId为空，无法下载已签文件 contractId={}", contract.getId());
            return false;
        }
        String downloadUrl = esignService.fetchSignedFileDownloadUrl(contract.getFlowId());
        if (StringUtils.isBlank(downloadUrl)) {
            return false;
        }
        String relativePath;
        try {
            relativePath = contractService.saveSignedContractFromUrl(contract.getOrderId(), downloadUrl);
        } catch (Exception e) {
            log.error("[ESIGN_SCHEDULE] 下载并保存已签文件失败 contractId={}, flowId={}", contract.getId(), contract.getFlowId(), e);
            return false;
        }
        contract.setLocalPath(relativePath);
        contract.setPdfUrl(contractService.buildContractUrl(relativePath));
        contract.setStatus(4);
        orderContractMapper.updateById(contract);
        return true;
    }
}

