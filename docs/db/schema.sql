-- 订单表（仅保存订单基本信息、整体状态及各资料填写状态）
CREATE TABLE IF NOT EXISTS t_order (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
    order_no VARCHAR(64) NOT NULL UNIQUE COMMENT '订单编号',
    user_id VARCHAR(64) COMMENT '用户ID（微信openid或其他标识）',
    borrower_name VARCHAR(64) NOT NULL COMMENT '借款人姓名',
    loan_amount DECIMAL(18,2) NOT NULL COMMENT '借款金额',
    loan_days INT COMMENT '借款天数',
    start_date DATE COMMENT '开始日期',
    end_date DATE COMMENT '结束日期',
    annual_rate DECIMAL(5,2) COMMENT '年化利率',
    order_status TINYINT COMMENT '订单状态：0待提交/1风控审核中/2风控驳回/3待放款/4放款中/5待债转/6签署中/7待人脸识别/8完成',
    risk_status TINYINT COMMENT '风控状态：0待提交/1审核中/2驳回/3通过',
    repayment_status TINYINT COMMENT '还款状态：0未开始/1还款中/2逾期/3已结清',
    sign_status TINYINT COMMENT '签署状态：0未开始/1签署中/2已签署/3签署失败/4待人脸识别',
    -- 各资料填写/上传状态（0-未完成，1-已完成）
    loan_info_filled TINYINT(1) DEFAULT 0 COMMENT '借款信息是否已完成',
    borrower_info_filled TINYINT(1) DEFAULT 0 COMMENT '借款人信息是否已完成',
    co_borrower_info_filled TINYINT(1) DEFAULT 0 COMMENT '共借人信息是否已完成',
    guarantor_info_filled TINYINT(1) DEFAULT 0 COMMENT '担保人信息是否已完成',
    bank_card_info_filled TINYINT(1) DEFAULT 0 COMMENT '银行卡信息是否已完成',
    attachment_uploaded TINYINT(1) DEFAULT 0 COMMENT '资料是否已上传',
    voucher_info_filled TINYINT(1) DEFAULT 0 COMMENT '制单信息是否已完成',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_user_id (user_id)
);

-- 借款人信息
CREATE TABLE IF NOT EXISTS t_order_borrower (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
    order_id BIGINT NOT NULL COMMENT '订单ID',
    role_type VARCHAR(16) NOT NULL COMMENT 'borrower/coBorrower/guarantor',
    name VARCHAR(64) COMMENT '姓名',
    id_type VARCHAR(32) COMMENT '证件类型',
    id_no VARCHAR(32) COMMENT '证件号码',
    id_issue_date DATE COMMENT '证件签发日期',
    id_expire_date DATE COMMENT '证件到期日期',
    mobile VARCHAR(32) COMMENT '手机号',
    province_city VARCHAR(64) COMMENT '省市',
    address_detail VARCHAR(128) COMMENT '详细地址',
    gender VARCHAR(8) COMMENT '性别',
    birthday DATE COMMENT '出生日期',
    marital_status VARCHAR(16) COMMENT '婚姻状况',
    face_front_url VARCHAR(255) COMMENT '身份证正面图片URL',
    face_back_url VARCHAR(255) COMMENT '身份证反面图片URL',
    INDEX idx_order_role (order_id, role_type),
    CONSTRAINT fk_borrower_order FOREIGN KEY (order_id) REFERENCES t_order (id)
);

-- 借款信息
CREATE TABLE IF NOT EXISTS t_order_loan_info (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
    order_id BIGINT NOT NULL COMMENT '订单ID',
    assignee_org VARCHAR(128) COMMENT '受让机构',
    channel_org VARCHAR(128) COMMENT '小贷机构/渠道机构',
    pay_method VARCHAR(32) COMMENT '支付渠道',
    product_type VARCHAR(64) COMMENT '产品类型',
    borrower_category VARCHAR(16) COMMENT '借款人类型：个人/对公',
    contract_sign_mode VARCHAR(32) COMMENT '合同签署方式：在线签署/线下签署',
    loan_amount DECIMAL(18,2) COMMENT '借款金额',
    loan_amount_uppercase VARCHAR(64) COMMENT '借款金额大写',
    loan_days INT COMMENT '借款天数',
    start_date DATE COMMENT '借款起始日期',
    end_date DATE COMMENT '借款结束日期',
    annual_rate DECIMAL(5,2) COMMENT '借款年利率(%)',
    sign_place VARCHAR(128) COMMENT '签约地',
    usage_desc VARCHAR(128) COMMENT '借款用途',
    repay_mode VARCHAR(64) COMMENT '还款方式',
    dispute_way VARCHAR(64) COMMENT '解决争议方式',
    arbitration_org VARCHAR(128) COMMENT '仲裁机构',
    is_notarization VARCHAR(8) COMMENT '是否办理赋强公证：是/否',
    penalty_ratio DECIMAL(5,2) COMMENT '提前还款违约金比例(%)',
    notarization_type VARCHAR(64) COMMENT '公证类型：赋强公证',
    notarization_item VARCHAR(64) COMMENT '公证事项：有抵押赋强/无抵押赋强',
    appointment_time DATETIME COMMENT '预约时间（年月日时分）',
    certificate_receive_method VARCHAR(32) COMMENT '证书接收方式：电子版/邮寄',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    CONSTRAINT fk_loan_order FOREIGN KEY (order_id) REFERENCES t_order (id)
);

-- 银行卡信息
CREATE TABLE IF NOT EXISTS t_order_bank_card (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    order_id BIGINT NOT NULL,
    holder_type VARCHAR(16),
    account_name VARCHAR(64),
    id_type VARCHAR(32),
    id_no VARCHAR(32),
    bank_name VARCHAR(128),
    card_no VARCHAR(64),
    reserved_mobile VARCHAR(32),
    card_front_url VARCHAR(255),
    CONSTRAINT fk_bank_order FOREIGN KEY (order_id) REFERENCES t_order (id)
);

-- 附件
CREATE TABLE IF NOT EXISTS t_order_attachment (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    order_id BIGINT NOT NULL,
    name VARCHAR(128),
    url VARCHAR(255),
    CONSTRAINT fk_attachment_order FOREIGN KEY (order_id) REFERENCES t_order (id)
);

-- 合同
CREATE TABLE IF NOT EXISTS t_order_contract (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    order_id BIGINT NOT NULL,
    name VARCHAR(128) COMMENT '合同名称',
    signer VARCHAR(64) COMMENT '签署人',
    status VARCHAR(32) COMMENT '状态：未签/已签',
    pdf_url VARCHAR(255) COMMENT '合同PDF文件路径',
    qr_code_url VARCHAR(255) COMMENT '获取签署二维码的接口路径',
    ess_flow_id VARCHAR(64) COMMENT '电子签平台 FlowId',
    read_at DATETIME COMMENT '已读时间',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    CONSTRAINT fk_contract_order FOREIGN KEY (order_id) REFERENCES t_order (id) ON DELETE CASCADE
);

-- 进度
CREATE TABLE IF NOT EXISTS t_order_progress (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    order_id BIGINT NOT NULL,
    stage VARCHAR(64),
    operator VARCHAR(64),
    happen_time DATETIME,
    remark VARCHAR(255),
    CONSTRAINT fk_progress_order FOREIGN KEY (order_id) REFERENCES t_order (id)
);

-- 制单信息
CREATE TABLE IF NOT EXISTS t_order_voucher (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    order_id BIGINT NOT NULL,
    amount DECIMAL(18,2),
    payee VARCHAR(64),
    pay_method VARCHAR(32),
    open_bank VARCHAR(128),
    card_no VARCHAR(64),
    remark VARCHAR(255),
    CONSTRAINT fk_voucher_order FOREIGN KEY (order_id) REFERENCES t_order (id)
);

-- 订单与用户（业务员/申请人）关联，用于权限过滤
CREATE TABLE IF NOT EXISTS t_order_user_relation (
    order_id BIGINT NOT NULL COMMENT '订单ID',
    user_id BIGINT NOT NULL COMMENT '用户ID（可为申请人或业务员）',
    relation_type VARCHAR(32) NOT NULL COMMENT 'APPLICANT_OWNER / SALES_OWNER',
    PRIMARY KEY (order_id, user_id, relation_type),
    CONSTRAINT fk_relation_order FOREIGN KEY (order_id) REFERENCES t_order (id)
);


