-- ============================================
-- 示例数据初始化 SQL
-- 说明：将后端代码中的示例数据转换为 SQL 语句
-- ============================================

-- ============================================
-- 1. 用户数据
-- ============================================
-- 注意：密码已改为 MD5(123456)=e10adc3949ba59abbe56e057f20f883e

INSERT INTO sys_user (id, username, password, nickname, status, tenant_id) VALUES
(1, 'admin', 'e10adc3949ba59abbe56e057f20f883e', '管理员', 1, 0),
(2, 'sales', 'e10adc3949ba59abbe56e057f20f883e', '业务员', 1, 0),
(3, 'applicant', 'e10adc3949ba59abbe56e057f20f883e', '申请人', 1, 0)
ON DUPLICATE KEY UPDATE 
    password = VALUES(password),
    nickname = VALUES(nickname),
    status = VALUES(status);

-- ============================================
-- 2. 权限数据
-- ============================================
INSERT INTO sys_permission (code, name, type, path, tenant_id) VALUES
('order:view', '订单查看', 'api', '/api/orders/**', 0),
('order:edit', '订单编辑', 'api', '/api/orders/**', 0),
('order:pay', '订单打款', 'api', '/api/orders/**/pay', 0),
('contract:preview', '合同预览', 'api', '/api/contracts/**', 0),
-- 菜单权限
('menu:order', '订单列表', 'menu', '/pages/order/list/index', 0),
('menu:account', '资金账户管理', 'menu', '', 0),
('menu:contract', '合同出证', 'menu', '', 0)
ON DUPLICATE KEY UPDATE 
    name = VALUES(name),
    type = VALUES(type),
    path = VALUES(path);

-- ============================================
-- 3. 用户-角色关联
-- ============================================
-- 假设角色 ID：1=APPLICANT, 2=SALES, 3=ADMIN（根据 auth-schema.sql 中的 INSERT 顺序）
-- 如果角色已存在，需要先查询实际的 role_id

-- 管理员关联 ADMIN 角色
INSERT INTO sys_user_role (user_id, role_id)
SELECT 1, id FROM sys_role WHERE code = 'ADMIN'
ON DUPLICATE KEY UPDATE user_id = user_id;

-- 业务员关联 SALES 角色
INSERT INTO sys_user_role (user_id, role_id)
SELECT 2, id FROM sys_role WHERE code = 'SALES'
ON DUPLICATE KEY UPDATE user_id = user_id;

-- 申请人关联 APPLICANT 角色
INSERT INTO sys_user_role (user_id, role_id)
SELECT 3, id FROM sys_role WHERE code = 'APPLICANT'
ON DUPLICATE KEY UPDATE user_id = user_id;

-- ============================================
-- 4. 角色-权限关联
-- ============================================
-- ADMIN 角色：拥有所有权限
INSERT INTO sys_role_permission (role_id, permission_id)
SELECT r.id, p.id 
FROM sys_role r, sys_permission p 
WHERE r.code = 'ADMIN' 
  AND p.code IN ('order:view', 'order:edit', 'order:pay', 'contract:preview',
                 'menu:order', 'menu:account', 'menu:contract')
ON DUPLICATE KEY UPDATE role_id = role_id;

-- SALES 角色：订单查看和编辑
INSERT INTO sys_role_permission (role_id, permission_id)
SELECT r.id, p.id 
FROM sys_role r, sys_permission p 
WHERE r.code = 'SALES' 
  AND p.code IN ('order:view', 'order:edit', 'menu:order')
ON DUPLICATE KEY UPDATE role_id = role_id;

-- APPLICANT 角色：订单查看和编辑
INSERT INTO sys_role_permission (role_id, permission_id)
SELECT r.id, p.id 
FROM sys_role r, sys_permission p 
WHERE r.code = 'APPLICANT' 
  AND p.code IN ('order:view', 'order:edit', 'menu:order')
ON DUPLICATE KEY UPDATE role_id = role_id;

-- ============================================
-- 5. 订单数据
-- ============================================

-- 订单1：冯钢 - 风控驳回
INSERT INTO t_order (
    id, order_no, user_id, borrower_name, loan_amount, loan_days,
    start_date, end_date, annual_rate,
    order_status, risk_status, repayment_status, sign_status,
    loan_info_filled, borrower_info_filled, co_borrower_info_filled,
    guarantor_info_filled, bank_card_info_filled, attachment_uploaded, voucher_info_filled
) VALUES (
    1, '20251205154658629000', 'applicant', '冯钢', 100000.00, 30,
    '2025-12-05', '2026-01-04', 24.00,
    2, 2, 0, 0,
    1, 1, 0, 0, 1, 0, 0
) ON DUPLICATE KEY UPDATE 
    borrower_name = VALUES(borrower_name),
    loan_amount = VALUES(loan_amount),
    order_status = VALUES(order_status);

-- 订单2：张三 - 待提交
INSERT INTO t_order (
    id, order_no, user_id, borrower_name, loan_amount, loan_days,
    start_date, end_date, annual_rate,
    order_status, risk_status, repayment_status, sign_status,
    loan_info_filled, borrower_info_filled, co_borrower_info_filled,
    guarantor_info_filled, bank_card_info_filled, attachment_uploaded, voucher_info_filled
) VALUES (
    2, '20251206120000000001', 'applicant', '张三', 50000.00, 30,
    '2025-12-06', '2026-01-05', 24.00,
    0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0
) ON DUPLICATE KEY UPDATE 
    borrower_name = VALUES(borrower_name),
    loan_amount = VALUES(loan_amount),
    order_status = VALUES(order_status);

-- 订单3：李四 - 风控审核中
INSERT INTO t_order (
    id, order_no, user_id, borrower_name, loan_amount, loan_days,
    start_date, end_date, annual_rate,
    order_status, risk_status, repayment_status, sign_status,
    loan_info_filled, borrower_info_filled, co_borrower_info_filled,
    guarantor_info_filled, bank_card_info_filled, attachment_uploaded, voucher_info_filled
) VALUES (
    3, '20251207120000000002', 'applicant', '李四', 200000.00, 30,
    '2025-12-07', '2026-01-06', 24.00,
    1, 1, 0, 0,
    1, 1, 0, 0, 1, 0, 0
) ON DUPLICATE KEY UPDATE 
    borrower_name = VALUES(borrower_name),
    loan_amount = VALUES(loan_amount),
    order_status = VALUES(order_status);

-- 订单4：王五 - 待放款
INSERT INTO t_order (
    id, order_no, user_id, borrower_name, loan_amount, loan_days,
    start_date, end_date, annual_rate,
    order_status, risk_status, repayment_status, sign_status,
    loan_info_filled, borrower_info_filled, co_borrower_info_filled,
    guarantor_info_filled, bank_card_info_filled, attachment_uploaded, voucher_info_filled
) VALUES (
    4, '20251208120000000003', 'applicant', '王五', 150000.00, 30,
    '2025-12-08', '2026-01-07', 24.00,
    3, 3, 0, 0,
    1, 1, 0, 0, 1, 1, 1
) ON DUPLICATE KEY UPDATE 
    borrower_name = VALUES(borrower_name),
    loan_amount = VALUES(loan_amount),
    order_status = VALUES(order_status);

-- 订单5：赵六 - 放款中
INSERT INTO t_order (
    id, order_no, user_id, borrower_name, loan_amount, loan_days,
    start_date, end_date, annual_rate,
    order_status, risk_status, repayment_status, sign_status,
    loan_info_filled, borrower_info_filled, co_borrower_info_filled,
    guarantor_info_filled, bank_card_info_filled, attachment_uploaded, voucher_info_filled
) VALUES (
    5, '20251209120000000004', 'applicant', '赵六', 300000.00, 30,
    '2025-12-09', '2026-01-08', 24.00,
    4, 4, 0, 0,
    1, 1, 0, 0, 1, 1, 1
) ON DUPLICATE KEY UPDATE 
    borrower_name = VALUES(borrower_name),
    loan_amount = VALUES(loan_amount),
    order_status = VALUES(order_status);

-- 订单6：张庆浪 - 已完成（详细数据）
INSERT INTO t_order (
    id, order_no, user_id, borrower_name, loan_amount, loan_days, 
    start_date, end_date, annual_rate, 
    order_status, risk_status, repayment_status, sign_status,
    loan_info_filled, borrower_info_filled, co_borrower_info_filled, 
    guarantor_info_filled, bank_card_info_filled, attachment_uploaded, voucher_info_filled
) VALUES (
    6, '20251113135235580000', 'applicant', '张庆浪', 400000.00, 30,
    '2025-11-13', '2025-12-12', 24.00,
    8, 3, 3, 2,
    1, 1, 0, 0, 1, 1, 1
) ON DUPLICATE KEY UPDATE 
    borrower_name = VALUES(borrower_name),
    loan_amount = VALUES(loan_amount),
    order_status = VALUES(order_status);

-- 订单6的借款信息
INSERT INTO t_order_loan_info (
    order_id, assignee_org, channel_org, pay_method, product_type, borrower_category,
    contract_sign_mode, loan_amount, loan_amount_uppercase, loan_days,
    start_date, end_date, annual_rate, sign_place, usage_desc, repay_mode,
    dispute_way, arbitration_org, is_notarization
) VALUES (
    6, '广西云桂实业投资有限公司', '南宁市益信小额贷款股份有限公司', '支付宝', '信用业务', '个人',
    '在线签署', 400000.00, '肆拾万元整', 30,
    '2025-11-13', '2025-12-12', 24.00, '广西壮族自治区南宁市兴宁区', '资金周转',
    '按月付息，到期还本', '仲裁解决', '灌阳县仲裁委员会', '否'
) ON DUPLICATE KEY UPDATE order_id = order_id;

-- 订单6的借款人信息
INSERT INTO t_order_borrower (
    order_id, role_type, name, id_type, id_no, id_issue_date, id_expire_date,
    mobile, province_city, address_detail, gender, birthday, marital_status
) VALUES (
    6, 'borrower', '张庆浪', '身份证', '360423198908141319', '2017-01-20', '2037-01-20',
    '13585555776', '上海市奉贤区', '上海市奉贤区泰日镇泰顺镇佳苑21栋103室', '男', '1989-08-14', '已婚'
) ON DUPLICATE KEY UPDATE order_id = order_id;

-- 订单6的银行卡信息
INSERT INTO t_order_bank_card (
    order_id, holder_type, account_name, id_type, id_no, bank_name, card_no, reserved_mobile
) VALUES (
    6, '借款人', '张庆浪', '身份证', '360423198908141319', '浙江泰隆商业银行', '6214806601002364869', '13585555776'
) ON DUPLICATE KEY UPDATE order_id = order_id;

-- 订单6的附件
INSERT INTO t_order_attachment (order_id, name, url) VALUES
(6, '22003fb9a3dcfbe83863d20580ac450.jpg', 'https://dummyimage.com/400x260/ddd/000.jpg&text=22003fb9a3dcfbe83863d20580ac450.jpg'),
(6, '6a79bb30ac5f3e3c5cb9c6231189f4cd.jpg', 'https://dummyimage.com/400x260/ddd/000.jpg&text=6a79bb30ac5f3e3c5cb9c6231189f4cd.jpg')
ON DUPLICATE KEY UPDATE order_id = order_id;

-- 订单6的合同
INSERT INTO t_order_contract (order_id, name, status, pdf_url, read_at) VALUES
(6, '《张庆浪借款合同》', '已签署', 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', '2025-11-13 14:11:45'),
(6, '《广西云桂实业投资有限公司-债权转让协议》', '已签署', 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', NULL)
ON DUPLICATE KEY UPDATE order_id = order_id;

-- 订单6的制单信息
INSERT INTO t_order_voucher (
    order_id, amount, payee, pay_method, open_bank, card_no, remark
) VALUES (
    6, 400000.00, '张庆浪', '主借人', '浙江泰隆商业银行', '6214806601002364869', '无'
) ON DUPLICATE KEY UPDATE order_id = order_id;

-- 订单7-25：历史订单（简化数据）
INSERT INTO t_order (
    id, order_no, user_id, borrower_name, loan_amount, loan_days,
    start_date, end_date, annual_rate,
    order_status, risk_status, repayment_status, sign_status,
    loan_info_filled, borrower_info_filled, co_borrower_info_filled,
    guarantor_info_filled, bank_card_info_filled, attachment_uploaded, voucher_info_filled
) VALUES
(7, '20251113120000000007', 'applicant', '潘磊', 50000.00, 30, '2025-11-13', '2025-12-13', 24.00, 8, 3, 3, 2, 1, 1, 0, 0, 1, 1, 1),
(8, '20251112120000000008', 'applicant', '陈明', 60000.00, 30, '2025-11-12', '2025-12-12', 24.00, 8, 3, 3, 2, 1, 1, 0, 0, 1, 1, 1),
(9, '20251111120000000009', 'applicant', '刘强', 70000.00, 30, '2025-11-11', '2025-12-11', 24.00, 8, 3, 3, 2, 1, 1, 0, 0, 1, 1, 1),
(10, '20251110120000000010', 'applicant', '周杰', 80000.00, 30, '2025-11-10', '2025-12-10', 24.00, 8, 3, 3, 2, 1, 1, 0, 0, 1, 1, 1),
(11, '20251109120000000011', 'applicant', '吴伟', 90000.00, 30, '2025-11-09', '2025-12-09', 24.00, 8, 3, 3, 2, 1, 1, 0, 0, 1, 1, 1),
(12, '20251108120000000012', 'applicant', '郑华', 100000.00, 30, '2025-11-08', '2025-12-08', 24.00, 8, 3, 3, 2, 1, 1, 0, 0, 1, 1, 1),
(13, '20251107120000000013', 'applicant', '王芳', 110000.00, 30, '2025-11-07', '2025-12-07', 24.00, 8, 3, 3, 2, 1, 1, 0, 0, 1, 1, 1),
(14, '20251106120000000014', 'applicant', '李娜', 120000.00, 30, '2025-11-06', '2025-12-06', 24.00, 8, 3, 3, 2, 1, 1, 0, 0, 1, 1, 1),
(15, '20251105120000000015', 'applicant', '张敏', 130000.00, 30, '2025-11-05', '2025-12-05', 24.00, 8, 3, 3, 2, 1, 1, 0, 0, 1, 1, 1),
(16, '20251104120000000016', 'applicant', '赵静', 140000.00, 30, '2025-11-04', '2025-12-04', 24.00, 8, 3, 3, 2, 1, 1, 0, 0, 1, 1, 1),
(17, '20251103120000000017', 'applicant', '潘磊(10)', 150000.00, 30, '2025-11-03', '2025-12-03', 24.00, 8, 3, 3, 2, 1, 1, 0, 0, 1, 1, 1),
(18, '20251102120000000018', 'applicant', '陈明(11)', 160000.00, 30, '2025-11-02', '2025-12-02', 24.00, 8, 3, 3, 2, 1, 1, 0, 0, 1, 1, 1),
(19, '20251101120000000019', 'applicant', '刘强(12)', 170000.00, 30, '2025-11-01', '2025-12-01', 24.00, 8, 3, 3, 2, 1, 1, 0, 0, 1, 1, 1),
(20, '20251031120000000020', 'applicant', '周杰(13)', 180000.00, 30, '2025-10-31', '2025-11-30', 24.00, 8, 3, 3, 2, 1, 1, 0, 0, 1, 1, 1),
(21, '20251030120000000021', 'applicant', '吴伟(14)', 190000.00, 30, '2025-10-30', '2025-11-29', 24.00, 8, 3, 3, 2, 1, 1, 0, 0, 1, 1, 1),
(22, '20251029120000000022', 'applicant', '郑华(15)', 200000.00, 30, '2025-10-29', '2025-11-28', 24.00, 8, 3, 3, 2, 1, 1, 0, 0, 1, 1, 1),
(23, '20251028120000000023', 'applicant', '王芳(16)', 210000.00, 30, '2025-10-28', '2025-11-27', 24.00, 8, 3, 3, 2, 1, 1, 0, 0, 1, 1, 1),
(24, '20251027120000000024', 'applicant', '李娜(17)', 220000.00, 30, '2025-10-27', '2025-11-26', 24.00, 8, 3, 3, 2, 1, 1, 0, 0, 1, 1, 1),
(25, '20251026120000000025', 'applicant', '张敏(18)', 230000.00, 30, '2025-10-26', '2025-11-25', 24.00, 8, 3, 3, 2, 1, 1, 0, 0, 1, 1, 1)
ON DUPLICATE KEY UPDATE 
    borrower_name = VALUES(borrower_name),
    loan_amount = VALUES(loan_amount),
    order_status = VALUES(order_status);

-- ============================================
-- 6. 订单-用户关联（用于权限过滤）
-- ============================================
-- 所有订单的申请人都是 applicant (userId=3)
-- 所有订单的业务员都是 sales (userId=2)

-- 订单1-25的申请人关联
INSERT INTO t_order_user_relation (order_id, user_id, relation_type)
SELECT id, 3, 'APPLICANT_OWNER' FROM t_order WHERE id BETWEEN 1 AND 25
ON DUPLICATE KEY UPDATE order_id = order_id;

-- 订单1-25的业务员关联
INSERT INTO t_order_user_relation (order_id, user_id, relation_type)
SELECT id, 2, 'SALES_OWNER' FROM t_order WHERE id BETWEEN 1 AND 25
ON DUPLICATE KEY UPDATE order_id = order_id;

-- ============================================
-- 7. 订单进度数据（示例：订单6的进度）
-- ============================================
INSERT INTO t_order_progress (order_id, stage, operator, happen_time, remark) VALUES
(6, '签署中', 'kwsy_zd_admin', '2025-11-13 13:58:44', '备注：无'),
(6, '风控审核中', '系统', '2025-11-13 14:10:18', '备注：无'),
(6, '待放款', '汤林', '2025-11-13 16:26:57', '备注：无'),
(6, '放款中', '汤林', '2025-11-13 16:34:11', '备注：无'),
(6, '完成', '系统', '2025-11-13 16:35:48', '备注：无')
ON DUPLICATE KEY UPDATE order_id = order_id;

-- ============================================
-- 执行说明
-- ============================================
-- 1. 请确保已先执行 schema.sql 和 auth-schema.sql 创建表结构
-- 2. 本文件使用 ON DUPLICATE KEY UPDATE 避免重复插入
-- 3. 密码字段建议在生产环境中使用加密后的值（如 BCrypt）
-- 4. 订单数据中的日期、金额等信息可根据实际情况调整
-- 5. 如果表已存在数据，建议先备份或清空相关表后再执行

