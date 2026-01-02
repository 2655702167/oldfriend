package com.elderly.assistant.controller;

import com.elderly.assistant.common.Result;
import com.elderly.assistant.service.VoiceService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.Map;

/**
 * 语音识别接口
 * 
 * @author 施汉霖
 */
@RestController
@RequestMapping("/voice")
public class VoiceController {

    private static final Logger log = LoggerFactory.getLogger(VoiceController.class);

    @Autowired
    private VoiceService voiceService;

    /**
     * 语音识别（支持方言）
     * 
     * @param file    音频文件
     * @param dialect 方言类型（可选：普通话、粤语、四川话、上海话、东北话等）
     * @return 识别结果
     */
    @PostMapping("/recognize")
    public Result<Map<String, String>> recognizeVoice(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "dialect", required = false, defaultValue = "普通话") String dialect) {

        log.info("收到语音识别请求，文件名: {}, 大小: {} bytes, 方言: {}",
                file.getOriginalFilename(), file.getSize(), dialect);

        try {
            // 调用语音识别服务（传入方言参数）
            String text = voiceService.recognizeVoice(file, dialect);

            Map<String, String> data = new HashMap<>();
            data.put("text", text);
            data.put("dialect", dialect);

            log.info("语音识别成功: {}, 使用方言: {}", text, dialect);
            return Result.success(data);

        } catch (Exception e) {
            log.error("语音识别失败", e);
            return Result.error("语音识别失败：" + e.getMessage());
        }
    }

    /**
     * 语音合成（TTS）
     * 
     * @param text    需要合成的文本
     * @param dialect 方言（可选）
     */
    @GetMapping("/synthesize")
    public void synthesize(@RequestParam("text") String text,
            @RequestParam(value = "dialect", required = false, defaultValue = "普通话") String dialect,
            javax.servlet.http.HttpServletResponse response) {
        try {
            byte[] audioData = voiceService.synthesizeVoice(text, dialect);
            if (audioData != null) {
                response.setContentType("audio/mp3");
                response.getOutputStream().write(audioData);
                response.getOutputStream().flush();
            } else {
                response.setStatus(500);
            }
        } catch (Exception e) {
            log.error("语音合成响应异常", e);
            response.setStatus(500);
        }
    }
}
