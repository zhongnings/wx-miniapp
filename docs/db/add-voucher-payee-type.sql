-- 添加收款方类型字段
ALTER TABLE t_order_voucher ADD COLUMN payee_type VARCHAR(32) COMMENT '收款方类型：borrower/coBorrower/guarantor' AFTER payee;

-- 修改 pay_method 字段名为 payee_type（如果之前字段名不对）
-- ALTER TABLE t_order_voucher CHANGE COLUMN pay_method payee_type VARCHAR(32) COMMENT '收款方类型：borrower/coBorrower/guarantor';

