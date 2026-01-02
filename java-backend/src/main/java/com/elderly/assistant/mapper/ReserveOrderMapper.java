package com.elderly.assistant.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.elderly.assistant.entity.ReserveOrder;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;
import java.util.Map;

@Mapper
public interface ReserveOrderMapper extends BaseMapper<ReserveOrder> {
    
    /**
     * 根据用户ID查询挂号记录
     */
    @Select("SELECT * FROM RESERVE_ORDER WHERE user_id = #{userId} ORDER BY create_time DESC")
    List<ReserveOrder> selectByUserId(@Param("userId") String userId);
    
    /**
     * 查询用户未完成的挂号（已预约状态）
     */
    @Select("SELECT * FROM RESERVE_ORDER WHERE user_id = #{userId} AND status = '已预约' ORDER BY reserve_date ASC")
    List<ReserveOrder> selectActiveByUserId(@Param("userId") String userId);
    
    /**
     * 查询挂号详情（关联医院信息）
     */
    @Select("SELECT ro.*, hi.address, hi.phone, hi.opening_hours " +
            "FROM RESERVE_ORDER ro " +
            "LEFT JOIN HOSPITAL_INFO hi ON ro.hospital_id = hi.hospital_id " +
            "WHERE ro.order_id = #{orderId}")
    Map<String, Object> selectOrderDetail(@Param("orderId") String orderId);
    
    /**
     * 统计用户挂号数量
     */
    @Select("SELECT status, COUNT(*) as count FROM RESERVE_ORDER " +
            "WHERE user_id = #{userId} GROUP BY status")
    List<Map<String, Object>> countByStatus(@Param("userId") String userId);
}