-- ============================================
-- 权限数据修复脚本
-- 说明：修复权限表数据，确保放款权限正确配置
-- ============================================

-- ============================================
-- 1. 确保所有权限数据存在
-- ============================================
INSERT INTO sys_permission (code, name, type, path, tenant_id) VALUES
('order:view', '订单查看', 'api', '/api/orders/**', 0),
('order:edit', '订单编辑', 'api', '/api/orders/**', 0),
('order:pay', '订单打款', 'api', '/api/orders/**/pay', 0),
('contract:preview', '合同预览', 'api', '/api/contracts/**', 0),
('menu:order', '订单列表', 'menu', '/pages/order/list/index', 0),
('menu:account', '资金账户管理', 'menu', '/pages/account/list/index', 0),
('menu:contract', '合同出证', 'menu', '/pages/contract/list/index', 0)
ON DUPLICATE KEY UPDATE 
    name = VALUES(name),
    type = VALUES(type),
    path = VALUES(path);

-- ============================================
-- 2. 清理旧的角色-权限关联（可选）
-- ============================================
-- 如果需要重新配置，可以先清空
-- DELETE FROM sys_role_permission;

-- ============================================
-- 3. 重新配置角色-权限关联
-- ============================================

-- ADMIN 角色（role_id=3）：拥有所有权限
DELETE FROM sys_role_permission WHERE role_id = 3;
INSERT INTO sys_role_permission (role_id, permission_id)
SELECT 3, id FROM sys_permission 
WHERE code IN ('order:view', 'order:edit', 'order:pay', 'contract:preview',
               'menu:order', 'menu:account', 'menu:contract');

-- SALES 角色（role_id=2）：订单查看、编辑、合同预览
DELETE FROM sys_role_permission WHERE role_id = 2;
INSERT INTO sys_role_permission (role_id, permission_id)
SELECT 2, id FROM sys_permission 
WHERE code IN ('order:view', 'order:edit', 'contract:preview', 'menu:order');

-- APPLICANT 角色（role_id=1）：订单查看、编辑
DELETE FROM sys_role_permission WHERE role_id = 1;
INSERT INTO sys_role_permission (role_id, permission_id)
SELECT 1, id FROM sys_permission 
WHERE code IN ('order:view', 'order:edit', 'menu:order');

-- ============================================
-- 4. 验证数据
-- ============================================

-- 查看所有权限
SELECT * FROM sys_permission ORDER BY id;

-- 查看所有角色
SELECT * FROM sys_role ORDER BY id;

-- 查看角色-权限关联（带权限名称）
SELECT 
    r.id AS role_id,
    r.code AS role_code,
    r.name AS role_name,
    p.id AS permission_id,
    p.code AS permission_code,
    p.name AS permission_name,
    p.type AS permission_type
FROM sys_role_permission rp
JOIN sys_role r ON rp.role_id = r.id
JOIN sys_permission p ON rp.permission_id = p.id
ORDER BY r.id, p.id;

-- 查看用户-角色关联
SELECT 
    u.id AS user_id,
    u.username,
    r.id AS role_id,
    r.code AS role_code,
    r.name AS role_name
FROM sys_user_role ur
JOIN sys_user u ON ur.user_id = u.id
JOIN sys_role r ON ur.role_id = r.id
ORDER BY u.id;

-- ============================================
-- 5. 测试查询：查看admin用户的所有权限
-- ============================================
SELECT DISTINCT p.code, p.name, p.type
FROM sys_user u
JOIN sys_user_role ur ON u.id = ur.user_id
JOIN sys_role r ON ur.role_id = r.id
JOIN sys_role_permission rp ON r.id = rp.role_id
JOIN sys_permission p ON rp.permission_id = p.id
WHERE u.username = 'admin'
ORDER BY p.type, p.code;

-- ============================================
-- 执行说明
-- ============================================
-- 1. 本脚本会重新配置角色-权限关联
-- 2. 确保 order:pay 权限分配给 ADMIN 角色
-- 3. 执行后请验证数据是否正确
-- 4. 建议先在测试环境执行，确认无误后再在生产环境执行

