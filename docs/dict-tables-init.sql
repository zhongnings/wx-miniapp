-- =============================================
-- 数据字典表结构设计
-- 用于存储小程序中所有下拉列表的选项数据
-- =============================================

-- 1. 创建数据字典分类表
CREATE TABLE IF NOT EXISTS `t_dict_category` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `category_code` VARCHAR(50) NOT NULL COMMENT '分类编码（唯一标识）',
  `category_name` VARCHAR(100) NOT NULL COMMENT '分类名称',
  `description` VARCHAR(255) DEFAULT NULL COMMENT '分类描述',
  `sort_order` INT DEFAULT 0 COMMENT '排序顺序',
  `is_enabled` TINYINT(1) DEFAULT 1 COMMENT '是否启用（1-启用，0-禁用）',
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_category_code` (`category_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='数据字典分类表';

-- 2. 创建数据字典项表
CREATE TABLE IF NOT EXISTS `t_dict_item` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `category_code` VARCHAR(50) NOT NULL COMMENT '分类编码（关联dict_category）',
  `item_code` VARCHAR(50) DEFAULT NULL COMMENT '选项编码（可选）',
  `item_value` VARCHAR(200) NOT NULL COMMENT '选项值（显示给用户的文本）',
  `item_label` VARCHAR(200) DEFAULT NULL COMMENT '选项标签（可选，用于国际化等场景）',
  `sort_order` INT DEFAULT 0 COMMENT '排序顺序',
  `is_enabled` TINYINT(1) DEFAULT 1 COMMENT '是否启用（1-启用，0-禁用）',
  `is_default` TINYINT(1) DEFAULT 0 COMMENT '是否默认选项（1-是，0-否）',
  `remark` VARCHAR(255) DEFAULT NULL COMMENT '备注',
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_category_code` (`category_code`),
  KEY `idx_sort_order` (`sort_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='数据字典项表';

-- =============================================
-- 初始化数据字典分类
-- =============================================

INSERT INTO `t_dict_category` (`category_code`, `category_name`, `description`, `sort_order`) VALUES
('assignee_org', '受让机构', '借款信息-受让机构选项', 1),
('microloan_org', '小贷机构', '借款信息-小贷机构选项', 2),
('payment_channel', '支付渠道', '借款信息-支付渠道选项', 3),
('product_type', '产品类型', '借款信息-产品类型选项', 4),
('loan_purpose', '借款用途', '借款信息-借款用途选项', 5),
('repayment_method', '还款方式', '借款信息-还款方式选项', 6),
('dispute_resolution', '解决争议方式', '借款信息-解决争议方式选项', 7),
('arbitration_org', '仲裁机构', '借款信息-仲裁机构选项', 8),
('notarization_type', '公证类型', '借款信息-公证类型选项', 9),
('notarization_item', '公证事项', '借款信息-公证事项选项', 10),
('borrower_category', '借款人类型', '借款信息-借款人类型选项', 11),
('contract_sign_mode', '合同签署方式', '借款信息-合同签署方式选项', 12),
('is_notarization', '是否办理赋强公证', '借款信息-是否办理赋强公证选项', 13),
('certificate_receive_method', '证书接收方式', '借款信息-证书接收方式选项', 14),
('id_type', '证件类型', '个人信息-证件类型选项', 15),
('gender', '性别', '个人信息-性别选项', 16),
('marital_status', '婚姻状况', '个人信息-婚姻状况选项', 17),
('education', '学历', '个人信息-学历选项', 18),
('occupation', '职业', '个人信息-职业选项', 19),
('industry', '行业', '个人信息-行业选项', 20),
('relationship', '关系', '个人信息-与借款人关系选项', 21);

-- =============================================
-- 初始化数据字典项 - 借款信息相关
-- =============================================

-- 受让机构
INSERT INTO `t_dict_item` (`category_code`, `item_value`, `sort_order`, `is_default`) VALUES
('assignee_org', '广西云桂实业投资有限公司', 1, 1),
('assignee_org', '广西南宁投资有限公司', 2, 0),
('assignee_org', '广西桂林实业有限公司', 3, 0),
('assignee_org', '广西柳州投资集团', 4, 0);

-- 小贷机构
INSERT INTO `dict_item` (`category_code`, `item_value`, `sort_order`, `is_default`) VALUES
('microloan_org', '南宁市益信小额贷款股份有限公司', 1, 1),
('microloan_org', '南宁市金信小额贷款有限公司', 2, 0),
('microloan_org', '南宁市银信小额贷款有限公司', 3, 0),
('microloan_org', '南宁市信合小额贷款有限公司', 4, 0);

-- 支付渠道
INSERT INTO `dict_item` (`category_code`, `item_value`, `sort_order`, `is_default`) VALUES
('payment_channel', '宝付', 1, 1),
('payment_channel', '支付宝', 2, 0),
('payment_channel', '微信支付', 3, 0),
('payment_channel', '银联支付', 4, 0),
('payment_channel', '网银支付', 5, 0);

-- 产品类型
INSERT INTO `dict_item` (`category_code`, `item_value`, `sort_order`, `is_default`) VALUES
('product_type', '信用业务', 1, 1),
('product_type', '抵押业务', 2, 0),
('product_type', '担保业务', 3, 0),
('product_type', '质押业务', 4, 0);

-- 借款用途
INSERT INTO `dict_item` (`category_code`, `item_value`, `sort_order`, `is_default`) VALUES
('loan_purpose', '资金周转', 1, 1),
('loan_purpose', '生产经营', 2, 0),
('loan_purpose', '消费贷款', 3, 0),
('loan_purpose', '购房贷款', 4, 0),
('loan_purpose', '购车贷款', 5, 0),
('loan_purpose', '其他', 6, 0);

-- 还款方式
INSERT INTO `dict_item` (`category_code`, `item_value`, `sort_order`, `is_default`) VALUES
('repayment_method', '等额本息', 1, 1),
('repayment_method', '等额本金', 2, 0),
('repayment_method', '先息后本', 3, 0),
('repayment_method', '一次性还本付息', 4, 0),
('repayment_method', '按月付息到期还本', 5, 0);

-- 解决争议方式
INSERT INTO `dict_item` (`category_code`, `item_value`, `sort_order`, `is_default`) VALUES
('dispute_resolution', '仲裁解决', 1, 1),
('dispute_resolution', '诉讼解决', 2, 0),
('dispute_resolution', '协商解决', 3, 0);

-- 仲裁机构
INSERT INTO `dict_item` (`category_code`, `item_value`, `sort_order`, `is_default`) VALUES
('arbitration_org', '南平国际仲裁院', 1, 1),
('arbitration_org', '北京仲裁委员会', 2, 0),
('arbitration_org', '上海仲裁委员会', 3, 0),
('arbitration_org', '广州仲裁委员会', 4, 0),
('arbitration_org', '深圳仲裁委员会', 5, 0);

-- 公证类型
INSERT INTO `dict_item` (`category_code`, `item_value`, `sort_order`, `is_default`) VALUES
('notarization_type', '赋强公证', 1, 1);

-- 公证事项
INSERT INTO `dict_item` (`category_code`, `item_value`, `sort_order`, `is_default`) VALUES
('notarization_item', '有抵押赋强', 1, 1),
('notarization_item', '无抵押赋强', 2, 0);

-- 借款人类型
INSERT INTO `dict_item` (`category_code`, `item_value`, `sort_order`, `is_default`) VALUES
('borrower_category', '个人', 1, 1),
('borrower_category', '对公', 2, 0);

-- 合同签署方式
INSERT INTO `dict_item` (`category_code`, `item_value`, `sort_order`, `is_default`) VALUES
('contract_sign_mode', '在线签署', 1, 1),
('contract_sign_mode', '线下签署', 2, 0);

-- 是否办理赋强公证
INSERT INTO `dict_item` (`category_code`, `item_value`, `sort_order`, `is_default`) VALUES
('is_notarization', '是', 1, 1),
('is_notarization', '否', 2, 0);

-- 证书接收方式
INSERT INTO `dict_item` (`category_code`, `item_value`, `sort_order`, `is_default`) VALUES
('certificate_receive_method', '电子版', 1, 1),
('certificate_receive_method', '纸质版', 2, 0),
('certificate_receive_method', '电子版+纸质版', 3, 0);

-- =============================================
-- 初始化数据字典项 - 个人信息相关
-- =============================================

-- 证件类型
INSERT INTO `dict_item` (`category_code`, `item_value`, `sort_order`, `is_default`) VALUES
('id_type', '身份证', 1, 1),
('id_type', '护照', 2, 0),
('id_type', '军官证', 3, 0),
('id_type', '港澳通行证', 4, 0),
('id_type', '台湾通行证', 5, 0),
('id_type', '其他证件', 6, 0);

-- 性别
INSERT INTO `dict_item` (`category_code`, `item_value`, `sort_order`, `is_default`) VALUES
('gender', '男', 1, 0),
('gender', '女', 2, 0);

-- 婚姻状况
INSERT INTO `dict_item` (`category_code`, `item_value`, `sort_order`, `is_default`) VALUES
('marital_status', '未婚', 1, 1),
('marital_status', '已婚', 2, 0),
('marital_status', '离异', 3, 0),
('marital_status', '丧偶', 4, 0);

-- 学历
INSERT INTO `dict_item` (`category_code`, `item_value`, `sort_order`, `is_default`) VALUES
('education', '小学', 1, 0),
('education', '初中', 2, 0),
('education', '高中/中专', 3, 0),
('education', '大专', 4, 0),
('education', '本科', 5, 1),
('education', '硕士', 6, 0),
('education', '博士', 7, 0);

-- 职业
INSERT INTO `dict_item` (`category_code`, `item_value`, `sort_order`, `is_default`) VALUES
('occupation', '公务员', 1, 0),
('occupation', '事业单位', 2, 0),
('occupation', '企业职员', 3, 1),
('occupation', '个体工商户', 4, 0),
('occupation', '自由职业', 5, 0),
('occupation', '学生', 6, 0),
('occupation', '退休', 7, 0),
('occupation', '无业', 8, 0),
('occupation', '其他', 9, 0);

-- 行业
INSERT INTO `dict_item` (`category_code`, `item_value`, `sort_order`, `is_default`) VALUES
('industry', '农、林、牧、渔业', 1, 0),
('industry', '采矿业', 2, 0),
('industry', '制造业', 3, 0),
('industry', '建筑业', 4, 0),
('industry', '批发和零售业', 5, 0),
('industry', '交通运输、仓储和邮政业', 6, 0),
('industry', '住宿和餐饮业', 7, 0),
('industry', '信息传输、软件和信息技术服务业', 8, 1),
('industry', '金融业', 9, 0),
('industry', '房地产业', 10, 0),
('industry', '租赁和商务服务业', 11, 0),
('industry', '科学研究和技术服务业', 12, 0),
('industry', '水利、环境和公共设施管理业', 13, 0),
('industry', '居民服务、修理和其他服务业', 14, 0),
('industry', '教育', 15, 0),
('industry', '卫生和社会工作', 16, 0),
('industry', '文化、体育和娱乐业', 17, 0),
('industry', '公共管理、社会保障和社会组织', 18, 0),
('industry', '其他', 19, 0);

-- 关系（与借款人的关系）
INSERT INTO `dict_item` (`category_code`, `item_value`, `sort_order`, `is_default`) VALUES
('relationship', '配偶', 1, 1),
('relationship', '父母', 2, 0),
('relationship', '子女', 3, 0),
('relationship', '兄弟姐妹', 4, 0),
('relationship', '朋友', 5, 0),
('relationship', '同事', 6, 0),
('relationship', '其他亲属', 7, 0),
('relationship', '其他', 8, 0);

-- =============================================
-- 查询示例
-- =============================================

-- 查询所有分类
-- SELECT * FROM t_dict_category WHERE is_enabled = 1 ORDER BY sort_order;

-- 查询指定分类的所有选项
-- SELECT * FROM t_dict_item WHERE category_code = 'marital_status' AND is_enabled = 1 ORDER BY sort_order;

-- 查询指定分类的默认选项
-- SELECT * FROM t_dict_item WHERE category_code = 'borrower_category' AND is_default = 1 AND is_enabled = 1;

-- 查询所有分类及其选项（联表查询）
-- SELECT 
--   c.category_code,
--   c.category_name,
--   i.item_value,
--   i.sort_order,
--   i.is_default
-- FROM t_dict_category c
-- LEFT JOIN t_dict_item i ON c.category_code = i.category_code
-- WHERE c.is_enabled = 1 AND i.is_enabled = 1
-- ORDER BY c.sort_order, i.sort_order;

