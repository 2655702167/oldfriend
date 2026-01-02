package com.elderly.assistant.controller;

import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.elderly.assistant.common.Result;
import com.elderly.assistant.entity.PaymentItem;
import com.elderly.assistant.service.PaymentService;

import cn.hutool.core.util.StrUtil;
/**
 * 生活缴费API控制器
 * 对应前端API调用指南中的 /payment 接口
 *
 * @author 施汉霖
 */
@RestController
@RequestMapping("/payment")
@CrossOrigin
public class PaymentController {

    private static final Logger log = LoggerFactory.getLogger(PaymentController.class);

    @Autowired
    private PaymentService paymentService;

    /**
     * 查询用户待缴费项目
     * GET /payment/unpaid-items?user_id=xxx
     *
     * @param userId 用户ID
     * @return 缴费项目列表
     */
    @GetMapping("/unpaid-items")
    public Result<List<PaymentItem>> getUnpaidItems(@RequestParam("user_id") String userId) {
        log.info("查询待缴费项目，userId: {}", userId);
        try {
            List<PaymentItem> items = paymentService.getUserPaymentItems(userId);
            return Result.success(items);
        } catch (Exception e) {
            log.error("查询待缴费项目失败", e);
            return Result.error(e.getMessage());
        }
    }

    /**
     * 查询缴费历史
     * GET /payment/history?user_id=xxx
     *
     * @param userId 用户ID
     * @return 缴费历史列表
     */
    @GetMapping("/history")
    public Result<List<PaymentItem>> getPaymentHistory(@RequestParam("user_id") String userId) {
        log.info("查询缴费历史，userId: {}", userId);
        try {
            List<PaymentItem> items = paymentService.getUserPaymentItems(userId);
            return Result.success(items);
        } catch (Exception e) {
            log.error("查询缴费历史失败", e);
            return Result.error(e.getMessage());
        }
    }

    /**
     * 语音支付（返回Mock数据）
     * POST /payment/voice-pay
     *
     * @param request 请求参数
     * @return 支付结果
     */
    @PostMapping("/voice-pay")
    public Result<?> voicePay(@RequestBody VoicePayRequest request) {
        log.info("语音支付，userId: {}, sessionId: {}", request.getUserId(), request.getSessionId());
        
        try {
            // Mock返回数据
            VoicePayResponse response = new VoicePayResponse();
            response.setSessionId("SESSION_" + System.currentTimeMillis());
            response.setReplyText("您好，请问需要缴纳什么费用？");
            response.setNeedTts(true);
            
            return Result.success(response);
        } catch (Exception e) {
            log.error("语音支付失败", e);
            return Result.error(e.getMessage());
        }
    }

    /**
     * 标记缴费项目为已支付
     * POST /payment/mark-paid
     *
     * @param itemId 缴费项目ID
     * @return 操作结果
     */
    @PostMapping("/mark-paid")
    public Result<?> markAsPaid(@RequestParam("item_id") String itemId) {
        log.info("标记为已支付，itemId: {}", itemId);
        try {
            boolean success = paymentService.markAsPaid(itemId);
            return success ? Result.success() : Result.error("标记失败");
        } catch (Exception e) {
            log.error("标记为已支付失败", e);
            return Result.error(e.getMessage());
        }
    }

    /**
     * 创建缴费项目
     * POST /payment/create-item
     */
    @PostMapping("/create-item")
    public Result<?> createPaymentItem(@RequestBody PaymentItem paymentItem) {
        log.info("创建缴费项目，userId: {}, type: {}", 
                 paymentItem.getUserId(), paymentItem.getItemType());
        try {
            boolean success = paymentService.createPaymentItem(paymentItem);
            return success ? Result.success() : Result.error("创建失败");
        } catch (Exception e) {
            log.error("创建缴费项目失败", e);
            return Result.error(e.getMessage());
        }
    }

    /**
     * 更新缴费项目
     * GET /payment/update?user_id=xxx
     */
    @PutMapping("/item/update")
    public Result<?> updatePaymentItem(@RequestBody PaymentItem paymentItem) {
        log.info("更新缴费项目，itemId: {}, userId: {}", 
                 paymentItem.getItemId(), paymentItem.getUserId());
        
        try {
            // 验证必填参数
            if (StrUtil.isEmpty(paymentItem.getItemId())) {
                return Result.error("缴费项目ID不能为空");
            }
            if (StrUtil.isEmpty(paymentItem.getUserId())) {
                return Result.error("用户ID不能为空");
            }
            
            // 执行更新
            boolean success = paymentService.updatePaymentItem(paymentItem);
            
            if (success) {
                log.info("更新缴费项目成功，itemId: {}", paymentItem.getItemId());
                return Result.success("更新成功");
            } else {
                return Result.error("更新失败");
            }
            
        } catch (Exception e) {
            log.error("更新缴费项目失败，itemId: {}", paymentItem.getItemId(), e);
            return Result.error("更新失败: " + e.getMessage());
        }
    }

    /**
     * 搜索缴费项目
     * POST /payment/search
     * @PostMapping("/search")
    public Result<List<PaymentItem>> searchPaymentItems(
            @RequestParam("user_id") String userId,
            @RequestBody Map<String, Object> searchParams) {
        log.info("搜索缴费项目，userId: {}, params: {}", userId, searchParams);
        try {
            List<PaymentItem> items = paymentService.searchItems(userId, searchParams);
            return Result.success(items);
        } catch (Exception e) {
            log.error("搜索缴费项目失败", e);
            return Result.error(e.getMessage());
        }
    }
     */
    

    // ==================== 内部类：请求响应对象 ====================

    static class VoicePayRequest {
        private String userId;
        private String audioData;
        private String sessionId;

        public String getUserId() {
            return userId;
        }

        public void setUserId(String userId) {
            this.userId = userId;
        }

        public String getAudioData() {
            return audioData;
        }

        public void setAudioData(String audioData) {
            this.audioData = audioData;
        }

        public String getSessionId() {
            return sessionId;
        }

        public void setSessionId(String sessionId) {
            this.sessionId = sessionId;
        }
    }

    static class VoicePayResponse {
        private String sessionId;
        private String replyText;
        private Boolean needTts;
        private PaymentOrder paymentOrder;

        public String getSessionId() {
            return sessionId;
        }

        public void setSessionId(String sessionId) {
            this.sessionId = sessionId;
        }

        public String getReplyText() {
            return replyText;
        }

        public void setReplyText(String replyText) {
            this.replyText = replyText;
        }

        public Boolean getNeedTts() {
            return needTts;
        }

        public void setNeedTts(Boolean needTts) {
            this.needTts = needTts;
        }

        public PaymentOrder getPaymentOrder() {
            return paymentOrder;
        }

        public void setPaymentOrder(PaymentOrder paymentOrder) {
            this.paymentOrder = paymentOrder;
        }
    }

    static class PaymentOrder {
        private String timeStamp;
        private String nonceStr;
        private String packageStr;
        private String paySign;

        public String getTimeStamp() {
            return timeStamp;
        }

        public void setTimeStamp(String timeStamp) {
            this.timeStamp = timeStamp;
        }

        public String getNonceStr() {
            return nonceStr;
        }

        public void setNonceStr(String nonceStr) {
            this.nonceStr = nonceStr;
        }

        public String getPackageStr() {
            return packageStr;
        }

        public void setPackageStr(String packageStr) {
            this.packageStr = packageStr;
        }

        public String getPaySign() {
            return paySign;
        }

        public void setPaySign(String paySign) {
            this.paySign = paySign;
        }
    }
}
