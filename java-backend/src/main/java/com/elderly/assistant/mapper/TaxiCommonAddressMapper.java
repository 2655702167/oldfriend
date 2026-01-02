package com.elderly.assistant.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.elderly.assistant.entity.TaxiCommonAddress;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface TaxiCommonAddressMapper extends BaseMapper<TaxiCommonAddress> {
    
    /**
     * 根据用户ID查询常用地址（按优先级排序）
     */
    @Select("SELECT * FROM TAXI_COMMON_ADDRESS WHERE user_id = #{userId} ORDER BY priority ASC, last_use_time DESC")
    List<TaxiCommonAddress> selectByUserId(@Param("userId") String userId);
    
    /**
     * 查询用户的默认地址
     */
    @Select("SELECT * FROM TAXI_COMMON_ADDRESS WHERE user_id = #{userId} AND is_default = TRUE LIMIT 1")
    TaxiCommonAddress selectDefaultAddress(@Param("userId") String userId);
    
    /**
     * 查询用户最近使用的地址
     */
    @Select("SELECT * FROM TAXI_COMMON_ADDRESS WHERE user_id = #{userId} ORDER BY last_use_time DESC LIMIT #{limit}")
    List<TaxiCommonAddress> selectRecentAddresses(@Param("userId") String userId, @Param("limit") int limit);
    
    /**
     * 根据标签查询地址
     */
    @Select("SELECT * FROM TAXI_COMMON_ADDRESS WHERE user_id = #{userId} AND tag = #{tag} ORDER BY priority ASC")
    List<TaxiCommonAddress> selectByTag(@Param("userId") String userId, @Param("tag") String tag);
    
    /**
     * 更新最后使用时间
     */
    @Select("UPDATE TAXI_COMMON_ADDRESS SET last_use_time = #{lastUseTime} WHERE addr_id = #{addrId}")
    void updateLastUseTime(@Param("addrId") String addrId, @Param("lastUseTime") Long lastUseTime);
}