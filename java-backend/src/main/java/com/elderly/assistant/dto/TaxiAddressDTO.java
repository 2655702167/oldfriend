// TaxiAddressDTO.java - 接收前端输入，返回JSON给前端
package com.elderly.assistant.dto;

import java.io.Serializable;

import javax.validation.constraints.NotBlank;

import lombok.Data;

/**
 * 打车地址处理DTO
 * 从前端输入框获取地址，处理后返回JSON给前端
 */
@Data
public class TaxiAddressDTO implements Serializable {
    private static final long serialVersionUID = 1L;
    
    // === 接收前端输入的参数 ===
    @NotBlank(message = "用户ID不能为空")
    private String userId;
    
    @NotBlank(message = "目的地不能为空")
    private String destination;  // 输入框地址
    
    // 当前位置（可选，用于地址优化）
    private Double longitude;
    private Double latitude;
    private String city;
    
    // 平台类型
    private String platform = "didi"; // didi/gaode/meituan
    
    // === 处理后返回给前端的参数 ===
    // 优化后的地址信息
    private String optimizedAddress;
    private String clipboardText;     // 剪贴板内容
    private String pasteGuide;        // 粘贴操作指南
    private Integer confidence = 0;   // 置信度 0-100
    
    // 地理坐标（如果解析成功）
    private Double destLongitude;
    private Double destLatitude;
    private String addressType;
    
    // 状态信息
    private Boolean success = true;
    private String message = "成功";
    private Boolean fromHistory = false; // 是否来自历史记录
    
    // 平台跳转信息（前端已实现跳转，这里提供辅助信息）
    private String platformName = "滴滴出行";
    private String platformIcon = "🚗";
    private String jumpTip;           // 跳转提示
    
    /**
     * 创建成功的响应对象
     */
    public static TaxiAddressDTO success(String userId, String destination) {
        TaxiAddressDTO dto = new TaxiAddressDTO();
        dto.setUserId(userId);
        dto.setDestination(destination);
        dto.setSuccess(true);
        dto.setMessage("地址处理成功");
        return dto;
    }
    
    /**
     * 创建失败的响应对象
     */
    public static TaxiAddressDTO error(String userId, String destination, String message) {
        TaxiAddressDTO dto = new TaxiAddressDTO();
        dto.setUserId(userId);
        dto.setDestination(destination);
        dto.setSuccess(false);
        dto.setMessage(message);
        // 失败时至少返回原始地址
        dto.setOptimizedAddress(destination);
        dto.setClipboardText(destination);
        return dto;
    }
}