package com.elderly.assistant.controller;

import java.util.List;
import java.util.Map;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.elderly.assistant.common.Result;
import com.elderly.assistant.entity.HospitalInfo;
import com.elderly.assistant.entity.ReserveOrder;
import com.elderly.assistant.service.HospitalQueryService;
import com.elderly.assistant.service.HospitalRegistrationService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 医院挂号统一控制器
 */
@Slf4j
@RestController
@RequestMapping("/hospital")
@RequiredArgsConstructor
@CrossOrigin
public class HospitalController {
    
    private final HospitalQueryService hospitalQueryService;
    private final HospitalRegistrationService hospitalRegistrationService;
    
    // ==================== 科室相关接口 ====================
    
    /**
     * 获取所有科室
     * GET /hospital/departments
     */
    @GetMapping("/departments")
    public Result<List<String>> getAllDepartments() {
        try {
            List<String> departments = hospitalQueryService.getAllDepartments();
            return Result.success(departments);
        } catch (Exception e) {
            log.error("获取科室列表失败", e);
            return Result.error(e.getMessage());
        }
    }
    
    /**
     * 根据科室查询医院
     * GET /hospital/by-department?department=内科
     */
    @GetMapping("/by-department")
    public Result<List<HospitalInfo>> getHospitalsByDepartment(
            @RequestParam("department") String department) {
        try {
            List<HospitalInfo> hospitals = hospitalQueryService.getHospitalsByDepartment(department);
            return Result.success(hospitals);
        } catch (Exception e) {
            log.error("根据科室查询医院失败", e);
            return Result.error(e.getMessage());
        }
    }
    
    // ==================== 医院查询接口 ====================
    
    /**
     * 获取所有医院
     * GET /hospital/list
     */
    @GetMapping("/list")
    public Result<List<HospitalInfo>> getAllHospitals() {
        try {
            List<HospitalInfo> hospitals = hospitalQueryService.getAllHospitals();
            return Result.success(hospitals);
        } catch (Exception e) {
            log.error("获取医院列表失败", e);
            return Result.error(e.getMessage());
        }
    }
    
    /**
     * 获取医院详情
     * GET /hospital/detail?hospital_id=xxx
     */
    @GetMapping("/detail")
    public Result<HospitalInfo> getHospitalDetail(
            @RequestParam("hospital_id") String hospitalId) {
        try {
            HospitalInfo hospital = hospitalQueryService.getHospitalDetail(hospitalId);
            return hospital != null ? Result.success(hospital) : Result.error("医院不存在");
        } catch (Exception e) {
            log.error("获取医院详情失败", e);
            return Result.error(e.getMessage());
        }
    }
    
    /**
     * 获取医院科室
     * GET /hospital/{hospitalId}/departments
     */
    @GetMapping("/{hospitalId}/departments")
    public Result<List<String>> getHospitalDepartments(
            @PathVariable String hospitalId) {
        try {
            List<String> departments = hospitalQueryService.getHospitalDepartments(hospitalId);
            return Result.success(departments);
        } catch (Exception e) {
            log.error("获取医院科室失败", e);
            return Result.error(e.getMessage());
        }
    }
    
    // ==================== 距离排序接口 ====================
    
    /**
     * 获取附近医院（带距离排序和预约情况）
     * GET /hospital/nearby?longitude=116.40&latitude=39.90&radius=10&department=内科
     */
    @GetMapping("/nearby")
    public Result<List<Map<String, Object>>> getNearbyHospitals(
            @RequestParam(value = "longitude") Double longitude,
            @RequestParam(value = "latitude") Double latitude,
            @RequestParam(value = "radius", required = false) Double radius,
            @RequestParam(value = "department", required = false) String department) {
        try {
            List<Map<String, Object>> hospitals = hospitalQueryService.getNearbyHospitals(
                longitude, latitude, radius, department);
            return Result.success(hospitals);
        } catch (Exception e) {
            log.error("获取附近医院失败", e);
            return Result.error(e.getMessage());
        }
    }
    
    // ==================== 预约查询接口 ====================
    
    /**
     * 检查医院预约状态
     * GET /hospital/check-available?hospital_id=xxx
     */
    @GetMapping("/check-available")
    public Result<Boolean> checkAppointmentAvailable(
            @RequestParam("hospital_id") String hospitalId) {
        try {
            boolean available = hospitalQueryService.checkAppointmentAvailable(hospitalId);
            return Result.success(available);
        } catch (Exception e) {
            log.error("检查预约状态失败", e);
            return Result.error(e.getMessage());
        }
    }
    
    /**
     * 获取医院预约详情
     * GET /hospital/appointment-info?hospital_id=xxx
     */
    @GetMapping("/appointment-info")
    public Result<Map<String, Object>> getAppointmentInfo(
            @RequestParam("hospital_id") String hospitalId) {
        try {
            Map<String, Object> info = hospitalQueryService.getAppointmentInfo(hospitalId);
            return Result.success(info);
        } catch (Exception e) {
            log.error("获取预约信息失败", e);
            return Result.error(e.getMessage());
        }
    }
    
    // ==================== 搜索接口 ====================
    
    /**
     * 搜索医院
     * POST /hospital/search
     */
    @PostMapping("/search")
    public Result<List<HospitalInfo>> searchHospitals(@RequestBody Map<String, Object> searchParams) {
        try {
            List<HospitalInfo> hospitals = hospitalQueryService.searchHospitals(searchParams);
            return Result.success(hospitals);
        } catch (Exception e) {
            log.error("搜索医院失败", e);
            return Result.error(e.getMessage());
        }
    }
    
    // ==================== 挂号相关接口 ====================
    
    /**
     * 创建挂号
     * POST /hospital/registration/create
     */
    @PostMapping("/registration/create")
    public Result<?> createRegistration(@RequestBody Map<String, Object> params) {
        try {
            boolean success = hospitalRegistrationService.createRegistration(params);
            return success ? Result.success("挂号成功") : Result.error("挂号失败");
        } catch (Exception e) {
            log.error("创建挂号失败", e);
            return Result.error(e.getMessage());
        }
    }
    
    /**
     * 创建挂号（实体方式）
     * POST /hospital/registration/create-order
     */
    @PostMapping("/registration/create-order")
    public Result<?> createRegistrationOrder(@RequestBody ReserveOrder order) {
        try {
            boolean success = hospitalRegistrationService.createRegistration(order);
            return success ? Result.success("挂号成功") : Result.error("挂号失败");
        } catch (Exception e) {
            log.error("创建挂号失败", e);
            return Result.error(e.getMessage());
        }
    }
    
    /**
     * 查询用户挂号记录
     * GET /hospital/registration/list?user_id=xxx
     */
    @GetMapping("/registration/list")
    public Result<List<ReserveOrder>> getUserRegistrations(
            @RequestParam("user_id") String userId) {
        try {
            List<ReserveOrder> orders = hospitalRegistrationService.getUserRegistrations(userId);
            return Result.success(orders);
        } catch (Exception e) {
            log.error("查询挂号记录失败", e);
            return Result.error(e.getMessage());
        }
    }
    
    /**
     * 查询用户挂号记录（带医院信息）
     * GET /hospital/registration/detailed-list?user_id=xxx
     */
    @GetMapping("/registration/detailed-list")
    public Result<List<Map<String, Object>>> getUserRegistrationsWithHospital(
            @RequestParam("user_id") String userId) {
        try {
            List<Map<String, Object>> orders = 
                hospitalRegistrationService.getUserRegistrationsWithHospital(userId);
            return Result.success(orders);
        } catch (Exception e) {
            log.error("查询详细挂号记录失败", e);
            return Result.error(e.getMessage());
        }
    }
    
    /**
     * 取消挂号
     * POST /hospital/registration/cancel
     */
    @PostMapping("/registration/cancel")
    public Result<?> cancelRegistration(@RequestParam("order_id") String orderId) {
        try {
            boolean success = hospitalRegistrationService.cancelRegistration(orderId);
            return success ? Result.success("取消成功") : Result.error("取消失败");
        } catch (Exception e) {
            log.error("取消挂号失败", e);
            return Result.error(e.getMessage());
        }
    }
    
    /**
     * 完成挂号
     * POST /hospital/registration/complete
     */
    @PostMapping("/registration/complete")
    public Result<?> completeRegistration(@RequestParam("order_id") String orderId) {
        try {
            boolean success = hospitalRegistrationService.completeRegistration(orderId);
            return success ? Result.success("完成就诊") : Result.error("操作失败");
        } catch (Exception e) {
            log.error("完成挂号失败", e);
            return Result.error(e.getMessage());
        }
    }
    
    /**
     * 查询挂号详情
     * GET /hospital/registration/detail?order_id=xxx
     */
    @GetMapping("/registration/detail")
    public Result<ReserveOrder> getRegistrationDetail(
            @RequestParam("order_id") String orderId) {
        try {
            ReserveOrder order = hospitalRegistrationService.getRegistrationById(orderId);
            return order != null ? Result.success(order) : Result.error("挂号记录不存在");
        } catch (Exception e) {
            log.error("查询挂号详情失败", e);
            return Result.error(e.getMessage());
        }
    }
    
    /**
     * 查询挂号统计
     * GET /hospital/registration/stats?user_id=xxx
     */
    @GetMapping("/registration/stats")
    public Result<Map<String, Integer>> getUserRegistrationStats(
            @RequestParam("user_id") String userId) {
        try {
            Map<String, Integer> stats = hospitalRegistrationService.getUserRegistrationStats(userId);
            return Result.success(stats);
        } catch (Exception e) {
            log.error("查询挂号统计失败", e);
            return Result.error(e.getMessage());
        }
    }
}