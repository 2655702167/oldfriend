// TaxiAddressProcessService.java - 处理地址的核心逻辑
package com.elderly.assistant.service;

import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import com.elderly.assistant.dto.TaxiAddressDTO;
import com.elderly.assistant.entity.TaxiCommonAddress;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 打车地址处理服务
 * 功能：处理输入框的地址，优化后返回给前端
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class TaxiAddressProcessService {
    
    private final TaxiAddressService taxiAddressService;
    
    // 知名地标（不需要加城市前缀）
    private static final Set<String> WELL_KNOWN_LANDMARKS = new HashSet<>(Arrays.asList(
        "天安门", "故宫", "长城", "颐和园", "鸟巢", "水立方",
        "东方明珠", "外滩", "迪士尼", "广州塔", "西湖", "兵马俑"
    ));
    
    /**
     * 处理打车地址（主方法）
     */
    public TaxiAddressDTO processAddress(TaxiAddressDTO request) {
        log.info("处理打车地址，用户: {}, 地址: {}", request.getUserId(), request.getDestination());
        
        try {
            // 1. 基础校验
            if (!StringUtils.hasText(request.getDestination())) {
                return TaxiAddressDTO.error(
                    request.getUserId(), 
                    "", 
                    "目的地不能为空"
                );
            }
            
            // 2. 检查是否为常用地址
            TaxiCommonAddress commonAddress = findInCommonAddresses(request);
            if (commonAddress != null) {
                return processCommonAddress(request, commonAddress);
            }
            
            // 3. 处理普通地址
            return processNewAddress(request);
            
        } catch (Exception e) {
            log.error("地址处理异常", e);
            return handleError(request, e);
        }
    }
    
    /**
     * 在常用地址中查找
     */
    private TaxiCommonAddress findInCommonAddresses(TaxiAddressDTO request) {
        try {
            List<TaxiCommonAddress> addresses = taxiAddressService.getUserAddresses(request.getUserId());
            if (addresses.isEmpty()) {
                return null;
            }
            
            String searchKey = request.getDestination().trim().toLowerCase();
            
            // 精确匹配优先
            for (TaxiCommonAddress addr : addresses) {
                if (addr.getDisplayName() != null && 
                    addr.getDisplayName().toLowerCase().contains(searchKey)) {
                    return addr;
                }
            }
            
            // 模糊匹配
            for (TaxiCommonAddress addr : addresses) {
                if (addr.getAddress() != null && 
                    addr.getAddress().toLowerCase().contains(searchKey)) {
                    return addr;
                }
            }
            
        } catch (Exception e) {
            log.warn("查询常用地址失败", e);
        }
        
        return null;
    }
    
    /**
     * 处理常用地址
     */
    private TaxiAddressDTO processCommonAddress(TaxiAddressDTO request, TaxiCommonAddress commonAddress) {
        log.info("找到常用地址: {}", commonAddress.getDisplayName());
        
        // 1. 构建响应
        TaxiAddressDTO response = TaxiAddressDTO.success(
            request.getUserId(), 
            request.getDestination()
        );
        
        // 2. 设置常用地址信息
        response.setOptimizedAddress(commonAddress.getDisplayName());
        response.setDestLongitude(commonAddress.getLongitude());
        response.setDestLatitude(commonAddress.getLatitude());
        response.setFromHistory(true);
        response.setConfidence(95);
        response.setAddressType("常用地址");
        
        // 3. 生成剪贴板文本
        response.setClipboardText(generateClipboardText(response, true));
        
        // 4. 生成操作指南
        response.setPasteGuide(generatePasteGuide(request, response));
        response.setJumpTip(generateJumpTip(request, true));
        
        // 5. 更新使用时间
        taxiAddressService.updateAddressUsage(commonAddress.getAddrId());
        
        return response;
    }
    
    /**
     * 处理新地址
     */
    private TaxiAddressDTO processNewAddress(TaxiAddressDTO request) {
        // 1. 标准化地址
        String optimized = standardizeAddress(request);
        log.info("地址标准化: {} -> {}", request.getDestination(), optimized);
        
        // 2. 构建响应
        TaxiAddressDTO response = TaxiAddressDTO.success(
            request.getUserId(), 
            request.getDestination()
        );
        
        response.setOptimizedAddress(optimized);
        response.setFromHistory(false);
        response.setConfidence(calculateConfidence(optimized));
        
        // 3. 尝试获取坐标（如果有API）
        try {
            Map<String, Object> geoInfo = geocodeAddress(optimized, request.getCity());
            if (geoInfo != null) {
                response.setDestLongitude((Double) geoInfo.get("longitude"));
                response.setDestLatitude((Double) geoInfo.get("latitude"));
                response.setAddressType((String) geoInfo.get("type"));
                response.setConfidence(Math.max(response.getConfidence(), 
                    (Integer) geoInfo.getOrDefault("confidence", 70)));
            }
        } catch (Exception e) {
            log.warn("地理编码失败，不影响主流程: {}", e.getMessage());
        }
        
        // 4. 生成剪贴板文本
        response.setClipboardText(generateClipboardText(response, false));
        
        // 5. 生成操作指南
        response.setPasteGuide(generatePasteGuide(request, response));
        response.setJumpTip(generateJumpTip(request, false));
        
        // 6. 设置平台信息
        setPlatformInfo(response, request.getPlatform());
        
        return response;
    }
    
    /**
     * 地址标准化
     */
    private String standardizeAddress(TaxiAddressDTO request) {
        String address = request.getDestination().trim();
        
        // 移除常见语气词
        address = address.replaceAll("(我要去|我想去|我要到|打车去|到|去|的|那个|这个)", "");
        
        // 移除模糊词（保留地址中的"附近"，只在结尾时移除）
        address = address.replaceAll("(附近|旁边|周围|边上|这里|那里)$", "");
        
        // 清理空白字符
        address = address.replaceAll("\\s+", " ").trim();
        
        // 添加城市前缀（如果需要）
        if (StringUtils.hasText(request.getCity()) && 
            !address.contains("市") && !address.contains("区") && !address.contains("县")) {
            
            if (!isWellKnownLandmark(address)) {
                address = request.getCity() + address;
            }
        }
        
        return address;
    }
    
    /**
     * 计算置信度
     */
    private int calculateConfidence(String address) {
        int confidence = 60; // 基础分
        
        // 包含城市加分
        if (address.contains("市") || address.contains("区")) {
            confidence += 10;
        }
        
        // 包含详细地址加分
        if (address.contains("路") || address.contains("街") || address.contains("号")) {
            confidence += 15;
        }
        
        // 地标建筑加分
        if (isWellKnownLandmark(address)) {
            confidence += 10;
        }
        
        // 地址太短减分
        if (address.length() < 3) {
            confidence -= 20;
        }
        
        return Math.min(Math.max(confidence, 0), 100);
    }
    
    /**
     * 地理编码（简化版，实际需要调用地图API）
     */
    private Map<String, Object> geocodeAddress(String address, String city) {
        // 这里只是示例，实际需要集成地图API
        // 返回null表示没有获取到坐标，不影响主流程
        return null;
    }
    
    /**
     * 生成剪贴板文本
     */
    private String generateClipboardText(TaxiAddressDTO response, boolean fromHistory) {
        if (fromHistory && response.getOptimizedAddress() != null) {
            return response.getOptimizedAddress();
        }
        return response.getDestination();
    }
    
    /**
     * 生成粘贴指南
     */
    private String generatePasteGuide(TaxiAddressDTO request, TaxiAddressDTO response) {
        StringBuilder guide = new StringBuilder();
        
        guide.append("✅ 地址已准备就绪\n\n");
        guide.append("📍 ").append(response.getOptimizedAddress()).append("\n\n");
        
        if (Boolean.TRUE.equals(response.getFromHistory())) {
            guide.append("📌 来自您的常用地址\n");
        }
        
        guide.append("\n操作步骤：\n");
        guide.append("1. 点击下方「复制地址」\n");
        guide.append("2. 跳转到").append(response.getPlatformName()).append("\n");
        guide.append("3. 长按目的地输入框\n");
        guide.append("4. 点击「粘贴」\n");
        guide.append("5. 选择准确位置后叫车");
        
        return guide.toString();
    }
    
    /**
     * 生成跳转提示
     */
    private String generateJumpTip(TaxiAddressDTO request, boolean fromHistory) {
        String platform = request.getPlatform().toLowerCase();
        
        switch (platform) {
            case "didi":
                return fromHistory ? 
                    "常用地址，跳转滴滴后直接粘贴" : 
                    "跳转滴滴后粘贴地址，确认位置";
            case "gaode":
                return "跳转高德，多平台比价更优惠";
            case "meituan":
                return "跳转美团，新人优惠多";
            default:
                return "跳转打车软件粘贴地址";
        }
    }
    
    /**
     * 设置平台信息
     */
    private void setPlatformInfo(TaxiAddressDTO response, String platform) {
        switch (platform.toLowerCase()) {
            case "didi":
                response.setPlatformName("滴滴出行");
                response.setPlatformIcon("🚗");
                break;
            case "gaode":
                response.setPlatformName("高德打车");
                response.setPlatformIcon("🗺️");
                break;
            case "meituan":
                response.setPlatformName("美团打车");
                response.setPlatformIcon("🍔");
                break;
            default:
                response.setPlatformName("打车平台");
                response.setPlatformIcon("🚖");
        }
    }
    
    /**
     * 错误处理
     */
    private TaxiAddressDTO handleError(TaxiAddressDTO request, Exception e) {
        TaxiAddressDTO errorResponse = TaxiAddressDTO.error(
            request.getUserId(),
            request.getDestination(),
            "地址处理失败，请重试"
        );
        
        // 错误时仍返回基本可用的数据
        errorResponse.setOptimizedAddress(request.getDestination());
        errorResponse.setClipboardText(request.getDestination());
        errorResponse.setPasteGuide("请直接复制地址到打车软件");
        errorResponse.setConfidence(30);
        
        return errorResponse;
    }
    
    /**
     * 检查是否为知名地标
     */
    private boolean isWellKnownLandmark(String address) {
        return WELL_KNOWN_LANDMARKS.stream()
            .anyMatch(landmark -> address.contains(landmark));
    }
}