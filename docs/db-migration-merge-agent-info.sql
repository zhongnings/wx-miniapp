-- ============================================
-- 数据库迁移脚本：合并经办人信息到个人信息
-- 日期：2026-02-16
-- 说明：删除独立的经办人字段，复用个人信息字段
-- ============================================

-- 1. 共借人表迁移
-- ============================================

-- 1.1 修改 borrower_type 字段注释，支持 property 类型
ALTER TABLE `t_order_co_borrower` 
MODIFY COLUMN `borrower_type` VARCHAR(20) COMMENT '共借人类型：personal-个人，company-对公，property-房产';

-- 1.2 修改对公信息字段注释，支持房产类型
ALTER TABLE `t_order_co_borrower` 
MODIFY COLUMN `business_license_url` VARCHAR(500) COMMENT '营业执照/房产证图片URL',
MODIFY COLUMN `company_name` VARCHAR(200) COMMENT '公司名称/房产证号码',
MODIFY COLUMN `company_area` VARCHAR(100) COMMENT '公司注册地/房产地省市区',
MODIFY COLUMN `company_address` VARCHAR(500) COMMENT '公司/房产详细地址';

-- 1.3 修改 agent_mobile 字段注释
ALTER TABLE `t_order_co_borrower` 
MODIFY COLUMN `agent_mobile` VARCHAR(20) COMMENT '经办人手机号（对公/房产类型时使用）';

-- 1.4 删除独立的经办人信息字段
ALTER TABLE `t_order_co_borrower` 
DROP COLUMN `agent_name`,
DROP COLUMN `agent_id_type`,
DROP COLUMN `agent_id_no`,
DROP COLUMN `agent_id_issue_date`,
DROP COLUMN `agent_id_expire_date`,
DROP COLUMN `agent_id_address`,
DROP COLUMN `agent_face_front_url`,
DROP COLUMN `agent_face_back_url`;


-- 2. 担保人表迁移
-- ============================================

-- 2.1 修改 borrower_type 字段注释，支持 property 类型
ALTER TABLE `t_order_guarantor` 
MODIFY COLUMN `borrower_type` VARCHAR(20) COMMENT '担保人类型：personal-个人，company-对公，property-房产';

-- 2.2 修改对公信息字段注释，支持房产类型
ALTER TABLE `t_order_guarantor` 
MODIFY COLUMN `business_license_url` VARCHAR(500) COMMENT '营业执照/房产证图片URL',
MODIFY COLUMN `company_name` VARCHAR(200) COMMENT '公司名称/房产证号码',
MODIFY COLUMN `company_area` VARCHAR(100) COMMENT '公司注册地/房产地省市区',
MODIFY COLUMN `company_address` VARCHAR(500) COMMENT '公司/房产详细地址';

-- 2.3 修改 agent_mobile 字段注释
ALTER TABLE `t_order_guarantor` 
MODIFY COLUMN `agent_mobile` VARCHAR(20) COMMENT '经办人手机号（对公/房产类型时使用）';

-- 2.4 删除独立的经办人信息字段
ALTER TABLE `t_order_guarantor` 
DROP COLUMN `agent_name`,
DROP COLUMN `agent_id_type`,
DROP COLUMN `agent_id_no`,
DROP COLUMN `agent_id_issue_date`,
DROP COLUMN `agent_id_expire_date`,
DROP COLUMN `agent_id_address`,
DROP COLUMN `agent_face_front_url`,
DROP COLUMN `agent_face_back_url`;


-- ============================================
-- 回滚脚本（如需回滚，请执行以下SQL）
-- ============================================

/*
-- 回滚共借人表
ALTER TABLE `t_order_co_borrower` 
ADD COLUMN `agent_name` VARCHAR(100) COMMENT '经办人姓名' AFTER `agent_mobile`,
ADD COLUMN `agent_id_type` VARCHAR(50) COMMENT '经办人证件类型' AFTER `agent_name`,
ADD COLUMN `agent_id_no` VARCHAR(50) COMMENT '经办人证件号码' AFTER `agent_id_type`,
ADD COLUMN `agent_id_issue_date` DATE COMMENT '经办人证件生效日期' AFTER `agent_id_no`,
ADD COLUMN `agent_id_expire_date` DATE COMMENT '经办人证件有效期' AFTER `agent_id_issue_date`,
ADD COLUMN `agent_id_address` VARCHAR(500) COMMENT '经办人证件地址' AFTER `agent_id_expire_date`,
ADD COLUMN `agent_face_front_url` VARCHAR(500) COMMENT '经办人身份证正面图片URL' AFTER `agent_id_address`,
ADD COLUMN `agent_face_back_url` VARCHAR(500) COMMENT '经办人身份证反面图片URL' AFTER `agent_face_front_url`;

-- 回滚担保人表
ALTER TABLE `t_order_guarantor` 
ADD COLUMN `agent_name` VARCHAR(100) COMMENT '经办人姓名' AFTER `agent_mobile`,
ADD COLUMN `agent_id_type` VARCHAR(50) COMMENT '经办人证件类型' AFTER `agent_name`,
ADD COLUMN `agent_id_no` VARCHAR(50) COMMENT '经办人证件号码' AFTER `agent_id_type`,
ADD COLUMN `agent_id_issue_date` DATE COMMENT '经办人证件生效日期' AFTER `agent_id_no`,
ADD COLUMN `agent_id_expire_date` DATE COMMENT '经办人证件有效期' AFTER `agent_id_issue_date`,
ADD COLUMN `agent_id_address` VARCHAR(500) COMMENT '经办人证件地址' AFTER `agent_id_expire_date`,
ADD COLUMN `agent_face_front_url` VARCHAR(500) COMMENT '经办人身份证正面图片URL' AFTER `agent_id_address`,
ADD COLUMN `agent_face_back_url` VARCHAR(500) COMMENT '经办人身份证反面图片URL' AFTER `agent_face_front_url`;
*/

