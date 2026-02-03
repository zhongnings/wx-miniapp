-- ============================================
-- 行政区划表设计
-- ============================================

-- 1. 行政区划表
CREATE TABLE `t_region` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `code` VARCHAR(12) NOT NULL COMMENT '行政区划代码（6位或12位）',
  `name` VARCHAR(100) NOT NULL COMMENT '区划名称',
  `full_name` VARCHAR(200) DEFAULT NULL COMMENT '全称',
  `pinyin` VARCHAR(200) DEFAULT NULL COMMENT '拼音',
  `pinyin_abbr` VARCHAR(50) DEFAULT NULL COMMENT '拼音首字母缩写',
  `level` TINYINT NOT NULL COMMENT '层级：1-省级，2-市级，3-区县级',
  `parent_code` VARCHAR(12) DEFAULT NULL COMMENT '父级区划代码',
  `sort_order` INT DEFAULT 0 COMMENT '排序',
  `is_enabled` TINYINT DEFAULT 1 COMMENT '是否启用：1-启用，0-禁用',
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_code` (`code`),
  KEY `idx_parent_code` (`parent_code`),
  KEY `idx_level` (`level`),
  KEY `idx_name` (`name`),
  KEY `idx_pinyin_abbr` (`pinyin_abbr`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='行政区划表';

-- 2. 示例数据插入
-- 省级（示例）
INSERT INTO `t_region` (`code`, `name`, `full_name`, `pinyin`, `pinyin_abbr`, `level`, `parent_code`, `sort_order`) VALUES
('110000', '北京', '北京市', 'beijing', 'BJ', 1, NULL, 1),
('120000', '天津', '天津市', 'tianjin', 'TJ', 1, NULL, 2),
('310000', '上海', '上海市', 'shanghai', 'SH', 1, NULL, 3),
('500000', '重庆', '重庆市', 'chongqing', 'CQ', 1, NULL, 4),
('130000', '河北', '河北省', 'hebei', 'HB', 1, NULL, 5),
('450000', '广西', '广西壮族自治区', 'guangxi', 'GX', 1, NULL, 6),
('620000', '甘肃', '甘肃省', 'gansu', 'GS', 1, NULL, 7);

-- 市级（示例）
INSERT INTO `t_region` (`code`, `name`, `full_name`, `pinyin`, `pinyin_abbr`, `level`, `parent_code`, `sort_order`) VALUES
('110100', '北京市', '北京市', 'beijing', 'BJ', 2, '110000', 1),
('450100', '南宁', '南宁市', 'nanning', 'NN', 2, '450000', 1),
('450200', '柳州', '柳州市', 'liuzhou', 'LZ', 2, '450000', 2),
('620100', '兰州', '兰州市', 'lanzhou', 'LZ', 2, '620000', 1);

-- 区县级（示例）
INSERT INTO `t_region` (`code`, `name`, `full_name`, `pinyin`, `pinyin_abbr`, `level`, `parent_code`, `sort_order`) VALUES
('110101', '东城区', '东城区', 'dongcheng', 'DC', 3, '110100', 1),
('110102', '西城区', '西城区', 'xicheng', 'XC', 3, '110100', 2),
('450102', '兴宁区', '兴宁区', 'xingning', 'XN', 3, '450100', 1),
('450103', '青秀区', '青秀区', 'qingxiu', 'QX', 3, '450100', 2),
('620102', '城关区', '城关区', 'chengguan', 'CG', 3, '620100', 1),
('620103', '七里河区', '七里河区', 'qilihe', 'QLH', 3, '620100', 2);

-- ============================================
-- 索引说明
-- ============================================
-- uk_code: 区划代码唯一索引，用于快速查找
-- idx_parent_code: 父级代码索引，用于查询下级区划
-- idx_level: 层级索引，用于按层级查询
-- idx_name: 名称索引，用于模糊搜索
-- idx_pinyin_abbr: 拼音缩写索引，用于首字母搜索

-- ============================================
-- 查询示例
-- ============================================

-- 1. 查询所有省级区划
SELECT * FROM t_region WHERE level = 1 AND is_enabled = 1 ORDER BY sort_order;

-- 2. 查询某省下的所有市
SELECT * FROM t_region WHERE parent_code = '450000' AND is_enabled = 1 ORDER BY sort_order;

-- 3. 查询某市下的所有区县
SELECT * FROM t_region WHERE parent_code = '620100' AND is_enabled = 1 ORDER BY sort_order;

-- 4. 根据名称模糊搜索
SELECT * FROM t_region WHERE name LIKE '%南宁%' AND is_enabled = 1;

-- 5. 根据拼音首字母搜索
SELECT * FROM t_region WHERE pinyin_abbr = 'NN' AND level = 2 AND is_enabled = 1;

-- 6. 查询完整的三级联动数据（省-市-区）
SELECT 
    p.code AS province_code,
    p.name AS province_name,
    c.code AS city_code,
    c.name AS city_name,
    d.code AS district_code,
    d.name AS district_name
FROM t_region p
LEFT JOIN t_region c ON c.parent_code = p.code AND c.level = 2
LEFT JOIN t_region d ON d.parent_code = c.code AND d.level = 3
WHERE p.code = '450000' AND p.is_enabled = 1;

