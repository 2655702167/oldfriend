package com.elderly.assistant.entity;

import java.io.Serializable;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;

import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.experimental.Accessors;

/**
 * 打车常用地址实体
 */
@Data
@EqualsAndHashCode(callSuper = false)
@Accessors(chain = true)
@TableName("TAXI_COMMON_ADDRESS")
public class TaxiCommonAddress implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 地址ID
     */
    @TableId(value = "addr_id", type = IdType.INPUT)
    private String addrId;

    /**
     * 用户ID
     */
    @TableField("user_id")
    private String userId;

    /**
     * 显示名称（如：家、公司、医院等）
     */
    @TableField("display_name")
    private String displayName;

    /**
     * 详细地址
     */
    @TableField("address")
    private String address;

    /**
     * 经度
     */
    @TableField("longitude")
    private Double longitude;

    /**
     * 纬度
     */
    @TableField("latitude")
    private Double latitude;

    /**
     * 地址标签
     * HOME: 家
     * HOSPITAL: 医院
     * RELATIVE: 亲戚家
     * SHOPPING: 购物中心
     * OTHER: 其他
     */
    @TableField("tag")
    private String tag;

    /**
     * 是否默认地址
     */
    @TableField("is_default")
    private Boolean isDefault;

    /**
     * 优先级（1-10，数字越小优先级越高）
     */
    @TableField("priority")
    private Integer priority;

    /**
     * 备注
     */
    @TableField("note")
    private String note;

    /**
     * 最后使用时间
     */
    @TableField("last_use_time")
    private Long lastUseTime;

    /**
     * 创建时间
     */
    @TableField("create_time")
    private Long createTime;

    /**
     * 更新时间
     */
    @TableField("update_time")
    private Long updateTime;

    /**
     * 标签常量
     */
    public static class Tag {
        public static final String HOME = "HOME";
        public static final String HOSPITAL = "HOSPITAL";
        public static final String RELATIVE = "RELATIVE";
        public static final String SHOPPING = "SHOPPING";
        public static final String OTHER = "OTHER";
    }
}
