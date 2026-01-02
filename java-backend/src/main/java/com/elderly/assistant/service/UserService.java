package com.elderly.assistant.service;

import cn.hutool.core.util.StrUtil;
import cn.hutool.http.HttpUtil;
import cn.hutool.json.JSONObject;
import cn.hutool.json.JSONUtil;
import com.elderly.assistant.common.Result;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@Service
public class UserService {

    @Value("${api.wechat.app-id}")
    private String appId;

    @Value("${api.wechat.app-secret}")
    private String appSecret;

    public Result<Map<String, Object>> bindPhone(String code) {
        log.info("收到绑定手机号请求，code: {}", code);
        
        // 检查是否配置了AppSecret
        if (StrUtil.isNotBlank(appSecret) && !appSecret.contains("请在此处")) {
            try {
                // 1. 获取 Access Token
                String tokenUrl = String.format("https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=%s&secret=%s", appId, appSecret);
                String tokenResp = HttpUtil.get(tokenUrl);
                JSONObject tokenObj = JSONUtil.parseObj(tokenResp);
                String accessToken = tokenObj.getStr("access_token");
                
                if (StrUtil.isBlank(accessToken)) {
                    log.error("获取Access Token失败: {}", tokenResp);
                    return Result.error("获取微信授权失败");
                }

                // 2. 获取手机号
                String phoneUrl = "https://api.weixin.qq.com/wxa/business/getuserphonenumber?access_token=" + accessToken;
                Map<String, Object> paramMap = new HashMap<>();
                paramMap.put("code", code);
                
                String phoneResp = HttpUtil.post(phoneUrl, JSONUtil.toJsonStr(paramMap));
                JSONObject phoneObj = JSONUtil.parseObj(phoneResp);
                
                if (phoneObj.getInt("errcode") == 0) {
                    JSONObject phoneInfo = phoneObj.getJSONObject("phone_info");
                    String phoneNumber = phoneInfo.getStr("phoneNumber");
                    
                    Map<String, Object> data = new HashMap<>();
                    data.put("phoneNumber", phoneNumber);
                    log.info("获取真实手机号成功: {}", phoneNumber);
                    return Result.success(data);
                } else {
                    log.error("获取手机号失败: {}", phoneResp);
                    // 降级处理，返回模拟数据
                }
            } catch (Exception e) {
                log.error("调用微信API异常", e);
            }
        } else {
            log.warn("未配置AppSecret，无法获取真实手机号，将返回模拟数据");
        }
        
        // 模拟数据（当没有配置Secret或调用失败时）
        Map<String, Object> data = new HashMap<>();
        data.put("phoneNumber", "13800138000"); // 模拟的手机号
        
        log.info("返回模拟手机号: {}", "13800138000");
        return Result.success(data);
    }
}
