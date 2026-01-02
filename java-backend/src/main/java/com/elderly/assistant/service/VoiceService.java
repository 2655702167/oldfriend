package com.elderly.assistant.service;

import cn.hutool.http.HttpRequest;
import cn.hutool.http.HttpResponse;
import cn.hutool.json.JSONObject;
import cn.hutool.json.JSONUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.Base64;
import java.util.HashMap;
import java.util.Map;

/**
 * 语音识别服务
 * 调用百度语音识别API
 * 
 * @author 施汉霖
 */
@Service
public class VoiceService {

    private static final Logger log = LoggerFactory.getLogger(VoiceService.class);

    @Value("${api.baidu.voice.app-id}")
    private String appId;

    @Value("${api.baidu.voice.api-key}")
    private String apiKey;

    @Value("${api.baidu.voice.secret-key}")
    private String secretKey;

    /**
     * 语音识别（支持方言）
     * 
     * @param audioFile 音频文件
     * @param dialect   方言类型
     * @return 识别的文字
     */
    public String recognizeVoice(MultipartFile audioFile, String dialect) {
        try {
            // 1. 获取访问令牌
            String accessToken = getAccessToken();

            // 2. 将音频文件转为 Base64
            byte[] audioData = audioFile.getBytes();
            String base64Audio = Base64.getEncoder().encodeToString(audioData);

            // 3. 根据方言选择dev_pid（语言模型）
            int devPid = getDevPidByDialect(dialect);

            // 4. 调用百度语音识别 API
            String url = "https://vop.baidu.com/server_api";

            // 根据上传文件名自动判断音频格式（wav/pcm/amr等）
            String audioFormat = getAudioFormat(audioFile.getOriginalFilename());

            // 构建请求参数（百度标准版API支持pcm/wav/amr格式）
            JSONObject requestBody = new JSONObject();
            requestBody.set("format", audioFormat);
            requestBody.set("rate", 16000); // 采样率16000
            requestBody.set("channel", 1); // 单声道
            requestBody.set("cuid", "elderly_assistant");
            requestBody.set("token", accessToken);
            requestBody.set("speech", base64Audio);
            requestBody.set("len", audioData.length);
            requestBody.set("dev_pid", devPid); // 根据方言选择语言模型

            log.info("调用百度语音识别API，文件大小: {} bytes", audioData.length);

            HttpResponse response = HttpRequest.post(url)
                    .header("Content-Type", "application/json")
                    .body(requestBody.toString())
                    .timeout(30000)
                    .execute();

            String responseBody = response.body();
            log.info("百度语音识别响应: {}", responseBody);

            JSONObject result = JSONUtil.parseObj(responseBody);

            // 4. 解析结果
            if (result.getInt("err_no") == 0) {
                // 正常返回结果数组
                if (result.containsKey("result") && result.getJSONArray("result") != null
                        && !result.getJSONArray("result").isEmpty()) {
                    String text = result.getJSONArray("result").getStr(0);
                    if (text != null) {
                        text = text.trim();
                    }
                    // text 可能为空字符串，此时交给前端去做“没听清”的提示
                    return text == null ? "" : text;
                } else {
                    log.warn("语音识别结果列表为空");
                    return "";
                }
            } else {
                log.error("语音识别失败: {}", result.getStr("err_msg"));
                return "识别失败：" + result.getStr("err_msg");
            }

        } catch (Exception e) {
            log.error("语音识别异常", e);
            return "识别异常：" + e.getMessage();
        }
    }

    /**
     * 获取百度 API 访问令牌
     */
    private String getAccessToken() {
        String url = String.format(
                "https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=%s&client_secret=%s",
                apiKey, secretKey);

        HttpResponse response = HttpRequest.post(url).execute();
        String body = response.body();
        log.info("获取AccessToken响应: {}", body);
        JSONObject result = JSONUtil.parseObj(body);

        if (result.containsKey("error")) {
            log.error("获取AccessToken失败: {}", result.getStr("error_description"));
            return null;
        }

        return result.getStr("access_token");
    }

    /**
     * 兼容旧版本（不传方言参数）
     */
    public String recognizeVoice(MultipartFile audioFile) {
        return recognizeVoice(audioFile, "普通话");
    }

    /**
     * 根据方言获取百度API的dev_pid参数
     * dev_pid: 语言模型编号
     */
    private int getDevPidByDialect(String dialect) {
        if (dialect == null) {
            return 1537; // 默认普通话
        }

        switch (dialect) {
            case "普通话":
                return 1537; // 普通话(支持简单的英文识别)
            case "英语":
                return 1737; // 英语
            case "粤语":
            case "广东话":
                return 1637; // 粤语
            case "四川话":
                return 1837; // 四川话
            case "上海话":
                return 1936; // 上海话
            case "闽南话":
            case "福建话":
            case "长沙话":
            case "湖南话":
            case "杭州话":
            case "浙江话":
            case "东北话":
            case "陕西话":
            case "河南话":
            case "客家话":
                // 百度API暂不直接支持这些方言，使用普通话模型
                log.warn("方言 {} 暂不直接支持，使用普通话模型", dialect);
                return 1537;
            default:
                log.warn("未识别的方言: {}, 使用普通话模型", dialect);
                return 1537; // 默认普通话
        }
    }

    /**
     * 根据文件名获取音频格式
     */
    private String getAudioFormat(String filename) {
        if (filename == null)
            return "wav";

        String lowerName = filename.toLowerCase();
        if (lowerName.endsWith(".mp3"))
            return "mp3";
        if (lowerName.endsWith(".wav"))
            return "wav";
        if (lowerName.endsWith(".pcm"))
            return "pcm";
        if (lowerName.endsWith(".amr"))
            return "amr";

        // 微信小程序录音默认格式
        return "mp3";
    }

    /**
     * 语音合成（TTS）
     * 
     * @param text    需要合成的文本
     * @param dialect 方言
     * @return 音频二进制数据
     */
    public byte[] synthesizeVoice(String text, String dialect) {
        try {
            String accessToken = getAccessToken();
            String url = "http://tsn.baidu.com/text2audio";

            // 构建请求参数
            Map<String, Object> params = new HashMap<>();
            params.put("tex", text);
            params.put("tok", accessToken);
            params.put("cuid", "elderly_assistant");
            params.put("ctp", 1);

            // 处理方言设置
            if ("粤语".equals(dialect)) {
                params.put("lan", "cto"); // 粤语
                params.put("per", 0); // 默认女声
            } else {
                params.put("lan", "zh"); // 普通话
                // 根据方言选择不同的音色（模拟方言感，百度标准版TTS不支持直接方言合成，除了粤语）
                if ("四川话".equals(dialect)) {
                    params.put("per", 3); // 度逍遥（情感男声）- 稍微活泼一点
                } else if ("东北话".equals(dialect)) {
                    params.put("per", 4); // 度丫丫（情感女声）
                } else {
                    params.put("per", 0); // 默认女声
                }
            }

            log.info("调用百度语音合成API，文本: {}, 方言: {}", text, dialect);

            HttpResponse response = HttpRequest.post(url)
                    .form(params)
                    .timeout(10000)
                    .execute();

            if (response.getStatus() == 200) {
                String contentType = response.header("Content-Type");
                if (contentType != null && contentType.contains("audio")) {
                    return response.bodyBytes();
                } else {
                    log.error("语音合成失败，响应非音频: {}", response.body());
                    return null;
                }
            } else {
                log.error("语音合成请求失败: {}", response.getStatus());
                return null;
            }

        } catch (Exception e) {
            log.error("语音合成异常", e);
            return null;
        }
    }
}
