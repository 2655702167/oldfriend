package com.elderly.assistant.service;

import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.elderly.assistant.entity.HospitalInfo;
import com.elderly.assistant.entity.ReserveOrder;
import com.elderly.assistant.mapper.HospitalInfoMapper;
import com.elderly.assistant.mapper.ReserveOrderMapper;

import cn.hutool.core.util.StrUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 医院挂号服务（整合版）
 * 包含：挂号、取消、查询等功能
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class HospitalRegistrationService 
    extends ServiceImpl<ReserveOrderMapper, ReserveOrder> {
    
    private final ReserveOrderMapper reserveOrderMapper;
    private final HospitalInfoMapper hospitalInfoMapper;
    
    // ==================== 挂号相关接口 ====================
    
    /**
     * 创建挂号记录
     */
    @Transactional(rollbackFor = Exception.class)
    public boolean createRegistration(ReserveOrder order) {
        log.info("创建挂号记录，用户: {}, 医院: {}", 
                order.getUserId(), order.getHospitalId());
        
        if (order == null) {
            throw new IllegalArgumentException("挂号信息不能为空");
        }
        if (StrUtil.isEmpty(order.getUserId())) {
            throw new IllegalArgumentException("用户ID不能为空");
        }
        if (StrUtil.isEmpty(order.getHospitalId())) {
            throw new IllegalArgumentException("医院ID不能为空");
        }
        if (StrUtil.isEmpty(order.getReserveDate())) {
            throw new IllegalArgumentException("预约日期不能为空");
        }
        
        // 检查医院是否存在且可用
        HospitalInfo hospital = hospitalInfoMapper.selectById(order.getHospitalId());
        if (hospital == null) {
            throw new RuntimeException("医院不存在");
        }
        if (!"正常".equals(hospital.getStatus())) {
            throw new RuntimeException("医院暂不可用");
        }
        
        // 检查科室是否存在
        if (StrUtil.isNotEmpty(order.getDepartment())) {
            boolean hasDepartment = false;
            if (StrUtil.isNotEmpty(hospital.getDepartments())) {
                List<String> departments = Arrays.asList(hospital.getDepartments().split(","));
                hasDepartment = departments.contains(order.getDepartment());
            }
            if (!hasDepartment) {
                throw new RuntimeException("医院无此科室: " + order.getDepartment());
            }
        }
        
        // 检查号源
        if (!checkHospitalQuota(order.getHospitalId(), order.getReserveDate())) {
            throw new RuntimeException("该日期号源已满，请选择其他日期");
        }
        
        // 生成订单ID
        if (StrUtil.isEmpty(order.getOrderId())) {
            order.setOrderId("ORDER_" + System.currentTimeMillis());
        }
        
        // 设置默认值
        if (StrUtil.isEmpty(order.getStatus())) {
            order.setStatus("已预约");
        }
        if (StrUtil.isEmpty(order.getHospitalName())) {
            order.setHospitalName(hospital.getHospitalName());
        }
        
        order.setCreateTime(System.currentTimeMillis());
        
        // 保存到数据库
        boolean result = this.save(order);
        
        if (result) {
            log.info("挂号成功，订单ID: {}", order.getOrderId());
            
            // 更新医院配额（如果医院设置了配额）
            if (hospital.getAvailableQuota() != null && hospital.getAvailableQuota() > 0) {
                hospital.setAvailableQuota(hospital.getAvailableQuota() - 1);
                hospitalInfoMapper.updateById(hospital);
                log.info("更新医院配额，医院: {}，剩余配额: {}", 
                        hospital.getHospitalName(), hospital.getAvailableQuota());
            }
        }
        
        return result;
    }
    
    /**
     * 创建挂号记录（参数版）
     */
    @Transactional(rollbackFor = Exception.class)
    public boolean createRegistration(Map<String, Object> params) {
        try {
            ReserveOrder order = new ReserveOrder();
            order.setOrderId("ORDER_" + System.currentTimeMillis());
            order.setUserId((String) params.get("user_id"));
            order.setHospitalId((String) params.get("hospital_id"));
            order.setHospitalName((String) params.get("hospital_name"));
            order.setDepartment((String) params.get("department"));
            order.setReserveDate((String) params.get("reserve_date"));
            order.setStatus("已预约");
            order.setCreateTime(System.currentTimeMillis());
            
            return createRegistration(order);
        } catch (Exception e) {
            log.error("创建挂号记录失败", e);
            throw new RuntimeException("创建挂号失败: " + e.getMessage());
        }
    }
    
    /**
     * 查询用户的挂号记录
     */
    public List<ReserveOrder> getUserRegistrations(String userId) {
        if (StrUtil.isEmpty(userId)) {
            throw new IllegalArgumentException("用户ID不能为空");
        }
        
        LambdaQueryWrapper<ReserveOrder> queryWrapper = new LambdaQueryWrapper<>();
        queryWrapper.eq(ReserveOrder::getUserId, userId)
                   .orderByDesc(ReserveOrder::getCreateTime);
        
        return this.list(queryWrapper);
    }
    
    /**
     * 查询用户的挂号记录（带医院信息）
     */
    public List<Map<String, Object>> getUserRegistrationsWithHospital(String userId) {
        List<ReserveOrder> orders = getUserRegistrations(userId);
        
        return orders.stream().map(order -> {
            Map<String, Object> map = new HashMap<>();
            map.put("orderId", order.getOrderId());
            map.put("hospitalName", order.getHospitalName());
            map.put("department", order.getDepartment());
            map.put("reserveDate", order.getReserveDate());
            map.put("status", order.getStatus());
            map.put("createTime", order.getCreateTime());
            map.put("hospitalId", order.getHospitalId());
            
            // 获取医院详情
            HospitalInfo hospital = hospitalInfoMapper.selectById(order.getHospitalId());
            if (hospital != null) {
                map.put("hospitalAddress", hospital.getAddress());
                map.put("hospitalPhone", hospital.getPhone());
                map.put("openingHours", hospital.getOpeningHours());
                map.put("hospitalLevel", hospital.getHospitalLevel());
            }
            
            return map;
        }).collect(Collectors.toList());
    }
    
    /**
     * 取消挂号
     */
    @Transactional(rollbackFor = Exception.class)
    public boolean cancelRegistration(String orderId) {
        log.info("取消挂号，订单ID: {}", orderId);
        
        if (StrUtil.isEmpty(orderId)) {
            throw new IllegalArgumentException("订单ID不能为空");
        }
        
        ReserveOrder order = this.getById(orderId);
        if (order == null) {
            throw new RuntimeException("挂号记录不存在，ID: " + orderId);
        }
        
        // 检查是否已经是取消状态
        if ("已取消".equals(order.getStatus())) {
            throw new RuntimeException("挂号记录已取消，无需重复操作");
        }
        
        // 检查是否已完成
        if ("已完成".equals(order.getStatus())) {
            throw new RuntimeException("已完成挂号，不能取消");
        }
        
        // 检查是否可以取消（如提前多久可以取消）
        // 这里可以根据业务需求添加更多验证
        
        order.setStatus("已取消");
        boolean result = this.updateById(order);
        
        if (result) {
            log.info("取消挂号成功，订单ID: {}", orderId);
            
            // 恢复医院配额
            HospitalInfo hospital = hospitalInfoMapper.selectById(order.getHospitalId());
            if (hospital != null && hospital.getAvailableQuota() != null) {
                hospital.setAvailableQuota(hospital.getAvailableQuota() + 1);
                hospitalInfoMapper.updateById(hospital);
                log.info("恢复医院配额，医院: {}，恢复后配额: {}", 
                        hospital.getHospitalName(), hospital.getAvailableQuota());
            }
        }
        
        return result;
    }
    
    /**
     * 完成挂号
     */
    @Transactional(rollbackFor = Exception.class)
    public boolean completeRegistration(String orderId) {
        log.info("完成挂号，订单ID: {}", orderId);
        
        ReserveOrder order = this.getById(orderId);
        if (order == null) {
            throw new RuntimeException("挂号记录不存在");
        }
        
        if (!"已预约".equals(order.getStatus())) {
            throw new RuntimeException("只能完成已预约状态的挂号");
        }
        
        order.setStatus("已完成");
        return this.updateById(order);
    }
    
    /**
     * 查询挂号详情
     */
    public ReserveOrder getRegistrationById(String orderId) {
        if (StrUtil.isEmpty(orderId)) {
            throw new IllegalArgumentException("订单ID不能为空");
        }
        
        return this.getById(orderId);
    }
    
    /**
     * 查询挂号详情（包含医院信息）
     */
    public Map<String, Object> getRegistrationDetail(String orderId) {
        Map<String, Object> result = new HashMap<>();
        
        ReserveOrder order = this.getById(orderId);
        if (order == null) {
            result.put("found", false);
            result.put("message", "挂号记录不存在");
            return result;
        }
        
        result.put("found", true);
        result.put("order", order);
        
        // 获取医院信息
        HospitalInfo hospital = hospitalInfoMapper.selectById(order.getHospitalId());
        if (hospital != null) {
            result.put("hospital", hospital);
        }
        
        return result;
    }
    
    /**
     * 统计用户挂号状态
     */
    public Map<String, Integer> getUserRegistrationStats(String userId) {
        Map<String, Integer> stats = new HashMap<>();
        stats.put("total", 0);
        stats.put("pending", 0);   // 已预约
        stats.put("completed", 0); // 已完成
        stats.put("cancelled", 0); // 已取消
        
        // 使用Lambda查询统计
        LambdaQueryWrapper<ReserveOrder> queryWrapper = new LambdaQueryWrapper<>();
        queryWrapper.eq(ReserveOrder::getUserId, userId);
        
        long total = this.count(queryWrapper);
        stats.put("total", (int) total);
        
        queryWrapper.clear();
        queryWrapper.eq(ReserveOrder::getUserId, userId)
                   .eq(ReserveOrder::getStatus, "已预约");
        long pending = this.count(queryWrapper);
        stats.put("pending", (int) pending);
        
        queryWrapper.clear();
        queryWrapper.eq(ReserveOrder::getUserId, userId)
                   .eq(ReserveOrder::getStatus, "已完成");
        long completed = this.count(queryWrapper);
        stats.put("completed", (int) completed);
        
        queryWrapper.clear();
        queryWrapper.eq(ReserveOrder::getUserId, userId)
                   .eq(ReserveOrder::getStatus, "已取消");
        long cancelled = this.count(queryWrapper);
        stats.put("cancelled", (int) cancelled);
        
        log.info("用户 {} 挂号统计: 总计={}, 待就诊={}, 已完成={}, 已取消={}", 
                userId, total, pending, completed, cancelled);
        
        return stats;
    }
    
    /**
     * 检查医院是否有号源
     */
    public boolean checkHospitalQuota(String hospitalId, String date) {
        HospitalInfo hospital = hospitalInfoMapper.selectById(hospitalId);
        if (hospital == null) {
            return false;
        }
        
        // 检查医院状态
        if (!"enabled".equals(hospital.getStatus())) {
            return false;
        }
        
        // 检查剩余配额
        if (hospital.getAvailableQuota() != null && hospital.getAvailableQuota() > 0) {
            return true;
        }
        // 检查该日期是否已有太多预约
        LambdaQueryWrapper<ReserveOrder> queryWrapper = new LambdaQueryWrapper<>();
        queryWrapper.eq(ReserveOrder::getHospitalId, hospitalId)
                   .eq(ReserveOrder::getReserveDate, date)
                   .eq(ReserveOrder::getStatus, "已预约");
        
        long todayReservations = this.count(queryWrapper);
        
        // 如果医院有配额设置，检查是否超限
        if (hospital.getDailyQuota() != null) {
            return todayReservations < hospital.getDailyQuota();
        }
        
        return true;
    }
}