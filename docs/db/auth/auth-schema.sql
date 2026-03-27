-- 用户表
CREATE TABLE IF NOT EXISTS sys_user (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(64) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    nickname VARCHAR(64),
    mobile VARCHAR(32),
    email VARCHAR(128),
    status TINYINT DEFAULT 1 COMMENT '1=启用 0=禁用',
    tenant_id BIGINT DEFAULT 0 COMMENT '多租户/多机构标识，可选',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 角色表
CREATE TABLE IF NOT EXISTS sys_role (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    code VARCHAR(64) NOT NULL UNIQUE,
    name VARCHAR(64) NOT NULL,
    tenant_id BIGINT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 预置角色：申请人、业务员、管理员
INSERT INTO sys_role (code, name, tenant_id)
SELECT 'APPLICANT', '申请人', 0 WHERE NOT EXISTS (SELECT 1 FROM sys_role WHERE code = 'APPLICANT');
INSERT INTO sys_role (code, name, tenant_id)
SELECT 'SALES', '业务员', 0 WHERE NOT EXISTS (SELECT 1 FROM sys_role WHERE code = 'SALES');
INSERT INTO sys_role (code, name, tenant_id)
SELECT 'ADMIN', '管理员', 0 WHERE NOT EXISTS (SELECT 1 FROM sys_role WHERE code = 'ADMIN');

-- 权限表（资源/菜单/按钮）
CREATE TABLE IF NOT EXISTS sys_permission (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    code VARCHAR(128) NOT NULL UNIQUE,
    name VARCHAR(128) NOT NULL,
    type VARCHAR(16) COMMENT 'menu/button/api',
    path VARCHAR(255) COMMENT '路由或接口地址',
    tenant_id BIGINT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 用户-角色关联
CREATE TABLE IF NOT EXISTS sys_user_role (
    user_id BIGINT NOT NULL,
    role_id BIGINT NOT NULL,
    PRIMARY KEY (user_id, role_id),
    CONSTRAINT fk_ur_user FOREIGN KEY (user_id) REFERENCES sys_user (id),
    CONSTRAINT fk_ur_role FOREIGN KEY (role_id) REFERENCES sys_role (id)
);

-- 角色-权限关联
CREATE TABLE IF NOT EXISTS sys_role_permission (
    role_id BIGINT NOT NULL,
    permission_id BIGINT NOT NULL,
    PRIMARY KEY (role_id, permission_id),
    CONSTRAINT fk_rp_role FOREIGN KEY (role_id) REFERENCES sys_role (id),
    CONSTRAINT fk_rp_permission FOREIGN KEY (permission_id) REFERENCES sys_permission (id)
);

-- 注册白名单：只有在白名单中的用户名才允许注册（可选启用）
CREATE TABLE IF NOT EXISTS sys_register_allowlist (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(64) NOT NULL UNIQUE COMMENT '允许注册的用户名',
    enabled TINYINT DEFAULT 1 COMMENT '1=启用 0=禁用',
    remark VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 可选：租户/机构表
CREATE TABLE IF NOT EXISTS sys_tenant (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(128) NOT NULL,
    code VARCHAR(64) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

