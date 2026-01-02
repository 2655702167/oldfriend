package com.elderly.assistant.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.elderly.assistant.entity.HospitalInfo;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;
import java.util.Map;  // 添加这个 import

@Mapper
public interface HospitalInfoMapper extends BaseMapper<HospitalInfo> {
    
    @Select("SELECT * FROM HOSPITAL_INFO " +
            "WHERE hospital_name LIKE CONCAT('%', #{keyword}, '%') " +
            "AND status = 'enabled' " +
            "ORDER BY hospital_name LIMIT #{limit}")
    List<HospitalInfo> searchByName(@Param("keyword") String keyword, 
                                   @Param("limit") int limit);
    
    @Select("SELECT *, " +
            "(6371 * acos(cos(radians(#{latitude})) * cos(radians(latitude)) * " +
            "cos(radians(longitude) - radians(#{longitude})) + " +
            "sin(radians(#{latitude})) * sin(radians(latitude)))) AS distance " +
            "FROM HOSPITAL_INFO " +
            "WHERE status = 'enabled' " +
            "HAVING distance < #{radius} " +
            "ORDER BY distance " +
            "LIMIT #{limit}")
    List<Map<String, Object>> findNearbyHospitals(@Param("longitude") Double longitude,
                                                  @Param("latitude") Double latitude,
                                                  @Param("radius") Double radius,
                                                  @Param("limit") Integer limit);
}