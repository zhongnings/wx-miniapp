-- 资金账户管理表
CREATE TABLE IF NOT EXISTS t_fund_account (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
    assignee VARCHAR(128) NOT NULL COMMENT '受让方',
    payment_channel VARCHAR(64) COMMENT '支付渠道',
    microloan_org VARCHAR(128) COMMENT '小贷机构',
    bank_branch_number VARCHAR(64) COMMENT '开户行号',
    bound_bank VARCHAR(128) COMMENT '绑定银行',
    account_number VARCHAR(64) COMMENT '绑定银行账号',
    payment_password VARCHAR(256) COMMENT '支付密码（加密存储）',
    status TINYINT DEFAULT 1 COMMENT '状态：0-禁用，1-启用',
    created_by VARCHAR(64) COMMENT '创建人',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_assignee (assignee),
    INDEX idx_status (status)
) COMMENT='资金账户管理表';

-- 如果表已存在，添加支付密码字段
ALTER TABLE t_fund_account ADD COLUMN IF NOT EXISTS payment_password VARCHAR(256) COMMENT '支付密码（加密存储）' AFTER account_number;

