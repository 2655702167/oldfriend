package com.elderly.assistant.controller;

import java.util.List;
import java.util.Map;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.elderly.assistant.common.Result;
import com.elderly.assistant.entity.TaxiCommonAddress;
import com.elderly.assistant.service.TaxiAddressService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 打车常用地址控制器
 * 功能：提供常用地址的增删改查接口
 */
@Slf4j
@RestController
@RequestMapping("/taxi/address")
@RequiredArgsConstructor
@CrossOrigin
public class TaxiAddressController {
    
    private final TaxiAddressService taxiAddressService;
    
    /**
     * 添加常用地址
     * POST /taxi/address/add
     */
    @PostMapping("/add")
    public Result<?> addCommonAddress(@RequestBody TaxiCommonAddress address) {
        try {
            log.info("添加常用地址，用户: {}, 名称: {}", address.getUserId(), address.getDisplayName());
            
            boolean success = taxiAddressService.addCommonAddress(address);
            return success ? Result.success("添加成功") : Result.error("添加失败");
            
        } catch (Exception e) {
            log.error("添加常用地址失败", e);
            return Result.error(e.getMessage());
        }
    }
    
    /**
     * 获取用户所有常用地址
     * GET /taxi/address/list?user_id=xxx
     */
    @GetMapping("/list")
    public Result<List<TaxiCommonAddress>> getUserAddresses(@RequestParam("user_id") String userId) {
        try {
            log.info("获取用户常用地址，用户ID: {}", userId);
            
            List<TaxiCommonAddress> addresses = taxiAddressService.getUserAddresses(userId);
            return Result.success(addresses);
            
        } catch (Exception e) {
            log.error("获取常用地址失败", e);
            return Result.error(e.getMessage());
        }
    }
    
    /**
     * 获取用户常用地址（分组）
     * GET /taxi/address/grouped?user_id=xxx
     */
    @GetMapping("/grouped")
    public Result<Map<String, List<TaxiCommonAddress>>> getUserAddressesGrouped(
            @RequestParam("user_id") String userId) {
        try {
            log.info("获取用户分组地址，用户ID: {}", userId);
            
            Map<String, List<TaxiCommonAddress>> grouped = taxiAddressService.getUserAddressesGrouped(userId);
            return Result.success(grouped);
            
        } catch (Exception e) {
            log.error("获取分组地址失败", e);
            return Result.error(e.getMessage());
        }
    }
    
    /**
     * 获取用户默认地址
     * GET /taxi/address/default?user_id=xxx
     */
    @GetMapping("/default")
    public Result<TaxiCommonAddress> getDefaultAddress(@RequestParam("user_id") String userId) {
        try {
            log.info("获取用户默认地址，用户ID: {}", userId);
            
            TaxiCommonAddress address = taxiAddressService.getDefaultAddress(userId);
            return address != null ? Result.success(address) : Result.error("未设置默认地址");
            
        } catch (Exception e) {
            log.error("获取默认地址失败", e);
            return Result.error(e.getMessage());
        }
    }
    
    /**
     * 设置默认地址
     * POST /taxi/address/set-default
     */
    @PostMapping("/set-default")
    public Result<?> setDefaultAddress(
            @RequestParam("user_id") String userId,
            @RequestParam("addr_id") String addrId) {
        try {
            log.info("设置默认地址，用户: {}, 地址ID: {}", userId, addrId);
            
            boolean success = taxiAddressService.setDefaultAddress(userId, addrId);
            return success ? Result.success("设置成功") : Result.error("设置失败");
            
        } catch (Exception e) {
            log.error("设置默认地址失败", e);
            return Result.error(e.getMessage());
        }
    }
    
    /**
     * 获取最近使用的地址
     * GET /taxi/address/recent?user_id=xxx&limit=5
     */
    @GetMapping("/recent")
    public Result<List<TaxiCommonAddress>> getRecentAddresses(
            @RequestParam("user_id") String userId,
            @RequestParam(value = "limit", defaultValue = "5") int limit) {
        try {
            log.info("获取最近使用地址，用户ID: {}, 数量: {}", userId, limit);
            
            List<TaxiCommonAddress> addresses = taxiAddressService.getRecentAddresses(userId, limit);
            return Result.success(addresses);
            
        } catch (Exception e) {
            log.error("获取最近地址失败", e);
            return Result.error(e.getMessage());
        }
    }
    
    /**
     * 搜索附近地址
     * GET /taxi/address/nearby?user_id=xxx&longitude=xxx&latitude=xxx&tag=HOSPITAL&radius=5
     */
    @GetMapping("/nearby")
    public Result<List<TaxiCommonAddress>> searchNearbyAddresses(
            @RequestParam("user_id") String userId,
            @RequestParam("longitude") Double longitude,
            @RequestParam("latitude") Double latitude,
            @RequestParam(value = "tag", required = false) String tag,
            @RequestParam(value = "radius", required = false) Double radius) {
        try {
            log.info("搜索附近地址，用户: {}, 位置: ({}, {})", userId, longitude, latitude);
            
            List<TaxiCommonAddress> addresses = taxiAddressService.searchNearbyAddresses(
                userId, longitude, latitude, tag, radius);
            
            return Result.success(addresses);
            
        } catch (Exception e) {
            log.error("搜索附近地址失败", e);
            return Result.error(e.getMessage());
        }
    }
    
    /**
     * 更新地址使用时间（打车时调用）
     * POST /taxi/address/update-usage
     */
    @PostMapping("/update-usage")
    public Result<?> updateAddressUsage(@RequestParam("addr_id") String addrId) {
        try {
            log.info("更新地址使用时间，地址ID: {}", addrId);
            
            taxiAddressService.updateAddressUsage(addrId);
            return Result.success("更新成功");
            
        } catch (Exception e) {
            log.error("更新地址使用时间失败", e);
            return Result.error(e.getMessage());
        }
    }
    
    /**
     * 删除常用地址
     * POST /taxi/address/delete
     */
    @PostMapping("/delete")
    public Result<?> deleteAddress(
            @RequestParam("user_id") String userId,
            @RequestParam("addr_id") String addrId) {
        try {
            log.info("删除常用地址，用户: {}, 地址ID: {}", userId, addrId);
            
            boolean success = taxiAddressService.deleteAddress(userId, addrId);
            return success ? Result.success("删除成功") : Result.error("删除失败");
            
        } catch (Exception e) {
            log.error("删除常用地址失败", e);
            return Result.error(e.getMessage());
        }
    }
}