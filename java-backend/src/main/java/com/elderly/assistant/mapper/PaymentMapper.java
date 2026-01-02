package com.elderly.assistant.mapper;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.elderly.assistant.entity.PaymentItem;

/**
 * 缴费项目Mapper接口
 */
@Mapper
public interface PaymentMapper extends BaseMapper<PaymentItem> {
    
    /**
     * 根据用户ID查询未缴费项目
     */
    @Select("SELECT * FROM PAYMENT_CONFIG WHERE user_id = #{userId} AND status = 'pending' ORDER BY due_date ASC")
    List<PaymentItem> selectUnpaidItemsByUserId(@Param("userId") String userId);
    
    /**
     * 根据用户ID查询所有缴费项目
     */
    @Select("SELECT * FROM PAYMENT_CONFIG WHERE user_id = #{userId} ORDER BY create_time DESC")
    List<PaymentItem> selectAllItemsByUserId(@Param("userId") String userId);
    
    /**
     * 根据缴费类型查询
     */
    @Select("SELECT * FROM PAYMENT_CONFIG WHERE user_id = #{userId} AND payment_type = #{paymentType} ORDER BY create_time DESC")
    List<PaymentItem> selectItemsByType(@Param("userId") String userId, 
                                        @Param("paymentType") String paymentType);
    
    /**
     * 查询已过期未缴费项目
     */
    @Select("SELECT * FROM PAYMENT_CONFIG WHERE user_id = #{userId} AND status = 'pending' " +
            "AND due_date < CURDATE() ORDER BY due_date ASC")
    List<PaymentItem> selectOverdueItems(@Param("userId") String userId);
    
    /**
     * 更新缴费状态
     */
    @Update("UPDATE PAYMENT_CONFIG SET status = #{status}, update_time = #{updateTime}, " +
            "last_pay_time = #{lastPayTime} WHERE config_id = #{itemId}")
    int updatePaymentStatus(@Param("itemId") String itemId,
                           @Param("status") String status,
                           @Param("updateTime") Long updateTime,
                           @Param("lastPayTime") Long lastPayTime);
    
    /**
     * 更新缴费金额
     */
    @Update("UPDATE PAYMENT_CONFIG SET amount = #{amount}, update_time = #{updateTime} " +
            "WHERE config_id = #{itemId}")
    int updatePaymentAmount(@Param("itemId") String itemId,
                           @Param("amount") BigDecimal amount,
                           @Param("updateTime") Long updateTime);
    
    /**
     * 批量更新缴费状态
     */
    @Update("<script>" +
            "UPDATE PAYMENT_CONFIG SET status = 'paid', update_time = #{updateTime}, " +
            "last_pay_time = #{lastPayTime} WHERE config_id IN " +
            "<foreach collection='itemIds' item='id' open='(' separator=',' close=')'>" +
            "#{id}" +
            "</foreach>" +
            "</script>")
    int batchUpdatePaymentStatus(@Param("itemIds") List<String> itemIds,
                                @Param("updateTime") Long updateTime,
                                @Param("lastPayTime") Long lastPayTime);
    
    /**
     * 统计用户缴费情况
     */
    @Select("SELECT " +
            "COUNT(*) as total_count, " +
            "SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_count, " +
            "SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) as paid_count, " +
            "SUM(CASE WHEN status = 'pending' AND due_date < CURDATE() THEN 1 ELSE 0 END) as overdue_count, " +
            "SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as pending_amount, " +
            "SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) as paid_amount " +
            "FROM PAYMENT_CONFIG WHERE user_id = #{userId}")
    Map<String, Object> selectPaymentStats(@Param("userId") String userId);
    
    /**
     * 按月份统计缴费金额
     */
    @Select("SELECT " +
            "bill_month, " +
            "payment_type, " +
            "COUNT(*) as item_count, " +
            "SUM(amount) as total_amount, " +
            "SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) as paid_amount " +
            "FROM PAYMENT_CONFIG " +
            "WHERE user_id = #{userId} AND bill_month IS NOT NULL " +
            "GROUP BY bill_month, payment_type " +
            "ORDER BY bill_month DESC")
    List<Map<String, Object>> selectMonthlyStats(@Param("userId") String userId);
    
    /**
     * 检查账号是否已存在
     */
    @Select("SELECT COUNT(*) FROM PAYMENT_CONFIG " +
            "WHERE user_id = #{userId} AND account_number = #{accountNumber} " +
            "AND payment_type = #{paymentType}")
    int checkAccountExists(@Param("userId") String userId,
                          @Param("accountNumber") String accountNumber,
                          @Param("paymentType") String paymentType);
    
    /**
     * 根据条件和关键字搜索缴费项目
     */
    @Select("<script>" +
            "SELECT * FROM PAYMENT_CONFIG " +
            "WHERE user_id = #{userId} " +
            "<if test='paymentType != null and paymentType != \"\"'>" +
            "  AND payment_type = #{paymentType} " +
            "</if>" +
            "<if test='status != null and status != \"\"'>" +
            "  AND status = #{status} " +
            "</if>" +
            "<if test='keyword != null and keyword != \"\"'>" +
            "  AND (account_number LIKE CONCAT('%', #{keyword}, '%') " +
            "       OR remark LIKE CONCAT('%', #{keyword}, '%')) " +
            "</if>" +
            "ORDER BY " +
            "<choose>" +
            "  <when test='sortField == \"due_date\"'>due_date</when>" +
            "  <when test='sortField == \"amount\"'>amount</when>" +
            "  <otherwise>create_time</otherwise>" +
            "</choose> " +
            "<choose>" +
            "  <when test='sortOrder == \"asc\"'>ASC</when>" +
            "  <otherwise>DESC</otherwise>" +
            "</choose> " +
            "LIMIT #{limit} OFFSET #{offset}" +
            "</script>")
    List<PaymentItem> searchPaymentItems(@Param("userId") String userId,
                                         @Param("paymentType") String paymentType,
                                         @Param("status") String status,
                                         @Param("keyword") String keyword,
                                         @Param("sortField") String sortField,
                                         @Param("sortOrder") String sortOrder,
                                         @Param("limit") Integer limit,
                                         @Param("offset") Integer offset);
    
    /**
     * 统计搜索结果的条数
     */
    @Select("<script>" +
            "SELECT COUNT(*) FROM PAYMENT_CONFIG " +
            "WHERE user_id = #{userId} " +
            "<if test='paymentType != null and paymentType != \"\"'>" +
            "  AND payment_type = #{paymentType} " +
            "</if>" +
            "<if test='status != null and status != \"\"'>" +
            "  AND status = #{status} " +
            "</if>" +
            "<if test='keyword != null and keyword != \"\"'>" +
            "  AND (account_number LIKE CONCAT('%', #{keyword}, '%') " +
            "       OR remark LIKE CONCAT('%', #{keyword}, '%')) " +
            "</if>" +
            "</script>")
    int countSearchResults(@Param("userId") String userId,
                          @Param("paymentType") String paymentType,
                          @Param("status") String status,
                          @Param("keyword") String keyword);
    
    /**
     * 查询最近N个月的缴费趋势
     */
    @Select("SELECT " +
            "DATE_FORMAT(create_time, '%Y-%m') as month, " +
            "COUNT(*) as item_count, " +
            "SUM(amount) as total_amount " +
            "FROM PAYMENT_CONFIG " +
            "WHERE user_id = #{userId} " +
            "AND create_time >= DATE_SUB(NOW(), INTERVAL #{months} MONTH) " +
            "GROUP BY DATE_FORMAT(create_time, '%Y-%m') " +
            "ORDER BY month ASC")
    List<Map<String, Object>> selectPaymentTrend(@Param("userId") String userId,
                                                @Param("months") Integer months);
}