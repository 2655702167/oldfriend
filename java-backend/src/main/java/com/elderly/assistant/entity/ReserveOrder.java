package com.elderly.assistant.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import lombok.Getter;
import lombok.Setter;
import java.io.Serializable;

@Data
@TableName("RESERVE_ORDER")
public class ReserveOrder implements Serializable {
    private static final long serialVersionUID = 1L;

    @TableId(value = "order_id", type = IdType.INPUT)
    private String orderId;

    @TableField("user_id")
    private String userId;

    @TableField("hospital_id")
    private String hospitalId;

    @TableField("hospital_name")
    private String hospitalName;

    @TableField("department")
    private String department;

    @TableField("reserve_date")
    private String reserveDate;

    @TableField("status")
    private String status;

    @TableField("create_time")
    private Long createTime;
}