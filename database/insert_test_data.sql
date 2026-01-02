-- 清理测试数据并重新插入
-- 执行此脚本前请确保已经创建并使用 elderly_assistant 数据库

USE elderly_assistant;

-- 1. 清空现有测试数据（避免主键冲突）
DELETE FROM PAYMENT_CONFIG WHERE user_id = 'USER_123';
DELETE FROM USER_BASE WHERE user_id = 'USER_123';

-- 2. 插入测试用户
INSERT INTO USER_BASE (user_id, user_name, user_age, phone, dialect_type, avatar_url, create_time, update_time) 
VALUES ('USER_123', '张大爷', 68, 'phone_encrypted', 'zh', '', UNIX_TIMESTAMP()*1000, UNIX_TIMESTAMP()*1000);

-- 3. 插入缴费测试数据
INSERT INTO PAYMENT_CONFIG (config_id, user_id, payment_type, account_number, default_amount, status, due_date, bill_month, remark, create_time, update_time, last_pay_time) 
VALUES 
('PAY_ITEM_001', 'USER_123', '电费', '****1234', 126.30, '欠费', '2025-12-05', '2025-11', '2025年11月电费', UNIX_TIMESTAMP()*1000, UNIX_TIMESTAMP()*1000, 0),
('PAY_ITEM_002', 'USER_123', '水费', '****5678', 45.60, '欠费', '2025-12-10', '2025-11', '2025年11月水费', UNIX_TIMESTAMP()*1000, UNIX_TIMESTAMP()*1000, 0),
('PAY_ITEM_003', 'USER_123', '网费', '****9012', 99.00, '欠费', '2025-12-15', '2025-11', '2025年11月网费', UNIX_TIMESTAMP()*1000, UNIX_TIMESTAMP()*1000, 0),
('PAY_ITEM_004', 'USER_123', '话费', '****3456', 50.00, '欠费', '2025-12-20', '2025-11', '2025年11月话费', UNIX_TIMESTAMP()*1000, UNIX_TIMESTAMP()*1000, 0);

-- 4. 验证数据
SELECT '用户数据:' as '验证';
SELECT * FROM USER_BASE WHERE user_id = 'USER_123';

SELECT '缴费数据:' as '验证';
SELECT * FROM PAYMENT_CONFIG WHERE user_id = 'USER_123';

-- 完成提示
SELECT '✅ 测试数据插入成功！' as '状态';
