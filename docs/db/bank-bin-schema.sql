-- 银行主数据表
CREATE TABLE IF NOT EXISTS t_bank_info (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
    bank_code VARCHAR(32) NOT NULL COMMENT '银行编码，如 ICBC',
    bank_name VARCHAR(64) NOT NULL COMMENT '银行名称',
    logo_path VARCHAR(255) COMMENT 'logo 路径（相对路径）',
    color VARCHAR(16) COMMENT '品牌色',
    is_enabled TINYINT(1) DEFAULT 1 COMMENT '是否启用：1是 0否',
    sort_order INT DEFAULT 0 COMMENT '排序',
    create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    UNIQUE KEY uk_bank_code (bank_code)
) COMMENT='银行主数据';

-- 银行 BIN 映射表
CREATE TABLE IF NOT EXISTS t_bank_bin_mapping (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
    bin_prefix VARCHAR(16) NOT NULL COMMENT 'BIN 前缀（通常6位，也可4/5/7/8）',
    prefix_length INT NOT NULL COMMENT '前缀长度',
    bank_code VARCHAR(32) NOT NULL COMMENT '银行编码（关联 t_bank_info.bank_code）',
    is_enabled TINYINT(1) DEFAULT 1 COMMENT '是否启用：1是 0否',
    create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    UNIQUE KEY uk_bin_prefix (bin_prefix),
    KEY idx_prefix_length (prefix_length),
    KEY idx_bank_code (bank_code)
) COMMENT='银行卡 BIN 映射';

-- 银行基础数据
INSERT INTO t_bank_info (bank_code, bank_name, logo_path, color, sort_order) VALUES
('ICBC', '中国工商银行', '/img/bank/gongshang.png', '#C8161D', 10),
('CCB', '中国建设银行', '/img/bank/jianshe.png', '#0066B3', 20),
('ABC', '中国农业银行', '/img/bank/nongye.png', '#00843D', 30),
('BOC', '中国银行', '/img/bank/zhongguo.png', '#B20838', 40),
('BCM', '交通银行', '/img/bank/jiaotong.png', '#0066B3', 50),
('CMB', '招商银行', '/img/bank/zhaoshang.png', '#E4002B', 60),
('SPDB', '浦发银行', '/img/bank/pufa.png', '#003399', 70),
('CITIC', '中信银行', '/img/bank/zhongxin.png', '#E4002B', 80),
('CEB', '光大银行', '/img/bank/guangda.png', '#6F2C91', 90),
('HXB', '华夏银行', '/img/bank/huaxia.png', '#E4002B', 100),
('CMBC', '民生银行', '/img/bank/minsheng.png', '#006EB6', 110),
('CGB', '广发银行', '/img/bank/guangfa.png', '#E4002B', 120),
('PAB', '平安银行', '/img/bank/pingan.png', '#FF6600', 130),
('CIB', '兴业银行', '/img/bank/xingye.png', '#003399', 140),
('PSBC', '邮储银行', '/img/bank/youchu.png', '#00843D', 150)
ON DUPLICATE KEY UPDATE
    bank_name = VALUES(bank_name),
    logo_path = VALUES(logo_path),
    color = VALUES(color),
    is_enabled = 1;

-- BIN 映射基础集（可执行 docs/db/bank-bin-full-from-frontend.sql 进行全量对齐）
INSERT INTO t_bank_bin_mapping (bin_prefix, prefix_length, bank_code) VALUES
('622200', 6, 'ICBC'), ('622202', 6, 'ICBC'), ('622203', 6, 'ICBC'), ('622208', 6, 'ICBC'),
('622210', 6, 'ICBC'), ('621225', 6, 'ICBC'), ('621226', 6, 'ICBC'), ('621281', 6, 'ICBC'),
('621558', 6, 'ICBC'), ('621559', 6, 'ICBC'), ('621618', 6, 'ICBC'), ('621721', 6, 'ICBC'),

('436742', 6, 'CCB'), ('622280', 6, 'CCB'), ('621080', 6, 'CCB'), ('621081', 6, 'CCB'),
('621467', 6, 'CCB'), ('621598', 6, 'CCB'), ('621621', 6, 'CCB'), ('621700', 6, 'CCB'),
('622966', 6, 'CCB'), ('622988', 6, 'CCB'), ('621284', 6, 'CCB'), ('621488', 6, 'CCB'),

('622841', 6, 'ABC'), ('622824', 6, 'ABC'), ('622826', 6, 'ABC'), ('622848', 6, 'ABC'),
('621282', 6, 'ABC'), ('621336', 6, 'ABC'), ('621619', 6, 'ABC'), ('621622', 6, 'ABC'),
('621674', 6, 'ABC'), ('621720', 6, 'ABC'), ('620501', 6, 'ABC'), ('621068', 6, 'ABC'),

('621660', 6, 'BOC'), ('621661', 6, 'BOC'), ('621662', 6, 'BOC'), ('621663', 6, 'BOC'),
('621665', 6, 'BOC'), ('621667', 6, 'BOC'), ('621668', 6, 'BOC'), ('621669', 6, 'BOC'),
('456351', 6, 'BOC'), ('601382', 6, 'BOC'), ('621256', 6, 'BOC'), ('621283', 6, 'BOC'),

('622260', 6, 'BCM'), ('622261', 6, 'BCM'), ('622262', 6, 'BCM'), ('622263', 6, 'BCM'),
('622264', 6, 'BCM'), ('622265', 6, 'BCM'), ('622266', 6, 'BCM'), ('622267', 6, 'BCM'),
('622268', 6, 'BCM'), ('622269', 6, 'BCM'), ('621002', 6, 'BCM'), ('621069', 6, 'BCM'),

('621286', 6, 'CMB'), ('621483', 6, 'CMB'), ('621485', 6, 'CMB'), ('621486', 6, 'CMB'),
('622580', 6, 'CMB'), ('622588', 6, 'CMB'), ('622598', 6, 'CMB'), ('622609', 6, 'CMB'),
('690755', 6, 'CMB'), ('402658', 6, 'CMB'), ('439188', 6, 'CMB'), ('439227', 6, 'CMB'),

('622516', 6, 'SPDB'), ('622517', 6, 'SPDB'), ('622518', 6, 'SPDB'), ('622519', 6, 'SPDB'),
('984301', 6, 'SPDB'), ('984303', 6, 'SPDB'), ('622521', 6, 'SPDB'), ('621214', 6, 'SPDB'),
('621351', 6, 'SPDB'), ('621793', 6, 'SPDB'),

('622690', 6, 'CITIC'), ('622691', 6, 'CITIC'), ('622692', 6, 'CITIC'), ('622696', 6, 'CITIC'),
('622698', 6, 'CITIC'), ('433670', 6, 'CITIC'), ('433680', 6, 'CITIC'), ('442729', 6, 'CITIC'),
('442730', 6, 'CITIC'), ('620082', 6, 'CITIC'), ('621767', 6, 'CITIC'), ('621768', 6, 'CITIC'),

('622660', 6, 'CEB'), ('622662', 6, 'CEB'), ('622663', 6, 'CEB'), ('622664', 6, 'CEB'),
('622665', 6, 'CEB'), ('622666', 6, 'CEB'), ('622667', 6, 'CEB'), ('622669', 6, 'CEB'),
('622670', 6, 'CEB'), ('622671', 6, 'CEB'), ('622672', 6, 'CEB'), ('622673', 6, 'CEB'),

('622630', 6, 'HXB'), ('622631', 6, 'HXB'), ('622632', 6, 'HXB'), ('622633', 6, 'HXB'),
('621222', 6, 'HXB'), ('621223', 6, 'HXB'), ('621224', 6, 'HXB'),

('622615', 6, 'CMBC'), ('622616', 6, 'CMBC'), ('622617', 6, 'CMBC'), ('622618', 6, 'CMBC'),
('622619', 6, 'CMBC'), ('622620', 6, 'CMBC'), ('622621', 6, 'CMBC'), ('622622', 6, 'CMBC'),
('622623', 6, 'CMBC'), ('415599', 6, 'CMBC'), ('421393', 6, 'CMBC'), ('621691', 6, 'CMBC'),

('622568', 6, 'CGB'), ('622569', 6, 'CGB'), ('622570', 6, 'CGB'), ('621352', 6, 'CGB'),
('621795', 6, 'CGB'), ('621341', 6, 'CGB'), ('621343', 6, 'CGB'), ('621428', 6, 'CGB'),
('621434', 6, 'CGB'), ('621761', 6, 'CGB'), ('621762', 6, 'CGB'),

('622535', 6, 'PAB'), ('622538', 6, 'PAB'), ('622986', 6, 'PAB'), ('622989', 6, 'PAB'),
('621626', 6, 'PAB'), ('623058', 6, 'PAB'), ('621307', 6, 'PAB'), ('621309', 6, 'PAB'),
('622983', 6, 'PAB'), ('622985', 6, 'PAB'), ('622987', 6, 'PAB'),

('622901', 6, 'CIB'), ('622902', 6, 'CIB'), ('622922', 6, 'CIB'), ('438589', 6, 'CIB'),
('451289', 6, 'CIB'), ('527414', 6, 'CIB'), ('528057', 6, 'CIB'), ('622900', 6, 'CIB'),
('621439', 6, 'CIB'), ('486493', 6, 'CIB'), ('486494', 6, 'CIB'), ('451804', 6, 'CIB'),

('622188', 6, 'PSBC'), ('955100', 6, 'PSBC'), ('621095', 6, 'PSBC'), ('620062', 6, 'PSBC'),
('621285', 6, 'PSBC'), ('620529', 6, 'PSBC'), ('621096', 6, 'PSBC'), ('621098', 6, 'PSBC'),
('622150', 6, 'PSBC'), ('622151', 6, 'PSBC'), ('622199', 6, 'PSBC')
ON DUPLICATE KEY UPDATE
    bank_code = VALUES(bank_code),
    prefix_length = VALUES(prefix_length),
    is_enabled = 1;
