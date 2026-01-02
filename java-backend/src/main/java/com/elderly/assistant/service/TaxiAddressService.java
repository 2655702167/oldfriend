package com.elderly.assistant.service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.elderly.assistant.entity.TaxiCommonAddress;
import com.elderly.assistant.mapper.TaxiCommonAddressMapper;

import cn.hutool.core.util.IdUtil;
import cn.hutool.core.util.StrUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 打车常用地址服务
 * 功能：管理用户的常用地址，供打车时直接使用
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class TaxiAddressService extends ServiceImpl<TaxiCommonAddressMapper, TaxiCommonAddress> {
    
    private final TaxiCommonAddressMapper taxiAddressMapper;
    
    /**
     * 添加常用地址
     */
    @Transactional(rollbackFor = Exception.class)
    public boolean addCommonAddress(TaxiCommonAddress address) {
        log.info("添加常用地址，用户: {}, 地址: {}", address.getUserId(), address.getDisplayName());
        
        // 验证必填字段
        if (StrUtil.isEmpty(address.getUserId())) {
            throw new IllegalArgumentException("用户ID不能为空");
        }
        if (StrUtil.isEmpty(address.getDisplayName())) {
            throw new IllegalArgumentException("显示名称不能为空");
        }
        if (StrUtil.isEmpty(address.getAddress())) {
            throw new IllegalArgumentException("详细地址不能为空");
        }
        if (address.getLongitude() == null || address.getLatitude() == null) {
            throw new IllegalArgumentException("经纬度不能为空");
        }
        
        // 生成地址ID
        if (StrUtil.isEmpty(address.getAddrId())) {
            address.setAddrId("ADDR_" + IdUtil.getSnowflakeNextIdStr());
        }
        
        // 设置默认值
        if (address.getTag() == null) {
            address.setTag(TaxiCommonAddress.Tag.OTHER);
        }
        if (address.getPriority() == null) {
            address.setPriority(5);
        }
        if (address.getIsDefault() == null) {
            address.setIsDefault(false);
        }
        
        long currentTime = System.currentTimeMillis();
        address.setCreateTime(currentTime);
        address.setUpdateTime(currentTime);
        address.setLastUseTime(0L);
        
        // 如果设置为默认地址，需要清除其他默认地址
        if (Boolean.TRUE.equals(address.getIsDefault())) {
            clearOtherDefaultAddress(address.getUserId());
        }
        
        boolean result = this.save(address);
        if (result) {
            log.info("添加常用地址成功，地址ID: {}", address.getAddrId());
        }
        
        return result;
    }
    
    /**
     * 清除用户的其他默认地址
     */
    @Transactional(rollbackFor = Exception.class)
    private void clearOtherDefaultAddress(String userId) {
        LambdaQueryWrapper<TaxiCommonAddress> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(TaxiCommonAddress::getUserId, userId)
               .eq(TaxiCommonAddress::getIsDefault, true);
        
        List<TaxiCommonAddress> defaultAddresses = this.list(wrapper);
        for (TaxiCommonAddress addr : defaultAddresses) {
            addr.setIsDefault(false);
            addr.setUpdateTime(System.currentTimeMillis());
            this.updateById(addr);
        }
        log.info("清除用户 {} 的其他默认地址，共 {} 个", userId, defaultAddresses.size());
    }
    
    /**
     * 获取用户的所有常用地址
     */
    public List<TaxiCommonAddress> getUserAddresses(String userId) {
        if (StrUtil.isEmpty(userId)) {
            throw new IllegalArgumentException("用户ID不能为空");
        }
        
        log.info("获取用户常用地址，用户ID: {}", userId);
        
        List<TaxiCommonAddress> addresses = taxiAddressMapper.selectByUserId(userId);
        log.info("查询到 {} 个常用地址", addresses.size());
        
        return addresses;
    }
    
    /**
     * 获取用户常用地址（按分类分组）
     */
    public Map<String, List<TaxiCommonAddress>> getUserAddressesGrouped(String userId) {
        List<TaxiCommonAddress> addresses = getUserAddresses(userId);
        
        // 按标签分组
        Map<String, List<TaxiCommonAddress>> grouped = addresses.stream()
                .collect(Collectors.groupingBy(
                    address -> StrUtil.isNotEmpty(address.getTag()) ? address.getTag() : TaxiCommonAddress.Tag.OTHER,
                    LinkedHashMap::new,
                    Collectors.toList()
                ));
        
        // 确保每个分组都有显示顺序
        grouped.forEach((tag, list) -> {
            list.sort(Comparator.comparingInt(TaxiCommonAddress::getPriority));
        });
        
        return grouped;
    }
    
    /**
     * 获取用户的默认地址
     */
    public TaxiCommonAddress getDefaultAddress(String userId) {
        if (StrUtil.isEmpty(userId)) {
            return null;
        }
        
        TaxiCommonAddress address = taxiAddressMapper.selectDefaultAddress(userId);
        if (address != null) {
            log.info("找到默认地址: {}", address.getDisplayName());
        } else {
            log.info("用户 {} 未设置默认地址", userId);
        }
        
        return address;
    }
    
    /**
     * 获取用户最近使用的地址
     */
    public List<TaxiCommonAddress> getRecentAddresses(String userId, int limit) {
        if (StrUtil.isEmpty(userId)) {
            return new ArrayList<>();
        }
        
        List<TaxiCommonAddress> addresses = taxiAddressMapper.selectRecentAddresses(userId, Math.min(limit, 10));
        log.info("获取到 {} 个最近使用的地址", addresses.size());
        
        return addresses;
    }
    
    /**
     * 设置默认地址
     */
    @Transactional(rollbackFor = Exception.class)
    public boolean setDefaultAddress(String userId, String addrId) {
        log.info("设置默认地址，用户: {}, 地址ID: {}", userId, addrId);
        
        // 验证地址是否存在且属于该用户
        TaxiCommonAddress address = this.getById(addrId);
        if (address == null || !userId.equals(address.getUserId())) {
            throw new RuntimeException("地址不存在或不属于该用户");
        }
        
        // 清除其他默认地址
        clearOtherDefaultAddress(userId);
        
        // 设置新默认地址
        address.setIsDefault(true);
        address.setUpdateTime(System.currentTimeMillis());
        
        boolean result = this.updateById(address);
        if (result) {
            log.info("设置默认地址成功: {}", address.getDisplayName());
        }
        
        return result;
    }
    
    /**
     * 更新地址最后使用时间（打车时调用）
     */
    @Transactional(rollbackFor = Exception.class)
    public void updateAddressUsage(String addrId) {
        if (StrUtil.isEmpty(addrId)) {
            return;
        }
        
        try {
            long currentTime = System.currentTimeMillis();
            taxiAddressMapper.updateLastUseTime(addrId, currentTime);
            
            // 同时更新update_time
            TaxiCommonAddress address = this.getById(addrId);
            if (address != null) {
                address.setUpdateTime(currentTime);
                this.updateById(address);
            }
            
            log.info("更新地址使用时间成功，地址ID: {}", addrId);
        } catch (Exception e) {
            log.error("更新地址使用时间失败", e);
        }
    }
    
    /**
     * 搜索附近的常用地址（基于标签）
     */
    public List<TaxiCommonAddress> searchNearbyAddresses(String userId, Double longitude, Double latitude, 
                                                         String tag, Double radius) {
        if (StrUtil.isEmpty(userId) || longitude == null || latitude == null) {
            return new ArrayList<>();
        }
        
        log.info("搜索附近地址，用户: {}, 位置: ({}, {}), 标签: {}, 半径: {}", 
                userId, longitude, latitude, tag, radius);
        
        // 先获取用户的所有地址
        List<TaxiCommonAddress> allAddresses;
        if (StrUtil.isNotEmpty(tag)) {
            allAddresses = taxiAddressMapper.selectByTag(userId, tag);
        } else {
            allAddresses = getUserAddresses(userId);
        }
        
        if (allAddresses.isEmpty()) {
            return new ArrayList<>();
        }
        
        // 如果有半径限制，计算距离并过滤
        if (radius != null && radius > 0) {
            List<TaxiCommonAddress> filtered = new ArrayList<>();
            for (TaxiCommonAddress address : allAddresses) {
                if (address.getLongitude() != null && address.getLatitude() != null) {
                    double distance = calculateDistance(latitude, longitude, 
                                                      address.getLatitude(), address.getLongitude());
                    if (distance <= radius) {
                        // 可以为地址添加距离信息
                        // address.setDistance(distance);
                        filtered.add(address);
                    }
                }
            }
            log.info("半径 {}km 内找到 {} 个地址", radius, filtered.size());
            return filtered;
        }
        
        return allAddresses;
    }
    
    /**
     * 删除常用地址
     */
    @Transactional(rollbackFor = Exception.class)
    public boolean deleteAddress(String userId, String addrId) {
        log.info("删除常用地址，用户: {}, 地址ID: {}", userId, addrId);
        
        // 验证地址是否存在且属于该用户
        TaxiCommonAddress address = this.getById(addrId);
        if (address == null || !userId.equals(address.getUserId())) {
            throw new RuntimeException("地址不存在或不属于该用户");
        }
        
        boolean result = this.removeById(addrId);
        if (result) {
            log.info("删除地址成功: {}", address.getDisplayName());
        }
        
        return result;
    }
    
    /**
     * 计算两个坐标点之间的距离（公里）
     */
    private double calculateDistance(double lat1, double lon1, double lat2, double lon2) {
        final int R = 6371;
        
        double latDistance = Math.toRadians(lat2 - lat1);
        double lonDistance = Math.toRadians(lon2 - lon1);
        
        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);
        
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        
        return R * c;
    }
}