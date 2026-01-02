-- =====================================================
-- 老友助手 - 测试数据补充脚本
-- 用于完善医院、缴费等功能的测试数据
-- =====================================================

USE elderly_assistant;

-- =====================================================
-- 1. 补充更多医院数据（用于定位最近3家医院功能）
-- =====================================================

-- 删除旧数据（如果存在）
DELETE FROM HOSPITAL_INFO WHERE hospital_id IN ('H003', 'H004', 'H005', 'H006', 'H007');

-- 插入更多医院（模拟北京市朝阳区附近的医院）
INSERT INTO HOSPITAL_INFO (
    hospital_id, 
    hospital_name, 
    hospital_level, 
    hospital_type, 
    address, 
    phone, 
    emergency_phone,
    longitude, 
    latitude, 
    departments, 
    daily_quota, 
    available_quota, 
    opening_hours, 
    status
) VALUES
-- 北京朝阳区医院（以国贸为中心，经度116.46，纬度39.91附近）
('H003', '朝阳医院', '三级甲等', '综合医院', '北京市朝阳区工人体育场南路8号', '010-85231000', '120', 
 116.4644, 39.9219, 
 '["内科","外科","骨科","眼科","中医科","皮肤科","牙科","急诊科"]', 
 150, 120, '24小时', 'enabled'),

('H004', '社区卫生服务中心', '一级', '社区医院', '北京市朝阳区建国路88号', '010-65012345', '120', 
 116.4520, 39.9150, 
 '["内科","外科","中医科","康复科"]', 
 50, 45, '周一至周日 8:00-17:00', 'enabled'),

('H005', '北京中医医院朝阳分院', '三级乙等', '中医医院', '北京市朝阳区东四环中路6号', '010-67890123', '120', 
 116.4890, 39.9080, 
 '["中医科","针灸科","推拿科","内科","康复科"]', 
 100, 85, '周一至周六 8:00-17:00', 'enabled'),

('H006', '北京友谊医院', '三级甲等', '综合医院', '北京市朝阳区永安路95号', '010-63016616', '120', 
 116.4330, 39.8950, 
 '["内科","外科","骨科","眼科","牙科","皮肤科"]', 
 200, 180, '24小时', 'enabled'),

('H007', '民航总医院', '三级综合', '综合医院', '北京市朝阳区高井朝阳路8号', '010-85762244', '120', 
 116.3810, 39.9280, 
 '["内科","外科","骨科","眼科","急诊科"]', 
 120, 100, '24小时', 'enabled');

-- =====================================================
-- 2. 补充用户测试数据
-- =====================================================

-- 插入测试用户（USER_123 - 与前端代码对应）
INSERT INTO USER_BASE (user_id, user_name, user_age, phone, dialect_type, create_time) 
VALUES ('USER_123', '测试用户', 70, 'ENCRYPTED_13800138000', 'zh', UNIX_TIMESTAMP() * 1000)
ON DUPLICATE KEY UPDATE user_name = '测试用户';

-- 为测试用户添加家属
INSERT INTO USER_FAMILY (family_id, user_id, family_name, family_phone, relation, is_default_pay, is_primary, priority, create_time) 
VALUES 
('FAMILY_123_01', 'USER_123', '王明', 'ENCRYPTED_13911112222', '儿子', TRUE, TRUE, 1, UNIX_TIMESTAMP() * 1000),
('FAMILY_123_02', 'USER_123', '王丽', 'ENCRYPTED_13922223333', '女儿', FALSE, FALSE, 2, UNIX_TIMESTAMP() * 1000)
ON DUPLICATE KEY UPDATE family_name = family_name;

-- =====================================================
-- 3. 补充缴费测试数据（更多待缴费项目）
-- =====================================================

-- 删除旧的缴费数据
DELETE FROM PAYMENT_CONFIG WHERE user_id = 'USER_123';

-- 插入缴费项目
INSERT INTO PAYMENT_CONFIG (
    config_id, 
    user_id, 
    payment_type, 
    account_number, 
    amount, 
    due_date, 
    status, 
    create_time
) VALUES
('PAY_ITEM_001', 'USER_123', '电费', 'ENCRYPTED_110000123456', 128.50, '2025-12-15', 'pending', UNIX_TIMESTAMP() * 1000),
('PAY_ITEM_002', 'USER_123', '水费', 'ENCRYPTED_110000654321', 56.80, '2025-12-20', 'pending', UNIX_TIMESTAMP() * 1000),
('PAY_ITEM_003', 'USER_123', '网费', 'ENCRYPTED_110000789012', 100.00, '2025-12-25', 'pending', UNIX_TIMESTAMP() * 1000),
('PAY_ITEM_004', 'USER_123', '话费', 'ENCRYPTED_13800138000', 50.00, '2025-12-30', 'pending', UNIX_TIMESTAMP() * 1000);

-- =====================================================
-- 4. 补充常用地址（打车快捷目的地）
-- =====================================================

-- 删除旧地址数据
DELETE FROM TAXI_COMMON_ADDRESS WHERE user_id = 'USER_123';

-- 插入常用地址（北京朝阳区附近）
INSERT INTO TAXI_COMMON_ADDRESS (
    addr_id, 
    user_id, 
    display_name, 
    address, 
    longitude, 
    latitude, 
    tag, 
    is_default, 
    priority, 
    create_time
) VALUES
('ADDR_123_HOME', 'USER_123', '家', '北京市朝阳区建国路100号', 116.4350, 39.9050, 'HOME', TRUE, 1, UNIX_TIMESTAMP() * 1000),
('ADDR_123_HOSPITAL', 'USER_123', '朝阳医院', '北京市朝阳区工人体育场南路8号', 116.4644, 39.9219, 'HOSPITAL', FALSE, 2, UNIX_TIMESTAMP() * 1000),
('ADDR_123_SUPERMARKET', 'USER_123', '华联超市', '北京市朝阳区建国路88号', 116.4520, 39.9150, 'SUPERMARKET', FALSE, 3, UNIX_TIMESTAMP() * 1000);

-- =====================================================
-- 5. 创建聊天记录表（如果不存在）
-- =====================================================

CREATE TABLE IF NOT EXISTS CHAT_HISTORY (
    chat_id VARCHAR(50) PRIMARY KEY COMMENT '聊天记录ID',
    user_id VARCHAR(50) NOT NULL COMMENT '用户ID',
    message_type VARCHAR(20) NOT NULL COMMENT '消息类型（user/ai）',
    message_content TEXT NOT NULL COMMENT '消息内容',
    create_time BIGINT NOT NULL COMMENT '创建时间',
    FOREIGN KEY (user_id) REFERENCES USER_BASE(user_id) ON DELETE CASCADE,
    INDEX idx_user_id(user_id),
    INDEX idx_create_time(create_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='聊天历史记录表';

COMMIT;

-- =====================================================
-- 查询验证数据
-- =====================================================

-- 查看所有医院
SELECT hospital_id, hospital_name, address, longitude, latitude, status FROM HOSPITAL_INFO;

-- 查看测试用户的缴费项目
SELECT config_id, payment_type, amount, due_date, status FROM PAYMENT_CONFIG WHERE user_id = 'USER_123';

-- 查看测试用户的常用地址
SELECT addr_id, display_name, address, longitude, latitude, tag FROM TAXI_COMMON_ADDRESS WHERE user_id = 'USER_123';

-- =====================================================
-- 使用说明
-- =====================================================
-- 1. 运行此脚本前，确保已执行 init_database.sql
-- 2. 此脚本会删除并重新插入测试数据
-- 3. 用户ID统一使用 USER_123，与前端代码保持一致
-- 4. 医院坐标设置在北京朝阳区附近（可根据实际情况修改）
-- 5. 所有敏感数据（手机号、账号）使用 ENCRYPTED_ 前缀标识加密状态
-- =====================================================
