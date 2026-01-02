package com.elderly.assistant.entity;

import java.io.Serializable;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;

import lombok.Data;

@Data
@TableName("HOSPITAL_INFO")
public class HospitalInfo implements Serializable {
    private static final long serialVersionUID = 1L;

    @TableId(value = "hospital_id", type = IdType.INPUT)
    private String hospitalId;

    @TableField("hospital_name")
    private String hospitalName;

    @TableField("hospital_level")
    private String hospitalLevel;

    @TableField("hospital_type")
    private String hospitalType;

    @TableField("address")
    private String address;

    @TableField("phone")
    private String phone;

    @TableField("emergency_phone")
    private String emergencyPhone;

    @TableField("longitude")
    private Double longitude;

    @TableField("latitude")
    private Double latitude;

    @TableField("departments")
    private String departments;

    @TableField("daily_quota")
    private Integer dailyQuota;

    @TableField("available_quota")
    private Integer availableQuota;

    @TableField("opening_hours")
    private String openingHours;

    @TableField("status")
    private String status;
}