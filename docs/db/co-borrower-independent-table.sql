-- ============================================
-- 共借人独立表设计方案
-- 将共借人从 t_order_borrower 中独立出来
-- ============================================

-- 1. 创建共借人表
CREATE TABLE IF NOT EXISTS t_order_co_borrower (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
    order_id BIGINT NOT NULL COMMENT '订单ID',
    borrower_type VARCHAR(16) NOT NULL COMMENT '共借人类型：personal-个人，company-对公',
    
    -- ========== 个人信息 ==========
    name VARCHAR(64) COMMENT '姓名',
    id_type VARCHAR(32) COMMENT '证件类型',
    id_no VARCHAR(32) COMMENT '证件号码',
    id_issue_date DATE COMMENT '证件生效日期',
    id_expire_date DATE COMMENT '证件有效期',
    id_address VARCHAR(255) COMMENT '证件地址',
    mobile VARCHAR(32) COMMENT '手机号',
    province_city VARCHAR(128) COMMENT '居住地省市区',
    address_detail VARCHAR(255) COMMENT '详细地址',
    relationship VARCHAR(32) COMMENT '与主借人关系',
    marital_status VARCHAR(16) COMMENT '婚姻状况',
    face_front_url VARCHAR(255) COMMENT '身份证正面图片URL',
    face_back_url VARCHAR(255) COMMENT '身份证反面图片URL',
    
    -- ========== 对公信息 ==========
    business_license_url VARCHAR(255) COMMENT '营业执照图片URL',
    company_name VARCHAR(128) COMMENT '公司名称',
    company_credit_code VARCHAR(64) COMMENT '公司信用代码',
    company_area VARCHAR(128) COMMENT '公司注册地省市区',
    company_address VARCHAR(255) COMMENT '公司详细地址',
    
    -- ========== 经办人信息 ==========
    agent_name VARCHAR(64) COMMENT '经办人姓名',
    agent_mobile VARCHAR(32) COMMENT '经办人手机号',
    agent_id_type VARCHAR(32) COMMENT '经办人证件类型',
    agent_id_no VARCHAR(32) COMMENT '经办人证件号码',
    agent_id_issue_date DATE COMMENT '经办人证件生效日期',
    agent_id_expire_date DATE COMMENT '经办人证件有效期',
    agent_id_address VARCHAR(255) COMMENT '经办人证件地址',
    agent_face_front_url VARCHAR(255) COMMENT '经办人身份证正面图片URL',
    agent_face_back_url VARCHAR(255) COMMENT '经办人身份证反面图片URL',
    
    -- ========== 公证材料 ==========
    notary_documents_json TEXT COMMENT '公证材料JSON（存储文件列表）',
    
    -- ========== 审核状态 ==========
    status TINYINT DEFAULT 0 COMMENT '状态：0-待审核，1-审核通过，2-审核拒绝',
    audit_remark VARCHAR(255) COMMENT '审核备注',
    
    -- ========== 时间戳 ==========
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    
    -- ========== 索引 ==========
    INDEX idx_order_id (order_id),
    INDEX idx_borrower_type (borrower_type),
    INDEX idx_company_name (company_name),
    INDEX idx_name (name),
    INDEX idx_mobile (mobile),
    INDEX idx_status (status),
    
    -- ========== 外键约束 ==========
    CONSTRAINT fk_co_borrower_order FOREIGN KEY (order_id) REFERENCES t_order (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='订单共借人信息表';

-- 2. 创建担保人表（建议也独立出来）
CREATE TABLE IF NOT EXISTS t_order_guarantor (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
    order_id BIGINT NOT NULL COMMENT '订单ID',
    guarantor_type VARCHAR(16) NOT NULL COMMENT '担保人类型：personal-个人，company-对公',
    
    -- ========== 个人信息 ==========
    name VARCHAR(64) COMMENT '姓名',
    id_type VARCHAR(32) COMMENT '证件类型',
    id_no VARCHAR(32) COMMENT '证件号码',
    id_issue_date DATE COMMENT '证件生效日期',
    id_expire_date DATE COMMENT '证件有效期',
    id_address VARCHAR(255) COMMENT '证件地址',
    mobile VARCHAR(32) COMMENT '手机号',
    province_city VARCHAR(128) COMMENT '居住地省市区',
    address_detail VARCHAR(255) COMMENT '详细地址',
    relationship VARCHAR(32) COMMENT '与主借人关系',
    face_front_url VARCHAR(255) COMMENT '身份证正面图片URL',
    face_back_url VARCHAR(255) COMMENT '身份证反面图片URL',
    
    -- ========== 对公信息 ==========
    business_license_url VARCHAR(255) COMMENT '营业执照图片URL',
    company_name VARCHAR(128) COMMENT '公司名称',
    company_credit_code VARCHAR(64) COMMENT '公司信用代码',
    company_area VARCHAR(128) COMMENT '公司注册地省市区',
    company_address VARCHAR(255) COMMENT '公司详细地址',
    
    -- ========== 担保方式 ==========
    guarantee_type VARCHAR(32) COMMENT '担保方式：连带责任保证/一般保证',
    guarantee_amount DECIMAL(18,2) COMMENT '担保金额',
    
    -- ========== 审核状态 ==========
    status TINYINT DEFAULT 0 COMMENT '状态：0-待审核，1-审核通过，2-审核拒绝',
    audit_remark VARCHAR(255) COMMENT '审核备注',
    
    -- ========== 时间戳 ==========
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    
    -- ========== 索引 ==========
    INDEX idx_order_id (order_id),
    INDEX idx_guarantor_type (guarantor_type),
    INDEX idx_company_name (company_name),
    INDEX idx_name (name),
    INDEX idx_status (status),
    
    -- ========== 外键约束 ==========
    CONSTRAINT fk_guarantor_order FOREIGN KEY (order_id) REFERENCES t_order (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='订单担保人信息表';

-- 3. 保留 t_order_borrower 表仅用于主借款人
-- 可以重命名为 t_order_main_borrower 更清晰
ALTER TABLE t_order_borrower COMMENT='订单主借款人信息表（仅存储主借款人）';

-- 或者创建新表并迁移数据
CREATE TABLE IF NOT EXISTS t_order_main_borrower (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
    order_id BIGINT NOT NULL UNIQUE COMMENT '订单ID（一个订单只有一个主借款人）',
    borrower_type VARCHAR(16) NOT NULL COMMENT '借款人类型：personal-个人，company-对公',
    
    -- ========== 个人信息 ==========
    name VARCHAR(64) COMMENT '姓名',
    id_type VARCHAR(32) COMMENT '证件类型',
    id_no VARCHAR(32) COMMENT '证件号码',
    id_issue_date DATE COMMENT '证件生效日期',
    id_expire_date DATE COMMENT '证件有效期',
    id_address VARCHAR(255) COMMENT '证件地址',
    mobile VARCHAR(32) COMMENT '手机号',
    province_city VARCHAR(128) COMMENT '居住地省市区',
    address_detail VARCHAR(255) COMMENT '详细地址',
    gender VARCHAR(8) COMMENT '性别',
    birthday DATE COMMENT '出生日期',
    marital_status VARCHAR(16) COMMENT '婚姻状况',
    face_front_url VARCHAR(255) COMMENT '身份证正面图片URL',
    face_back_url VARCHAR(255) COMMENT '身份证反面图片URL',
    
    -- ========== 对公信息 ==========
    business_license_url VARCHAR(255) COMMENT '营业执照图片URL',
    company_name VARCHAR(128) COMMENT '公司名称',
    company_credit_code VARCHAR(64) COMMENT '公司信用代码',
    company_area VARCHAR(128) COMMENT '公司注册地省市区',
    company_address VARCHAR(255) COMMENT '公司详细地址',
    legal_person VARCHAR(64) COMMENT '法人代表',
    
    -- ========== 时间戳 ==========
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    
    -- ========== 索引 ==========
    INDEX idx_order_id (order_id),
    INDEX idx_name (name),
    INDEX idx_mobile (mobile),
    INDEX idx_id_no (id_no),
    
    -- ========== 外键约束 ==========
    CONSTRAINT fk_main_borrower_order FOREIGN KEY (order_id) REFERENCES t_order (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='订单主借款人信息表';

-- ============================================
-- 数据迁移脚本（如果需要从旧表迁移）
-- ============================================

-- 迁移主借款人数据
INSERT INTO t_order_main_borrower (
    order_id, borrower_type, name, id_type, id_no, id_issue_date, id_expire_date,
    mobile, province_city, address_detail, gender, birthday, marital_status,
    face_front_url, face_back_url, created_at, updated_at
)
SELECT 
    order_id, 'personal' as borrower_type, name, id_type, id_no, id_issue_date, id_expire_date,
    mobile, province_city, address_detail, gender, birthday, marital_status,
    face_front_url, face_back_url, NOW(), NOW()
FROM t_order_borrower
WHERE role_type = 'borrower';

-- 迁移共借人数据
INSERT INTO t_order_co_borrower (
    order_id, borrower_type, name, id_type, id_no, id_issue_date, id_expire_date,
    mobile, province_city, address_detail, marital_status,
    face_front_url, face_back_url, created_at, updated_at
)
SELECT 
    order_id, 'personal' as borrower_type, name, id_type, id_no, id_issue_date, id_expire_date,
    mobile, province_city, address_detail, marital_status,
    face_front_url, face_back_url, NOW(), NOW()
FROM t_order_borrower
WHERE role_type = 'coBorrower';

-- 迁移担保人数据
INSERT INTO t_order_guarantor (
    order_id, guarantor_type, name, id_type, id_no, id_issue_date, id_expire_date,
    mobile, province_city, address_detail,
    face_front_url, face_back_url, created_at, updated_at
)
SELECT 
    order_id, 'personal' as guarantor_type, name, id_type, id_no, id_issue_date, id_expire_date,
    mobile, province_city, address_detail,
    face_front_url, face_back_url, NOW(), NOW()
FROM t_order_borrower
WHERE role_type = 'guarantor';

-- ============================================
-- 表结构对比
-- ============================================

/*
旧方案（混合表）：
t_order_borrower
├── role_type (borrower/coBorrower/guarantor)  # 需要过滤
├── 所有角色的字段混在一起
└── 扩展困难

新方案（独立表）：
t_order_main_borrower      # 主借款人（1对1）
├── order_id (UNIQUE)
└── 主借款人专属字段

t_order_co_borrower        # 共借人（1对多）
├── order_id
├── borrower_type
├── status (审核状态)
└── 共借人专属字段

t_order_guarantor          # 担保人（1对多）
├── order_id
├── guarantor_type
├── guarantee_type (担保方式)
├── guarantee_amount (担保金额)
└── 担保人专属字段
*/

-- ============================================
-- 优势说明
-- ============================================

/*
1. 职责清晰
   - 每个表只负责一种角色
   - 字段含义明确，不会混淆

2. 查询高效
   - 不需要 WHERE role_type = 'xxx'
   - 索引更精准
   - 查询计划更优

3. 扩展方便
   - 共借人可以添加审核状态
   - 担保人可以添加担保方式、担保金额
   - 不影响其他表

4. 约束严格
   - 主借款人：order_id UNIQUE（一个订单只有一个）
   - 共借人/担保人：可以有多个

5. 维护简单
   - 代码逻辑清晰
   - 不需要判断 role_type
   - 减少出错概率

6. 性能更好
   - 表更小，查询更快
   - 索引命中率更高
   - 缓存效率更好
*/

