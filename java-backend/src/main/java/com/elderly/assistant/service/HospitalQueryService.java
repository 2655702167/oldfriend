package com.elderly.assistant.service;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.elderly.assistant.entity.HospitalInfo;
import com.elderly.assistant.mapper.HospitalInfoMapper;

import cn.hutool.core.util.StrUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 医院信息查询服务
 * 包含：科室查询、距离排序、预约情况查询等
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class HospitalQueryService extends ServiceImpl<HospitalInfoMapper, HospitalInfo> {
    
    private final HospitalInfoMapper hospitalInfoMapper;
    
    // ==================== 科室相关接口 ====================
    
    /**
     * 获取所有科室列表（去重）
     */
    public List<String> getAllDepartments() {
        log.info("获取所有科室列表");
        
        try {
            List<HospitalInfo> hospitals = this.list();
            Set<String> departmentSet = new HashSet<>();
            
            for (HospitalInfo hospital : hospitals) {
                if (StrUtil.isNotBlank(hospital.getDepartments())) {
                    String[] depts = hospital.getDepartments().split(",");
                    for (String dept : depts) {
                        if (StrUtil.isNotBlank(dept.trim())) {
                            departmentSet.add(dept.trim());
                        }
                    }
                }
            }
            
            List<String> departments = new ArrayList<>(departmentSet);
            Collections.sort(departments);
            log.info("获取到 {} 个科室", departments.size());
            
            return departments;
            
        } catch (Exception e) {
            log.error("获取科室列表失败", e);
            return new ArrayList<>();
        }
    }
    
    /**
     * 根据科室查询医院
     */
    public List<HospitalInfo> getHospitalsByDepartment(String department) {
        log.info("根据科室查询医院，department: {}", department);
        
        if (StrUtil.isBlank(department)) {
            return new ArrayList<>();
        }
        
        try {
            LambdaQueryWrapper<HospitalInfo> queryWrapper = new LambdaQueryWrapper<>();
            queryWrapper.like(HospitalInfo::getDepartments, department)
                       .eq(HospitalInfo::getStatus, "正常")
                       .orderByDesc(HospitalInfo::getHospitalLevel);
            
            List<HospitalInfo> hospitals = this.list(queryWrapper);
            log.info("查询到 {} 家医院提供 {} 科室", hospitals.size(), department);
            
            return hospitals;
            
        } catch (Exception e) {
            log.error("根据科室查询医院失败", e);
            return new ArrayList<>();
        }
    }
    
    /**
     * 获取医院的所有科室
     */
    public List<String> getHospitalDepartments(String hospitalId) {
        log.info("获取医院科室，hospitalId: {}", hospitalId);
        
        if (StrUtil.isBlank(hospitalId)) {
            return new ArrayList<>();
        }
        
        try {
            HospitalInfo hospital = this.getById(hospitalId);
            if (hospital == null || StrUtil.isBlank(hospital.getDepartments())) {
                return new ArrayList<>();
            }
            
            String[] depts = hospital.getDepartments().split(",");
            List<String> departments = Arrays.stream(depts)
                    .map(String::trim)
                    .filter(StrUtil::isNotBlank)
                    .collect(Collectors.toList());
            
            log.info("医院 {} 有 {} 个科室", hospital.getHospitalName(), departments.size());
            
            return departments;
            
        } catch (Exception e) {
            log.error("获取医院科室失败", e);
            return new ArrayList<>();
        }
    }
    
    // ==================== 医院查询接口 ====================
    
    /**
     * 获取所有医院列表
     */
    public List<HospitalInfo> getAllHospitals() {
        log.info("获取所有医院列表");
        
        try {
            LambdaQueryWrapper<HospitalInfo> queryWrapper = new LambdaQueryWrapper<>();
            queryWrapper.eq(HospitalInfo::getStatus, "enabled")
                       .orderByDesc(HospitalInfo::getHospitalLevel);
            
            List<HospitalInfo> hospitals = this.list(queryWrapper);
            log.info("获取到 {} 家医院", hospitals.size());
            
            return hospitals;
            
        } catch (Exception e) {
            log.error("获取医院列表失败", e);
            return new ArrayList<>();
        }
    }
    
    /**
     * 获取医院详情
     */
    public HospitalInfo getHospitalDetail(String hospitalId) {
        log.info("获取医院详情，hospitalId: {}", hospitalId);
        
        if (StrUtil.isBlank(hospitalId)) {
            return null;
        }
        
        try {
            HospitalInfo hospital = this.getById(hospitalId);
            if (hospital != null) {
                log.info("获取到医院详情: {}", hospital.getHospitalName());
            } else {
                log.warn("医院不存在: {}", hospitalId);
            }
            
            return hospital;
            
        } catch (Exception e) {
            log.error("获取医院详情失败", e);
            return null;
        }
    }
    
    // ==================== 距离排序接口 ====================
    
    /**
     * 根据距离获取附近的医院
     */
    public List<Map<String, Object>> getNearbyHospitals(Double longitude, Double latitude, 
                                                        Double radius, String department) {
        log.info("查询附近医院，位置: ({}, {}), 半径: {}km, 科室: {}", 
                longitude, latitude, radius, department);
        
        if (longitude == null || latitude == null) {
            return new ArrayList<>();
        }
        
        try {
            LambdaQueryWrapper<HospitalInfo> queryWrapper = new LambdaQueryWrapper<>();
            queryWrapper.eq(HospitalInfo::getStatus, "正常");
            
            if (StrUtil.isNotBlank(department)) {
                queryWrapper.like(HospitalInfo::getDepartments, department);
            }
            
            List<HospitalInfo> hospitals = this.list(queryWrapper);
            log.info("查询到 {} 家符合条件的医院", hospitals.size());
            
            List<Map<String, Object>> result = new ArrayList<>();
            
            for (HospitalInfo hospital : hospitals) {
                if (hospital.getLongitude() == null || hospital.getLatitude() == null) {
                    continue;
                }
                
                double distance = calculateDistance(latitude, longitude, 
                                                  hospital.getLatitude(), hospital.getLongitude());
                
                if (radius != null && radius > 0 && distance > radius) {
                    continue;
                }
                boolean available = checkAppointmentAvailable(hospital.getHospitalId());
                
                Map<String, Object> hospitalInfo = new HashMap<>();
                hospitalInfo.put("hospitalId", hospital.getHospitalId());
                hospitalInfo.put("hospitalName", hospital.getHospitalName());
                hospitalInfo.put("hospitalLevel", hospital.getHospitalLevel());
                hospitalInfo.put("hospitalType", hospital.getHospitalType());
                hospitalInfo.put("address", hospital.getAddress());
                hospitalInfo.put("phone", hospital.getPhone());
                hospitalInfo.put("distance", Math.round(distance * 100) / 100.0);
                hospitalInfo.put("availableQuota", hospital.getAvailableQuota());
                hospitalInfo.put("dailyQuota", hospital.getDailyQuota());
                hospitalInfo.put("available", available);
                hospitalInfo.put("departments", hospital.getDepartments());
                hospitalInfo.put("openingHours", hospital.getOpeningHours());
                hospitalInfo.put("longitude", hospital.getLongitude());
                hospitalInfo.put("latitude", hospital.getLatitude());
                
                result.add(hospitalInfo);
            }
            
            result.sort(Comparator.comparingDouble(h -> (Double) h.get("distance")));
            log.info("找到 {} 家附近的医院", result.size());
            
            return result;
            
        } catch (Exception e) {
            log.error("查询附近医院失败", e);
            return new ArrayList<>();
        }
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
    
    // ==================== 预约相关接口 ====================
    
    /**
     * 检查医院是否可预约
     */
    public boolean checkAppointmentAvailable(String hospitalId) {
        if (StrUtil.isBlank(hospitalId)) {
            return false;
        }
        
        try {
            HospitalInfo hospital = this.getById(hospitalId);
            if (hospital == null) {
                return false;
            }
            
            boolean available = "enabled".equals(hospital.getStatus()) 
                    && hospital.getAvailableQuota() != null 
                    && hospital.getAvailableQuota() > 0;
            
            log.info("医院 {} 预约状态: {}", hospital.getHospitalName(), available);
            
            return available;
            
        } catch (Exception e) {
            log.error("检查预约状态失败", e);
            return false;
        }
    }
    
    /**
     * 获取医院预约信息（包含详细配额）
     */
    public Map<String, Object> getAppointmentInfo(String hospitalId) {
        log.info("获取医院预约信息，hospitalId: {}", hospitalId);
        
        Map<String, Object> result = new HashMap<>();
        
        if (StrUtil.isBlank(hospitalId)) {
            result.put("available", false);
            result.put("message", "医院ID不能为空");
            return result;
        }
        
        try {
            HospitalInfo hospital = this.getById(hospitalId);
            if (hospital == null) {
                result.put("available", false);
                result.put("message", "医院不存在");
                return result;
            }
            
            result.put("hospitalId", hospital.getHospitalId());
            result.put("hospitalName", hospital.getHospitalName());
            result.put("hospitalLevel", hospital.getHospitalLevel());
            result.put("address", hospital.getAddress());
            result.put("phone", hospital.getPhone());
            result.put("openingHours", hospital.getOpeningHours());
            
            Integer dailyQuota = hospital.getDailyQuota();
            Integer availableQuota = hospital.getAvailableQuota();
            
            result.put("dailyQuota", dailyQuota);
            result.put("availableQuota", availableQuota);
            result.put("bookedQuota", dailyQuota != null && availableQuota != null ? 
                       dailyQuota - availableQuota : 0);
            
            boolean available = checkAppointmentAvailable(hospitalId);
            result.put("available", available);
            
            if (available) {
                result.put("message", "可预约");
                result.put("quotaStatus", "充足");
            } else {
                result.put("message", availableQuota != null && availableQuota <= 0 ? 
                          "今日号源已约满" : "暂不可预约");
                result.put("quotaStatus", "紧张");
            }
            
            log.info("医院预约信息: {} - 可用: {}", hospital.getHospitalName(), available);
            
            return result;
            
        } catch (Exception e) {
            log.error("获取预约信息失败", e);
            result.put("available", false);
            result.put("message", "获取预约信息失败");
            return result;
        }
    }
    
    // ==================== 搜索接口 ====================
    
    /**
     * 搜索医院
     */
    public List<HospitalInfo> searchHospitals(Map<String, Object> searchParams) {
        log.info("搜索医院，参数: {}", searchParams);
        
        try {
            LambdaQueryWrapper<HospitalInfo> queryWrapper = new LambdaQueryWrapper<>();
            queryWrapper.eq(HospitalInfo::getStatus, "正常");
            
            if (searchParams.containsKey("keyword") && 
                StrUtil.isNotBlank((String) searchParams.get("keyword"))) {
                String keyword = (String) searchParams.get("keyword");
                queryWrapper.like(HospitalInfo::getHospitalName, keyword)
                           .or()
                           .like(HospitalInfo::getAddress, keyword);
            }
            
            if (searchParams.containsKey("level") && 
                StrUtil.isNotBlank((String) searchParams.get("level"))) {
                queryWrapper.eq(HospitalInfo::getHospitalLevel, searchParams.get("level"));
            }
            
            if (searchParams.containsKey("type") && 
                StrUtil.isNotBlank((String) searchParams.get("type"))) {
                queryWrapper.eq(HospitalInfo::getHospitalType, searchParams.get("type"));
            }
            
            if (searchParams.containsKey("hasQuota")) {
                Boolean hasQuota = (Boolean) searchParams.get("hasQuota");
                if (hasQuota != null && hasQuota) {
                    queryWrapper.gt(HospitalInfo::getAvailableQuota, 0);
                }
            }
            
            String sortField = (String) searchParams.get("sortField");
            String sortOrder = (String) searchParams.get("sortOrder");
            
            if (StrUtil.isNotBlank(sortField)) {
                boolean isAsc = "asc".equalsIgnoreCase(sortOrder);
                
                switch (sortField) {
                    case "level":
                        queryWrapper.orderBy(true, isAsc, HospitalInfo::getHospitalLevel);
                        break;
                    case "quota":
                        queryWrapper.orderBy(true, isAsc, HospitalInfo::getAvailableQuota);
                        break;
                    default:
                        queryWrapper.orderByDesc(HospitalInfo::getHospitalLevel);
                }
            } else {
                queryWrapper.orderByDesc(HospitalInfo::getHospitalLevel);
            }
            
            List<HospitalInfo> hospitals = this.list(queryWrapper);
            log.info("搜索到 {} 家医院", hospitals.size());
            
            return hospitals;
            
        } catch (Exception e) {
            log.error("搜索医院失败", e);
            return new ArrayList<>();
        }
    }
    
    /**
     * 获取医院列表（简化版）
     */
    public List<HospitalInfo> getHospitals() {
        LambdaQueryWrapper<HospitalInfo> queryWrapper = new LambdaQueryWrapper<>();
        queryWrapper.eq(HospitalInfo::getStatus, "正常")
                   .orderByAsc(HospitalInfo::getHospitalName);
        return this.list(queryWrapper);
    }
}