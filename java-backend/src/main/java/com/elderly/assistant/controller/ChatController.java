package com.elderly.assistant.controller;

import com.elderly.assistant.common.Result;
import com.elderly.assistant.service.ChatService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * 智能陪聊接口
 * 
 * @author 施汉霖
 */
@Slf4j
@RestController
@RequestMapping("/chat")
@CrossOrigin
public class ChatController {

    @Autowired
    private ChatService chatService;

    /**
     * 智能对话
     * POST /chat/talk
     * 
     * @param request 对话请求
     * @return AI回复
     */
    @PostMapping("/talk")
    public Result<Map<String, Object>> chat(@RequestBody ChatRequest request) {
        log.info("收到对话请求，用户ID: {}, 消息: {}", request.getUserId(), request.getMessage());

        try {
            String userMessage = request.getMessage();
            String userId = request.getUserId();

            // 调用对话服务获取AI回复
            String aiReply = chatService.getAIReply(userId, userMessage);

            Map<String, Object> data = new HashMap<>();
            data.put("reply", aiReply);
            data.put("timestamp", System.currentTimeMillis());

            log.info("AI回复: {}", aiReply);
            return Result.success(data);

        } catch (Exception e) {
            log.error("对话处理失败", e);
            return Result.error("对话失败：" + e.getMessage());
        }
    }

    /**
     * 对话请求类
     */
    public static class ChatRequest {
        private String userId;
        private String message;

        public String getUserId() {
            return userId;
        }

        public void setUserId(String userId) {
            this.userId = userId;
        }

        public String getMessage() {
            return message;
        }

        public void setMessage(String message) {
            this.message = message;
        }
    }
}
