-- ============================================================
-- 初始化Mock数据（30条质检记录 + 缺陷明细 + 14条预警日志）
-- 与 JsonDataStore.generateMockData() 数据完全一致
-- ============================================================

USE quality_inspection;

-- 清空已有数据
DELETE FROM defect_detail;
DELETE FROM physical_measurement;
DELETE FROM warning_log;
DELETE FROM inspection_record;

ALTER TABLE inspection_record ADD COLUMN IF NOT EXISTS partner_site VARCHAR(50) NULL;
ALTER TABLE inspection_record ADD COLUMN IF NOT EXISTS brand VARCHAR(50) NULL;
ALTER TABLE inspection_record DROP COLUMN IF EXISTS suction;
ALTER TABLE inspection_record DROP COLUMN IF EXISTS weight;
ALTER TABLE inspection_record DROP COLUMN IF EXISTS circumference;

-- ==================== 质检记录 ====================
-- 日期         班次 机台 班组 抽检数 吸阻   重量   圆周   cigA-B-C-D  boxA-B-C-D  cartA-B-C-D caseA-B-C-D  风险

INSERT INTO inspection_record (date,shift,machine_id,team,partner_site,brand,sample_time,sample_ticket_no,    cigarette_a,cigarette_b,cigarette_c,cigarette_d,
    box_small_a,box_small_b,box_small_c,box_small_d,
    carton_a,carton_b,carton_c,carton_d,
    case_aa,case_ab,case_ac,case_ad,risk_level,uploader,upload_time) VALUES
-- 6月11日
('2026-06-11','早班','1#','甲班','山西太原','利群（新版）',NULL,NULL, 0,0,2,3, 0,0,1,2, 0,0,1,1, 0,0,0,1,'平稳','系统导入','2026-06-11 08:30:00'),
('2026-06-11','中班','2#','乙班','广西南宁','利群（长嘴）',NULL,NULL, 0,0,1,2, 0,1,1,1, 0,0,1,0, 0,0,0,0,'平稳','系统导入','2026-06-11 14:00:00'),
('2026-06-11','晚班','3#','丙班','贵州毕节','利群（软红长嘴）',NULL,NULL, 0,0,1,3, 0,0,2,2, 0,0,0,1, 0,0,0,1,'平稳','系统导入','2026-06-11 22:00:00'),
-- 6月12日
('2026-06-12','早班','1#','甲班','河南南阳','利群（新版）',NULL,NULL, 0,0,2,4, 0,0,1,2, 0,0,1,1, 0,0,0,0,'平稳','系统导入','2026-06-12 08:30:00'),
('2026-06-12','中班','2#','乙班','江西井冈山','利群（长嘴）',NULL,NULL, 0,0,1,2, 0,1,1,1, 0,0,0,2, 0,0,0,0,'平稳','系统导入','2026-06-12 14:00:00'),
('2026-06-12','晚班','3#','丙班','重庆涪陵','利群（软红长嘴）',NULL,NULL, 0,0,2,2, 0,0,1,3, 0,0,1,1, 0,0,0,1,'平稳','系统导入','2026-06-12 22:00:00'),
-- 6月13日
('2026-06-13','早班','1#','甲班','重庆黔江','利群（新版）',NULL,NULL, 0,0,3,3, 0,1,2,2, 0,0,2,1, 0,0,0,0,'平稳','系统导入','2026-06-13 08:30:00'),
('2026-06-13','中班','2#','乙班','甘肃兰州','利群（长嘴）',NULL,NULL, 0,1,2,3, 0,0,2,1, 0,0,1,1, 0,0,0,0,'平稳','系统导入','2026-06-13 14:00:00'),
('2026-06-13','晚班','3#','丙班','山西太原','利群（软红长嘴）',NULL,NULL, 1,2,1,2, 0,0,1,1, 0,0,1,1, 0,0,0,0,'高风险','系统导入','2026-06-13 22:00:00'),
-- 6月14日
('2026-06-14','早班','1#','甲班','广西南宁','利群（新版）',NULL,NULL, 0,0,2,2, 0,0,1,1, 0,0,0,1, 0,0,0,0,'平稳','系统导入','2026-06-14 08:30:00'),
('2026-06-14','中班','2#','乙班','贵州毕节','利群（长嘴）',NULL,NULL, 0,0,1,2, 0,0,1,1, 0,0,1,1, 0,0,0,0,'平稳','系统导入','2026-06-14 14:00:00'),
('2026-06-14','晚班','3#','丙班','河南南阳','利群（软红长嘴）',NULL,NULL, 0,1,2,2, 0,0,1,2, 0,0,1,0, 0,0,0,0,'平稳','系统导入','2026-06-14 22:00:00'),
-- 6月15日
('2026-06-15','早班','1#','甲班','江西井冈山','利群（新版）',NULL,NULL, 0,1,2,2, 0,1,1,2, 0,0,0,1, 0,0,0,0,'平稳','系统导入','2026-06-15 08:30:00'),
('2026-06-15','中班','2#','乙班','重庆涪陵','利群（长嘴）',NULL,NULL, 0,2,2,1, 0,1,1,1, 0,0,1,1, 0,0,0,0,'中度风险','系统导入','2026-06-15 14:00:00'),
('2026-06-15','晚班','3#','丙班','重庆黔江','利群（软红长嘴）',NULL,NULL, 0,0,2,2, 0,0,1,2, 0,0,1,1, 0,0,0,0,'平稳','系统导入','2026-06-15 22:00:00'),
-- 6月16日
('2026-06-16','早班','1#','甲班','甘肃兰州','利群（新版）',NULL,NULL, 0,0,3,2, 0,0,2,1, 0,0,1,2, 0,0,0,0,'平稳','系统导入','2026-06-16 08:30:00'),
('2026-06-16','中班','2#','乙班','山西太原','利群（长嘴）',NULL,NULL, 0,1,2,3, 0,1,1,2, 0,0,2,1, 0,0,0,0,'平稳','系统导入','2026-06-16 14:00:00'),
('2026-06-16','晚班','3#','丙班','广西南宁','利群（软红长嘴）',NULL,NULL, 1,1,2,1, 0,1,1,1, 0,0,1,0, 0,0,0,0,'高风险','系统导入','2026-06-16 22:00:00'),
-- 6月17日
('2026-06-17','早班','1#','甲班','贵州毕节','利群（新版）',NULL,NULL, 0,0,4,2, 0,0,3,1, 0,0,1,1, 0,0,0,0,'平稳','系统导入','2026-06-17 08:30:00'),
('2026-06-17','中班','2#','乙班','河南南阳','利群（长嘴）',NULL,NULL, 0,0,5,2, 0,1,4,1, 0,0,2,1, 0,0,0,0,'平稳','系统导入','2026-06-17 14:00:00'),
('2026-06-17','晚班','3#','丙班','江西井冈山','利群（软红长嘴）',NULL,NULL, 0,0,6,2, 0,0,4,2, 0,0,2,1, 0,0,0,0,'平稳','系统导入','2026-06-17 22:00:00'),
-- 6月18日
('2026-06-18','早班','1#','甲班','重庆涪陵','利群（新版）',NULL,NULL, 0,1,7,2, 0,0,5,1, 0,0,3,1, 0,0,0,0,'一般风险','系统导入','2026-06-18 08:30:00'),
('2026-06-18','中班','2#','乙班','重庆黔江','利群（长嘴）',NULL,NULL, 0,2,8,2, 0,1,6,2, 0,0,3,1, 0,0,0,0,'一般风险','系统导入','2026-06-18 14:00:00'),
('2026-06-18','晚班','3#','丙班','甘肃兰州','利群（软红长嘴）',NULL,NULL, 0,0,9,2, 0,0,7,1, 0,0,4,1, 0,0,0,0,'一般风险','系统导入','2026-06-18 22:00:00'),
-- 6月19日
('2026-06-19','早班','1#','甲班','山西太原','利群（新版）',NULL,NULL, 0,1,10,2, 0,1,7,2, 0,0,4,1, 0,0,0,0,'一般风险','系统导入','2026-06-19 08:30:00'),
('2026-06-19','中班','2#','乙班','广西南宁','利群（长嘴）',NULL,NULL, 0,2,11,2, 0,1,8,1, 0,0,5,1, 0,0,0,0,'中度风险','系统导入','2026-06-19 14:00:00'),
('2026-06-19','晚班','3#','丙班','贵州毕节','利群（软红长嘴）',NULL,NULL, 0,0,12,2, 0,0,9,2, 0,0,5,1, 0,0,0,0,'一般风险','系统导入','2026-06-19 22:00:00'),
-- 6月20日
('2026-06-20','早班','1#','甲班','河南南阳','利群（新版）',NULL,NULL, 0,1,13,2, 0,1,9,1, 0,0,6,1, 0,0,0,0,'一般风险','系统导入','2026-06-20 08:30:00'),
('2026-06-20','中班','2#','乙班','江西井冈山','利群（长嘴）',NULL,NULL, 0,3,12,2, 0,2,9,1, 0,1,6,1, 0,0,0,0,'中度风险','系统导入','2026-06-20 14:00:00'),
('2026-06-20','晚班','3#','丙班','重庆涪陵','利群（软红长嘴）',NULL,NULL, 0,0,14,2, 0,0,10,1, 0,0,7,1, 0,0,0,0,'一般风险','系统导入','2026-06-20 22:00:00');

-- ==================== 缺陷明细（按QJ/ZY-GY.02-026-2023标准真实编码） ====================

-- 辅助：根据inspection_record的ABCD数量插入对应缺陷明细
-- 香烟支缺陷明细
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'cigarette', '卷烟搭口', 'JDBKA', '爆口(>=1/4长度)', 'A', cigarette_a FROM inspection_record WHERE cigarette_a > 0;
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'cigarette', '卷烟端面', 'JKKTB', '空头(深>=5mm且>=2/3截面)', 'B', cigarette_b FROM inspection_record WHERE cigarette_b > 0;
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'cigarette', '卷烟端面', 'JACTC', '触头(挤压>=1/3圆周深>=2mm)', 'C', cigarette_c FROM inspection_record WHERE cigarette_c > 0;
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'cigarette', '卷烟端面', 'JATSD', '吐丝(2-4mm有1条)', 'D', cigarette_d FROM inspection_record WHERE cigarette_d > 0;

-- 盒装缺陷明细
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'boxSmall', '透明纸', 'HTCQA', '透明纸残缺(>=100mm²)', 'A', box_small_a FROM inspection_record WHERE box_small_a > 0;
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'boxSmall', '拉线', 'HLDZB', '拉线倒置', 'B', box_small_b FROM inspection_record WHERE box_small_b > 0;
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'boxSmall', '拉线', 'HLDKC', '拉线搭口错位(>=1mm)', 'C', box_small_c FROM inspection_record WHERE box_small_c > 0;
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'boxSmall', '小盒杂项', 'HAWLD', '小盒外部粘连(可分离)', 'D', box_small_d FROM inspection_record WHERE box_small_d > 0;

-- 条装缺陷明细
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'carton', '条盒杂项', 'TBQBA', '条盒缺包', 'A', carton_a FROM inspection_record WHERE carton_a > 0;
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'carton', '透明纸', 'TTWWB', '透明纸无', 'B', carton_b FROM inspection_record WHERE carton_b > 0;
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'carton', '条盒杂项', 'TAZZC', '条盒轧皱(>=30mm)', 'C', carton_c FROM inspection_record WHERE carton_c > 0;
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'carton', '条盒杂项', 'TAZZD', '条盒轧皱(20-30mm)', 'D', carton_d FROM inspection_record WHERE carton_d > 0;

-- 箱装缺陷明细
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'case', '纸箱杂项', 'XTCPA', '纸箱大条错装混装', 'A', case_aa FROM inspection_record WHERE case_aa > 0;
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'case', '纸箱杂项', 'XTCPB', '纸箱大条错装混装(警图1组)', 'B', case_ab FROM inspection_record WHERE case_ab > 0;
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'case', '纸箱杂项', 'XXWNC', '纸箱未粘牢', 'C', case_ac FROM inspection_record WHERE case_ac > 0;
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'case', '纸箱', 'XXPSD', '纸箱破残(<20cm)', 'D', case_ad FROM inspection_record WHERE case_ad > 0;

-- ====== 箱装外观缺陷明细（按日期×班次×部位×缺陷补充丰富数据） ======
-- 使用子查询自动匹配 inspection_record.id

-- 【6月11日】3个班次 (id 1-3)
-- 纸箱杂项
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'case', '纸箱杂项', 'XAJZC', '箱装夹杂', 'C', 2 FROM inspection_record WHERE date='2026-06-11' AND shift='早班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'case', '纸箱杂项', 'XXNNC', '纸箱内部粘牢', 'C', 1 FROM inspection_record WHERE date='2026-06-11' AND shift='中班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'case', '纸箱杂项', 'XFJZC', '纸箱来料夹杂', 'C', 3 FROM inspection_record WHERE date='2026-06-11' AND shift='晚班';
-- 纸箱
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'case', '纸箱', 'XXWZC', '纸箱污(C区)', 'C', 2 FROM inspection_record WHERE date='2026-06-11' AND shift='早班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'case', '纸箱', 'XXZJC', '纸箱箱盖摺角', 'C', 1 FROM inspection_record WHERE date='2026-06-11' AND shift='晚班';
-- 胶带
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'case', '胶带', 'XJNJD', '纸箱胶带粘结异常', 'D', 2 FROM inspection_record WHERE date='2026-06-11' AND shift='中班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'case', '胶带', 'XJLDD', '纸箱漏底(断开)', 'D', 1 FROM inspection_record WHERE date='2026-06-11' AND shift='晚班';
-- 追溯标识
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'case', '追溯标识', 'XMBWC', '标识无', 'C', 1 FROM inspection_record WHERE date='2026-06-11' AND shift='早班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'case', '追溯标识', 'XMBCC', '标识错误', 'C', 1 FROM inspection_record WHERE date='2026-06-11' AND shift='晚班';

-- 【6月12日】3个班次 (id 4-6)
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'case', '纸箱杂项', 'XXWNC', '纸箱未粘牢', 'C', 2 FROM inspection_record WHERE date='2026-06-12' AND shift='早班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'case', '纸箱杂项', 'XAJZC', '箱装夹杂', 'C', 1 FROM inspection_record WHERE date='2026-06-12' AND shift='晚班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'case', '纸箱', 'XXSSC', '纸箱损伤(致C类)', 'C', 1 FROM inspection_record WHERE date='2026-06-12' AND shift='早班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'case', '纸箱', 'XXWZD', '纸箱污(D区)', 'D', 2 FROM inspection_record WHERE date='2026-06-12' AND shift='中班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'case', '胶带', 'XJLDC', '纸箱漏底(无胶带)', 'C', 1 FROM inspection_record WHERE date='2026-06-12' AND shift='早班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'case', '胶带', 'XJCYD', '纸箱胶带错用', 'D', 1 FROM inspection_record WHERE date='2026-06-12' AND shift='晚班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'case', '追溯标识', 'XMGCB', '条件关联错误', 'B', 1 FROM inspection_record WHERE date='2026-06-12' AND shift='中班';

-- 【6月13日】3个班次 (id 7-9)
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'case', '纸箱杂项', 'XTQDA', '纸箱缺条多条', 'A', 1 FROM inspection_record WHERE date='2026-06-13' AND shift='早班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'case', '纸箱杂项', 'XAJZC', '箱装夹杂', 'C', 2 FROM inspection_record WHERE date='2026-06-13' AND shift='中班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'case', '纸箱杂项', 'XXNNC', '纸箱内部粘牢', 'C', 1 FROM inspection_record WHERE date='2026-06-13' AND shift='晚班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'case', '纸箱', 'XXZJC', '纸箱箱盖摺角', 'C', 2 FROM inspection_record WHERE date='2026-06-13' AND shift='早班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'case', '纸箱', 'XXWZC', '纸箱污(C区)', 'C', 3 FROM inspection_record WHERE date='2026-06-13' AND shift='中班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'case', '纸箱', 'XXSSD', '纸箱损伤(致D类)', 'D', 1 FROM inspection_record WHERE date='2026-06-13' AND shift='晚班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'case', '胶带', 'XJNJD', '纸箱胶带粘结异常', 'D', 3 FROM inspection_record WHERE date='2026-06-13' AND shift='早班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'case', '胶带', 'XJLDD', '纸箱漏底(断开)', 'D', 1 FROM inspection_record WHERE date='2026-06-13' AND shift='晚班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'case', '追溯标识', 'XMGCB', '条件关联错误', 'B', 1 FROM inspection_record WHERE date='2026-06-13' AND shift='早班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'case', '追溯标识', 'XMBCC', '标识错误', 'C', 2 FROM inspection_record WHERE date='2026-06-13' AND shift='中班';

-- 【6月14日】3个班次 (id 10-12)
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'case', '纸箱杂项', 'XXWNC', '纸箱未粘牢', 'C', 3 FROM inspection_record WHERE date='2026-06-14' AND shift='早班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'case', '纸箱杂项', 'XFJZC', '纸箱来料夹杂', 'C', 1 FROM inspection_record WHERE date='2026-06-14' AND shift='晚班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'case', '纸箱', 'XXPSC', '纸箱破残(>=20cm)', 'C', 2 FROM inspection_record WHERE date='2026-06-14' AND shift='早班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'case', '纸箱', 'XXWZC', '纸箱污(C区)', 'C', 1 FROM inspection_record WHERE date='2026-06-14' AND shift='中班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'case', '纸箱', 'XXPSD', '纸箱破残(<20cm)', 'D', 3 FROM inspection_record WHERE date='2026-06-14' AND shift='晚班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'case', '胶带', 'XJLDC', '纸箱漏底(无胶带)', 'C', 1 FROM inspection_record WHERE date='2026-06-14' AND shift='中班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'case', '追溯标识', 'XMBWC', '标识无', 'C', 2 FROM inspection_record WHERE date='2026-06-14' AND shift='早班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'case', '追溯标识', 'XMBCC', '标识错误', 'C', 1 FROM inspection_record WHERE date='2026-06-14' AND shift='晚班';

-- 【6月15日】3个班次 (id 13-15)
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'case', '纸箱杂项', 'XAJZC', '箱装夹杂', 'C', 1 FROM inspection_record WHERE date='2026-06-15' AND shift='早班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'case', '纸箱杂项', 'XXNNC', '纸箱内部粘牢', 'C', 2 FROM inspection_record WHERE date='2026-06-15' AND shift='中班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'case', '纸箱杂项', 'XTCPC', '纸箱大条错装混装(警图>1组)', 'C', 1 FROM inspection_record WHERE date='2026-06-15' AND shift='晚班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'case', '纸箱', 'XXSSC', '纸箱损伤(致C类)', 'C', 1 FROM inspection_record WHERE date='2026-06-15' AND shift='早班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'case', '纸箱', 'XXWZC', '纸箱污(C区)', 'C', 2 FROM inspection_record WHERE date='2026-06-15' AND shift='中班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'case', '纸箱', 'XXZJC', '纸箱箱盖摺角', 'C', 3 FROM inspection_record WHERE date='2026-06-15' AND shift='晚班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'case', '胶带', 'XJLDC', '纸箱漏底(无胶带)', 'C', 1 FROM inspection_record WHERE date='2026-06-15' AND shift='早班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'case', '胶带', 'XJNJD', '纸箱胶带粘结异常', 'D', 2 FROM inspection_record WHERE date='2026-06-15' AND shift='晚班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'case', '追溯标识', 'XMBWC', '标识无', 'C', 1 FROM inspection_record WHERE date='2026-06-15' AND shift='中班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'case', '追溯标识', 'XMGCB', '条件关联错误', 'B', 1 FROM inspection_record WHERE date='2026-06-15' AND shift='晚班';

-- 【6月16日】3个班次 (id 16-18)
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'case', '纸箱杂项', 'XFJZC', '纸箱来料夹杂', 'C', 2 FROM inspection_record WHERE date='2026-06-16' AND shift='早班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'case', '纸箱杂项', 'XXWNC', '纸箱未粘牢', 'C', 1 FROM inspection_record WHERE date='2026-06-16' AND shift='晚班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'case', '纸箱', 'XXPSD', '纸箱破残(<20cm)', 'D', 4 FROM inspection_record WHERE date='2026-06-16' AND shift='早班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'case', '纸箱', 'XXPSC', '纸箱破残(>=20cm)', 'C', 1 FROM inspection_record WHERE date='2026-06-16' AND shift='中班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'case', '纸箱', 'XXWZC', '纸箱污(C区)', 'C', 2 FROM inspection_record WHERE date='2026-06-16' AND shift='晚班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'case', '胶带', 'XJNJD', '纸箱胶带粘结异常', 'D', 1 FROM inspection_record WHERE date='2026-06-16' AND shift='中班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'case', '胶带', 'XJLDD', '纸箱漏底(断开)', 'D', 2 FROM inspection_record WHERE date='2026-06-16' AND shift='晚班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'case', '追溯标识', 'XMBCC', '标识错误', 'C', 1 FROM inspection_record WHERE date='2026-06-16' AND shift='早班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'case', '追溯标识', 'XMBWC', '标识无', 'C', 1 FROM inspection_record WHERE date='2026-06-16' AND shift='中班';

-- 【6月17日】3个班次 (id 19-21)
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'case', '纸箱杂项', 'XAJZC', '箱装夹杂', 'C', 3 FROM inspection_record WHERE date='2026-06-17' AND shift='早班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'case', '纸箱杂项', 'XXNNC', '纸箱内部粘牢', 'C', 2 FROM inspection_record WHERE date='2026-06-17' AND shift='中班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'case', '纸箱杂项', 'XTCPC', '纸箱大条错装混装(警图>1组)', 'C', 1 FROM inspection_record WHERE date='2026-06-17' AND shift='晚班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'case', '纸箱', 'XXZJC', '纸箱箱盖摺角', 'C', 2 FROM inspection_record WHERE date='2026-06-17' AND shift='早班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'case', '纸箱', 'XXWZC', '纸箱污(C区)', 'C', 4 FROM inspection_record WHERE date='2026-06-17' AND shift='中班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'case', '纸箱', 'XXSSC', '纸箱损伤(致C类)', 'C', 2 FROM inspection_record WHERE date='2026-06-17' AND shift='晚班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'case', '胶带', 'XJCYD', '纸箱胶带错用', 'D', 2 FROM inspection_record WHERE date='2026-06-17' AND shift='早班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'case', '胶带', 'XJLDC', '纸箱漏底(无胶带)', 'C', 1 FROM inspection_record WHERE date='2026-06-17' AND shift='晚班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'case', '追溯标识', 'XMBWC', '标识无', 'C', 2 FROM inspection_record WHERE date='2026-06-17' AND shift='早班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'case', '追溯标识', 'XMBCC', '标识错误', 'C', 3 FROM inspection_record WHERE date='2026-06-17' AND shift='中班';

-- 【6月18日】3个班次 (id 22-24)
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'case', '纸箱杂项', 'XXWNC', '纸箱未粘牢', 'C', 1 FROM inspection_record WHERE date='2026-06-18' AND shift='早班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'case', '纸箱杂项', 'XFJZC', '纸箱来料夹杂', 'C', 2 FROM inspection_record WHERE date='2026-06-18' AND shift='中班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'case', '纸箱杂项', 'XAJZC', '箱装夹杂', 'C', 1 FROM inspection_record WHERE date='2026-06-18' AND shift='晚班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'case', '纸箱', 'XXWZC', '纸箱污(C区)', 'C', 2 FROM inspection_record WHERE date='2026-06-18' AND shift='早班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'case', '纸箱', 'XXPSD', '纸箱破残(<20cm)', 'D', 3 FROM inspection_record WHERE date='2026-06-18' AND shift='中班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'case', '纸箱', 'XXPSC', '纸箱破残(>=20cm)', 'C', 2 FROM inspection_record WHERE date='2026-06-18' AND shift='晚班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'case', '胶带', 'XJLDC', '纸箱漏底(无胶带)', 'C', 1 FROM inspection_record WHERE date='2026-06-18' AND shift='早班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'case', '胶带', 'XJNJD', '纸箱胶带粘结异常', 'D', 3 FROM inspection_record WHERE date='2026-06-18' AND shift='晚班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'case', '追溯标识', 'XMBWC', '标识无', 'C', 2 FROM inspection_record WHERE date='2026-06-18' AND shift='早班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'case', '追溯标识', 'XMBCC', '标识错误', 'C', 1 FROM inspection_record WHERE date='2026-06-18' AND shift='中班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'case', '追溯标识', 'XMGCB', '条件关联错误', 'B', 1 FROM inspection_record WHERE date='2026-06-18' AND shift='晚班';

-- 【6月19日】3个班次 (id 25-27)
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'case', '纸箱杂项', 'XAJZC', '箱装夹杂', 'C', 2 FROM inspection_record WHERE date='2026-06-19' AND shift='早班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'case', '纸箱杂项', 'XXNNC', '纸箱内部粘牢', 'C', 1 FROM inspection_record WHERE date='2026-06-19' AND shift='中班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'case', '纸箱', 'XXZJC', '纸箱箱盖摺角', 'C', 1 FROM inspection_record WHERE date='2026-06-19' AND shift='早班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'case', '纸箱', 'XXWZC', '纸箱污(C区)', 'C', 3 FROM inspection_record WHERE date='2026-06-19' AND shift='中班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'case', '纸箱', 'XXSSC', '纸箱损伤(致C类)', 'C', 1 FROM inspection_record WHERE date='2026-06-19' AND shift='晚班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'case', '胶带', 'XJLDD', '纸箱漏底(断开)', 'D', 2 FROM inspection_record WHERE date='2026-06-19' AND shift='早班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'case', '胶带', 'XJNJD', '纸箱胶带粘结异常', 'D', 1 FROM inspection_record WHERE date='2026-06-19' AND shift='晚班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'case', '追溯标识', 'XMBCC', '标识错误', 'C', 2 FROM inspection_record WHERE date='2026-06-19' AND shift='早班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'case', '追溯标识', 'XMGCB', '条件关联错误', 'B', 1 FROM inspection_record WHERE date='2026-06-19' AND shift='中班';

-- 【6月20日】3个班次 (id 28-30)
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'case', '纸箱杂项', 'XXWNC', '纸箱未粘牢', 'C', 2 FROM inspection_record WHERE date='2026-06-20' AND shift='早班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'case', '纸箱杂项', 'XFJZC', '纸箱来料夹杂', 'C', 1 FROM inspection_record WHERE date='2026-06-20' AND shift='晚班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'case', '纸箱', 'XXWZC', '纸箱污(C区)', 'C', 2 FROM inspection_record WHERE date='2026-06-20' AND shift='早班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'case', '纸箱', 'XXPSD', '纸箱破残(<20cm)', 'D', 1 FROM inspection_record WHERE date='2026-06-20' AND shift='中班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'case', '纸箱', 'XXZJC', '纸箱箱盖摺角', 'C', 2 FROM inspection_record WHERE date='2026-06-20' AND shift='晚班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'case', '胶带', 'XJNJD', '纸箱胶带粘结异常', 'D', 1 FROM inspection_record WHERE date='2026-06-20' AND shift='早班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'case', '胶带', 'XJLDC', '纸箱漏底(无胶带)', 'C', 1 FROM inspection_record WHERE date='2026-06-20' AND shift='中班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'case', '追溯标识', 'XMBWC', '标识无', 'C', 1 FROM inspection_record WHERE date='2026-06-20' AND shift='早班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'case', '追溯标识', 'XMBCC', '标识错误', 'C', 2 FROM inspection_record WHERE date='2026-06-20' AND shift='晚班';

-- ====== 条装外观缺陷明细（按日期×班次×部位×缺陷补充丰富数据） ======

-- 【6月11日】
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'carton', '条盒杂项', 'TAZZC', '条盒轧皱(≥30mm)', 'C', 2 FROM inspection_record WHERE date='2026-06-11' AND shift='早班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'carton', '条盒杂项', 'TAZZD', '条盒轧皱(20-30mm)', 'D', 1 FROM inspection_record WHERE date='2026-06-11' AND shift='晚班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'carton', '条盒杂项', 'TAZPB', '条盒轧破(≥30mm)', 'B', 1 FROM inspection_record WHERE date='2026-06-11' AND shift='中班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'carton', '拉线', 'TLCQC', '拉线残缺(≥10mm)', 'C', 1 FROM inspection_record WHERE date='2026-06-11' AND shift='早班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'carton', '拉线', 'TLDZC', '拉线倒置', 'C', 2 FROM inspection_record WHERE date='2026-06-11' AND shift='中班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'carton', '拉线', 'TLGDD', '拉线高低', 'D', 1 FROM inspection_record WHERE date='2026-06-11' AND shift='晚班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'carton', '透明纸', 'TTZZC', '透明纸皱(C区)', 'C', 2 FROM inspection_record WHERE date='2026-06-11' AND shift='早班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'carton', '透明纸', 'TTZPC', '透明纸破(<10mm)', 'C', 1 FROM inspection_record WHERE date='2026-06-11' AND shift='中班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'carton', '条盒纸', 'THZZC', '条盒纸皱(≥15mm)', 'C', 1 FROM inspection_record WHERE date='2026-06-11' AND shift='早班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'carton', '条盒纸', 'THWZC', '条盒纸污(≥5mm≥1处)', 'C', 1 FROM inspection_record WHERE date='2026-06-11' AND shift='晚班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'carton', '钢印', 'TGWWC', '钢印错无', 'C', 1 FROM inspection_record WHERE date='2026-06-11' AND shift='中班';

-- 【6月12日】
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'carton', '条盒杂项', 'THNNC', '条盒内部粘连', 'C', 1 FROM inspection_record WHERE date='2026-06-12' AND shift='早班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'carton', '条盒杂项', 'TAWZC', '条盒外夹杂(C区)', 'C', 2 FROM inspection_record WHERE date='2026-06-12' AND shift='中班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'carton', '条盒杂项', 'TAZZD', '条盒轧皱(20-30mm)', 'D', 1 FROM inspection_record WHERE date='2026-06-12' AND shift='晚班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'carton', '拉线', 'TLCYC', '拉线错用', 'C', 1 FROM inspection_record WHERE date='2026-06-12' AND shift='早班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'carton', '拉线', 'TLCQC', '拉线残缺(≥10mm)', 'C', 2 FROM inspection_record WHERE date='2026-06-12' AND shift='晚班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'carton', '透明纸', 'TTSJC', '透明纸松紧(余≥4mm/凹≥2mm)', 'C', 1 FROM inspection_record WHERE date='2026-06-12' AND shift='早班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'carton', '透明纸', 'TTZJC', '透明纸折角(≥10mm≥2个)', 'C', 1 FROM inspection_record WHERE date='2026-06-12' AND shift='晚班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'carton', '条盒纸', 'THCSC', '条盒纸擦伤(≥6mm)', 'C', 1 FROM inspection_record WHERE date='2026-06-12' AND shift='中班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'carton', '钢印', 'TGQHD', '钢印缺或糊', 'D', 1 FROM inspection_record WHERE date='2026-06-12' AND shift='晚班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'carton', '钢印', 'TGKPC', '钢印刻破(无法辨识)', 'C', 1 FROM inspection_record WHERE date='2026-06-12' AND shift='早班';

-- 【6月13日】
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'carton', '条盒杂项', 'TAZZC', '条盒轧皱(≥30mm)', 'C', 3 FROM inspection_record WHERE date='2026-06-13' AND shift='早班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'carton', '条盒杂项', 'TAZPC', '条盒轧破(<30mm)', 'C', 1 FROM inspection_record WHERE date='2026-06-13' AND shift='中班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'carton', '条盒杂项', 'THNNC', '条盒内部粘连', 'C', 2 FROM inspection_record WHERE date='2026-06-13' AND shift='晚班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'carton', '拉线', 'TLDZC', '拉线倒置', 'C', 1 FROM inspection_record WHERE date='2026-06-13' AND shift='早班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'carton', '拉线', 'TLDKC', '拉线搭口错位(≥2mm)', 'C', 1 FROM inspection_record WHERE date='2026-06-13' AND shift='晚班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'carton', '透明纸', 'TTZZC', '透明纸皱(C区)', 'C', 3 FROM inspection_record WHERE date='2026-06-13' AND shift='中班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'carton', '透明纸', 'TTSJC', '透明纸松紧(余≥4mm/凹≥2mm)', 'C', 2 FROM inspection_record WHERE date='2026-06-13' AND shift='晚班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'carton', '条盒纸', 'THZZC', '条盒纸皱(≥15mm)', 'C', 2 FROM inspection_record WHERE date='2026-06-13' AND shift='早班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'carton', '条盒纸', 'THBKC', '条盒纸粘接不牢(爆开)', 'C', 1 FROM inspection_record WHERE date='2026-06-13' AND shift='中班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'carton', '钢印', 'TGKPC', '钢印刻破(无法辨识)', 'C', 1 FROM inspection_record WHERE date='2026-06-13' AND shift='晚班';

-- 【6月14日】
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'carton', '条盒杂项', 'TAZZD', '条盒轧皱(20-30mm)', 'D', 2 FROM inspection_record WHERE date='2026-06-14' AND shift='早班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'carton', '条盒杂项', 'TAWZC', '条盒外夹杂(C区)', 'C', 1 FROM inspection_record WHERE date='2026-06-14' AND shift='晚班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'carton', '拉线', 'TLCQC', '拉线残缺(≥10mm)', 'C', 3 FROM inspection_record WHERE date='2026-06-14' AND shift='中班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'carton', '拉线', 'TLGDD', '拉线高低', 'D', 2 FROM inspection_record WHERE date='2026-06-14' AND shift='晚班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'carton', '透明纸', 'TTZPC', '透明纸破(<10mm)', 'C', 2 FROM inspection_record WHERE date='2026-06-14' AND shift='早班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'carton', '透明纸', 'TTZJC', '透明纸折角(≥10mm≥2个)', 'C', 1 FROM inspection_record WHERE date='2026-06-14' AND shift='中班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'carton', '条盒纸', 'THWZC', '条盒纸污(≥5mm≥1处)', 'C', 2 FROM inspection_record WHERE date='2026-06-14' AND shift='早班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'carton', '条盒纸', 'THDYC', '条盒纸多(>1张)', 'C', 1 FROM inspection_record WHERE date='2026-06-14' AND shift='中班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'carton', '钢印', 'TGWWC', '钢印错无', 'C', 1 FROM inspection_record WHERE date='2026-06-14' AND shift='晚班';

-- 【6月15日】
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'carton', '条盒杂项', 'TAZZC', '条盒轧皱(≥30mm)', 'C', 1 FROM inspection_record WHERE date='2026-06-15' AND shift='早班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'carton', '条盒杂项', 'TAWZD', '条盒外夹杂(D区)', 'D', 1 FROM inspection_record WHERE date='2026-06-15' AND shift='中班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'carton', '条盒杂项', 'TBCPC', '条盒小包错装混装(警图>1组)', 'C', 1 FROM inspection_record WHERE date='2026-06-15' AND shift='晚班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'carton', '拉线', 'TLDZC', '拉线倒置', 'C', 1 FROM inspection_record WHERE date='2026-06-15' AND shift='早班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'carton', '拉线', 'TLCYC', '拉线错用', 'C', 2 FROM inspection_record WHERE date='2026-06-15' AND shift='中班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'carton', '透明纸', 'TTZZC', '透明纸皱(C区)', 'C', 2 FROM inspection_record WHERE date='2026-06-15' AND shift='早班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'carton', '透明纸', 'TTSJC', '透明纸松紧(余≥4mm/凹≥2mm)', 'C', 1 FROM inspection_record WHERE date='2026-06-15' AND shift='晚班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'carton', '条盒纸', 'THCSC', '条盒纸擦伤(≥6mm)', 'C', 1 FROM inspection_record WHERE date='2026-06-15' AND shift='早班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'carton', '条盒纸', 'THQZC', '条盒纸翘折(≥5mm)', 'C', 1 FROM inspection_record WHERE date='2026-06-15' AND shift='晚班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'carton', '钢印', 'TGQHD', '钢印缺或糊', 'D', 2 FROM inspection_record WHERE date='2026-06-15' AND shift='中班';

-- 【6月16日】
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'carton', '条盒杂项', 'TAZPC', '条盒轧破(<30mm)', 'C', 2 FROM inspection_record WHERE date='2026-06-16' AND shift='早班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'carton', '条盒杂项', 'TAZZD', '条盒轧皱(20-30mm)', 'D', 3 FROM inspection_record WHERE date='2026-06-16' AND shift='中班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'carton', '条盒杂项', 'TANZC', '条盒内夹杂(C区)', 'C', 1 FROM inspection_record WHERE date='2026-06-16' AND shift='晚班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'carton', '拉线', 'TLCQC', '拉线残缺(≥10mm)', 'C', 2 FROM inspection_record WHERE date='2026-06-16' AND shift='早班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'carton', '拉线', 'TLDZC', '拉线倒置', 'C', 1 FROM inspection_record WHERE date='2026-06-16' AND shift='晚班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'carton', '透明纸', 'TTZPC', '透明纸破(<10mm)', 'C', 3 FROM inspection_record WHERE date='2026-06-16' AND shift='中班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'carton', '透明纸', 'TTZJC', '透明纸折角(≥10mm≥2个)', 'C', 1 FROM inspection_record WHERE date='2026-06-16' AND shift='晚班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'carton', '条盒纸', 'THZZC', '条盒纸皱(≥15mm)', 'C', 2 FROM inspection_record WHERE date='2026-06-16' AND shift='早班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'carton', '条盒纸', 'THZDC', '条盒纸折叠不到位(≥1mm)', 'C', 1 FROM inspection_record WHERE date='2026-06-16' AND shift='中班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'carton', '钢印', 'TGKPD', '钢印刻破(可辨识)', 'D', 1 FROM inspection_record WHERE date='2026-06-16' AND shift='晚班';

-- 【6月17日】
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'carton', '条盒杂项', 'TAZZC', '条盒轧皱(≥30mm)', 'C', 4 FROM inspection_record WHERE date='2026-06-17' AND shift='早班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'carton', '条盒杂项', 'TAWZC', '条盒外夹杂(C区)', 'C', 2 FROM inspection_record WHERE date='2026-06-17' AND shift='中班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'carton', '条盒杂项', 'THNNC', '条盒内部粘连', 'C', 1 FROM inspection_record WHERE date='2026-06-17' AND shift='晚班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'carton', '拉线', 'TLDKC', '拉线搭口错位(≥2mm)', 'C', 2 FROM inspection_record WHERE date='2026-06-17' AND shift='早班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'carton', '拉线', 'TLGDD', '拉线高低', 'D', 1 FROM inspection_record WHERE date='2026-06-17' AND shift='晚班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'carton', '透明纸', 'TTZZC', '透明纸皱(C区)', 'C', 3 FROM inspection_record WHERE date='2026-06-17' AND shift='早班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'carton', '透明纸', 'TTZJC', '透明纸折角(≥10mm≥2个)', 'C', 2 FROM inspection_record WHERE date='2026-06-17' AND shift='中班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'carton', '条盒纸', 'THWZC', '条盒纸污(≥5mm≥1处)', 'C', 3 FROM inspection_record WHERE date='2026-06-17' AND shift='早班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'carton', '条盒纸', 'THBKC', '条盒纸粘接不牢(爆开)', 'C', 2 FROM inspection_record WHERE date='2026-06-17' AND shift='中班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'carton', '钢印', 'TGWWC', '钢印错无', 'C', 1 FROM inspection_record WHERE date='2026-06-17' AND shift='早班';

-- 【6月18日】
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'carton', '条盒杂项', 'TAZZD', '条盒轧皱(20-30mm)', 'D', 2 FROM inspection_record WHERE date='2026-06-18' AND shift='早班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'carton', '条盒杂项', 'TAZZC', '条盒轧皱(≥30mm)', 'C', 1 FROM inspection_record WHERE date='2026-06-18' AND shift='中班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'carton', '条盒杂项', 'TBCPC', '条盒小包错装混装(警图>1组)', 'C', 1 FROM inspection_record WHERE date='2026-06-18' AND shift='晚班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'carton', '拉线', 'TLCQC', '拉线残缺(≥10mm)', 'C', 1 FROM inspection_record WHERE date='2026-06-18' AND shift='早班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'carton', '拉线', 'TLCYC', '拉线错用', 'C', 1 FROM inspection_record WHERE date='2026-06-18' AND shift='晚班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'carton', '透明纸', 'TTSJC', '透明纸松紧(余≥4mm/凹≥2mm)', 'C', 2 FROM inspection_record WHERE date='2026-06-18' AND shift='早班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'carton', '透明纸', 'TTZPC', '透明纸破(<10mm)', 'C', 3 FROM inspection_record WHERE date='2026-06-18' AND shift='中班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'carton', '条盒纸', 'THCSC', '条盒纸擦伤(≥6mm)', 'C', 2 FROM inspection_record WHERE date='2026-06-18' AND shift='早班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'carton', '条盒纸', 'THZDC', '条盒纸折叠不到位(≥1mm)', 'C', 1 FROM inspection_record WHERE date='2026-06-18' AND shift='晚班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'carton', '钢印', 'TGKPC', '钢印刻破(无法辨识)', 'C', 1 FROM inspection_record WHERE date='2026-06-18' AND shift='中班';

-- 【6月19日】
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'carton', '条盒杂项', 'TAWZC', '条盒外夹杂(C区)', 'C', 3 FROM inspection_record WHERE date='2026-06-19' AND shift='早班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'carton', '条盒杂项', 'TAZZC', '条盒轧皱(≥30mm)', 'C', 2 FROM inspection_record WHERE date='2026-06-19' AND shift='中班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'carton', '拉线', 'TLDZC', '拉线倒置', 'C', 2 FROM inspection_record WHERE date='2026-06-19' AND shift='早班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'carton', '拉线', 'TLGDD', '拉线高低', 'D', 1 FROM inspection_record WHERE date='2026-06-19' AND shift='晚班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'carton', '透明纸', 'TTZZC', '透明纸皱(C区)', 'C', 1 FROM inspection_record WHERE date='2026-06-19' AND shift='中班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'carton', '透明纸', 'TTZJC', '透明纸折角(≥10mm≥2个)', 'C', 2 FROM inspection_record WHERE date='2026-06-19' AND shift='晚班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'carton', '条盒纸', 'THZZC', '条盒纸皱(≥15mm)', 'C', 1 FROM inspection_record WHERE date='2026-06-19' AND shift='早班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'carton', '条盒纸', 'THDYC', '条盒纸多(>1张)', 'C', 1 FROM inspection_record WHERE date='2026-06-19' AND shift='中班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'carton', '钢印', 'TGQHD', '钢印缺或糊', 'D', 1 FROM inspection_record WHERE date='2026-06-19' AND shift='晚班';

-- 【6月20日】
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'carton', '条盒杂项', 'TAZZD', '条盒轧皱(20-30mm)', 'D', 1 FROM inspection_record WHERE date='2026-06-20' AND shift='早班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'carton', '条盒杂项', 'THNNC', '条盒内部粘连', 'C', 2 FROM inspection_record WHERE date='2026-06-20' AND shift='中班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'carton', '拉线', 'TLCQC', '拉线残缺(≥10mm)', 'C', 1 FROM inspection_record WHERE date='2026-06-20' AND shift='早班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'carton', '拉线', 'TLDKC', '拉线搭口错位(≥2mm)', 'C', 1 FROM inspection_record WHERE date='2026-06-20' AND shift='晚班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'carton', '透明纸', 'TTZPC', '透明纸破(<10mm)', 'C', 2 FROM inspection_record WHERE date='2026-06-20' AND shift='早班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'carton', '透明纸', 'TTZJC', '透明纸折角(≥10mm≥2个)', 'C', 1 FROM inspection_record WHERE date='2026-06-20' AND shift='中班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'carton', '条盒纸', 'THWZC', '条盒纸污(≥5mm≥1处)', 'C', 2 FROM inspection_record WHERE date='2026-06-20' AND shift='早班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'carton', '条盒纸', 'THQZC', '条盒纸翘折(≥5mm)', 'C', 1 FROM inspection_record WHERE date='2026-06-20' AND shift='晚班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'carton', '钢印', 'TGKPD', '钢印刻破(可辨识)', 'D', 1 FROM inspection_record WHERE date='2026-06-20' AND shift='中班';

-- ====== 盒装外观缺陷明细（按日期×班次×部位×缺陷补充丰富数据） ======

-- 【6月11日】
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'boxSmall', '小盒杂项', 'HAZZB', '小盒轧皱(≥10mm)', 'B', 2 FROM inspection_record WHERE date='2026-06-11' AND shift='早班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'boxSmall', '小盒杂项', 'HAWLC', '小盒外部粘连(拉不开)', 'C', 1 FROM inspection_record WHERE date='2026-06-11' AND shift='中班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'boxSmall', '小盒杂项', 'HANJC', '小盒内部未粘牢(少胶)', 'C', 2 FROM inspection_record WHERE date='2026-06-11' AND shift='晚班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'boxSmall', '拉线', 'HLCQC', '拉线残缺(5-10mm)', 'C', 1 FROM inspection_record WHERE date='2026-06-11' AND shift='早班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'boxSmall', '拉线', 'HLLZC', '拉线皱(≥10mm≥10处)', 'C', 2 FROM inspection_record WHERE date='2026-06-11' AND shift='中班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'boxSmall', '拉线', 'HLDZB', '拉线倒置', 'B', 1 FROM inspection_record WHERE date='2026-06-11' AND shift='晚班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'boxSmall', '透明纸', 'HTZZC', '透明纸皱(C区)', 'C', 3 FROM inspection_record WHERE date='2026-06-11' AND shift='早班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'boxSmall', '透明纸', 'HTPSC', '透明纸破(<10mm)', 'C', 2 FROM inspection_record WHERE date='2026-06-11' AND shift='中班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'boxSmall', '框架纸', 'HKZZC', '框架纸皱(≥10mm/≥1/2面积)', 'C', 1 FROM inspection_record WHERE date='2026-06-11' AND shift='晚班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'boxSmall', '商标纸', 'HSZZC', '商标纸皱(≥10mm/≥1/2面积)', 'C', 2 FROM inspection_record WHERE date='2026-06-11' AND shift='早班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'boxSmall', '内衬纸', 'HCZZC', '内衬纸皱(C区)', 'C', 1 FROM inspection_record WHERE date='2026-06-11' AND shift='中班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'boxSmall', '烟支填装', 'HJQYA', '缺支(<20支)', 'A', 1 FROM inspection_record WHERE date='2026-06-11' AND shift='晚班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'boxSmall', '钢印', 'HGWWC', '钢印错无', 'C', 1 FROM inspection_record WHERE date='2026-06-11' AND shift='早班';

-- 【6月12日】
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'boxSmall', '小盒杂项', 'HAWXC', '小盒外形不方正(≥3mm)', 'C', 2 FROM inspection_record WHERE date='2026-06-12' AND shift='早班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'boxSmall', '小盒杂项', 'HAJZC', '小盒外夹杂(≥2mm≥1处)', 'C', 1 FROM inspection_record WHERE date='2026-06-12' AND shift='中班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'boxSmall', '拉线', 'HLCHB', '拉线无', 'B', 1 FROM inspection_record WHERE date='2026-06-12' AND shift='晚班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'boxSmall', '拉线', 'HLDKC', '拉线搭口错位(≥1mm)', 'C', 1 FROM inspection_record WHERE date='2026-06-12' AND shift='早班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'boxSmall', '透明纸', 'HTTPC', '透明纸烫破(1-10mm)', 'C', 2 FROM inspection_record WHERE date='2026-06-12' AND shift='中班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'boxSmall', '透明纸', 'HTSJC', '透明纸松紧(余≥3mm/凹≥1mm)', 'C', 1 FROM inspection_record WHERE date='2026-06-12' AND shift='晚班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'boxSmall', '框架纸', 'HKCQC', '框架纸残缺(25-100mm²)', 'C', 1 FROM inspection_record WHERE date='2026-06-12' AND shift='早班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'boxSmall', '商标纸', 'HSCQB', '商标纸残缺(≥25mm²)', 'B', 1 FROM inspection_record WHERE date='2026-06-12' AND shift='晚班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'boxSmall', '内衬纸', 'HCPSC', '内衬纸破(1-5mm)', 'C', 1 FROM inspection_record WHERE date='2026-06-12' AND shift='中班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'boxSmall', '烟支填装', 'HJDZB', '倒支', 'B', 1 FROM inspection_record WHERE date='2026-06-12' AND shift='早班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'boxSmall', '钢印', 'HGCQC', '钢印残缺(无法辨识)', 'C', 1 FROM inspection_record WHERE date='2026-06-12' AND shift='晚班';

-- 【6月13日】
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'boxSmall', '小盒杂项', 'HAZPB', '小盒轧破(≥5mm)', 'B', 1 FROM inspection_record WHERE date='2026-06-13' AND shift='早班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'boxSmall', '小盒杂项', 'HAZZC', '小盒轧皱(5-10mm)', 'C', 3 FROM inspection_record WHERE date='2026-06-13' AND shift='中班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'boxSmall', '拉线', 'HLLZD', '拉线皱(<10处)', 'D', 2 FROM inspection_record WHERE date='2026-06-13' AND shift='早班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'boxSmall', '拉线', 'HLQKC', '拉线切口切偏(切断)', 'C', 1 FROM inspection_record WHERE date='2026-06-13' AND shift='晚班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'boxSmall', '透明纸', 'HTCMC', '透明纸超平面(≥2mm)', 'C', 2 FROM inspection_record WHERE date='2026-06-13' AND shift='中班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'boxSmall', '透明纸', 'HTCDC', '透明纸长短(≤4mm)', 'C', 1 FROM inspection_record WHERE date='2026-06-13' AND shift='晚班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'boxSmall', '框架纸', 'HKPSC', '框架纸破(≥5mm)', 'C', 1 FROM inspection_record WHERE date='2026-06-13' AND shift='早班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'boxSmall', '商标纸', 'HSPSB', '商标纸破(≥10mm)', 'B', 2 FROM inspection_record WHERE date='2026-06-13' AND shift='晚班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'boxSmall', '内衬纸', 'HCPSB', '内衬纸破(≥5mm)', 'B', 1 FROM inspection_record WHERE date='2026-06-13' AND shift='中班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'boxSmall', '烟支填装', 'HADZA', '短支(≥5mm)', 'A', 1 FROM inspection_record WHERE date='2026-06-13' AND shift='晚班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'boxSmall', '钢印', 'HGHHC', '钢印糊(无法辨识)', 'C', 1 FROM inspection_record WHERE date='2026-06-13' AND shift='早班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'boxSmall', '小盒杂项', 'HAXFD', '透明纸吸附商标纸(25-200mm²)', 'D', 1 FROM inspection_record WHERE date='2026-06-13' AND shift='中班';

-- 【6月14日】
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'boxSmall', '小盒杂项', 'HANJB', '小盒内部未粘牢(无胶)', 'B', 2 FROM inspection_record WHERE date='2026-06-14' AND shift='早班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'boxSmall', '小盒杂项', 'HAWLD', '小盒外部粘连(可分离)', 'D', 3 FROM inspection_record WHERE date='2026-06-14' AND shift='中班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'boxSmall', '拉线', 'HLCYC', '拉线错用', 'C', 1 FROM inspection_record WHERE date='2026-06-14' AND shift='晚班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'boxSmall', '拉线', 'HLGDD', '拉线高低', 'D', 2 FROM inspection_record WHERE date='2026-06-14' AND shift='早班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'boxSmall', '透明纸', 'HTTZC', '透明纸烫皱(≥3/4面积)', 'C', 1 FROM inspection_record WHERE date='2026-06-14' AND shift='中班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'boxSmall', '透明纸', 'HTDHB', '透明纸倒包', 'B', 1 FROM inspection_record WHERE date='2026-06-14' AND shift='晚班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'boxSmall', '框架纸', 'HKLCC', '框架纸露', 'C', 1 FROM inspection_record WHERE date='2026-06-14' AND shift='早班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'boxSmall', '商标纸', 'HSBMC', '商标纸爆墨(≥5mm≥3点)', 'C', 1 FROM inspection_record WHERE date='2026-06-14' AND shift='晚班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'boxSmall', '内衬纸', 'HCWZC', '内衬纸污(≥5mm≥1处)', 'C', 1 FROM inspection_record WHERE date='2026-06-14' AND shift='中班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'boxSmall', '烟支填装', 'HJPLD', '烟支排列不齐', 'D', 2 FROM inspection_record WHERE date='2026-06-14' AND shift='早班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'boxSmall', '钢印', 'HGKPC', '钢印刻破(无法辨识)', 'C', 1 FROM inspection_record WHERE date='2026-06-14' AND shift='晚班';

-- 【6月15日】
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'boxSmall', '小盒杂项', 'HAJZB', '小盒外夹杂(≥5mm≥2处)', 'B', 1 FROM inspection_record WHERE date='2026-06-15' AND shift='早班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'boxSmall', '小盒杂项', 'HAZZB', '小盒轧皱(≥10mm)', 'B', 2 FROM inspection_record WHERE date='2026-06-15' AND shift='晚班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'boxSmall', '拉线', 'HLZFD', '拉线字体反向', 'D', 1 FROM inspection_record WHERE date='2026-06-15' AND shift='中班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'boxSmall', '拉线', 'HLSLC', '拉线撕拉不畅(锯齿/轻抽)', 'C', 1 FROM inspection_record WHERE date='2026-06-15' AND shift='早班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'boxSmall', '透明纸', 'HTZZD', '透明纸皱(D区)', 'D', 2 FROM inspection_record WHERE date='2026-06-15' AND shift='晚班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'boxSmall', '透明纸', 'HTWZC', '透明纸污(≥3mm)', 'C', 1 FROM inspection_record WHERE date='2026-06-15' AND shift='中班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'boxSmall', '框架纸', 'HKZZD', '框架纸皱(<10mm/≥1/4面积)', 'D', 1 FROM inspection_record WHERE date='2026-06-15' AND shift='早班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'boxSmall', '商标纸', 'HSWZC', '商标纸污(C区)', 'C', 2 FROM inspection_record WHERE date='2026-06-15' AND shift='晚班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'boxSmall', '内衬纸', 'HCCQC', '内衬纸残缺(25-100mm²)', 'C', 1 FROM inspection_record WHERE date='2026-06-15' AND shift='中班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'boxSmall', '烟支填装', 'HACZA', '残支(破裂≥5mm)', 'A', 1 FROM inspection_record WHERE date='2026-06-15' AND shift='晚班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'boxSmall', '钢印', 'HGWZC', '钢印位置(C)', 'C', 1 FROM inspection_record WHERE date='2026-06-15' AND shift='早班';

-- 【6月16日】
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'boxSmall', '小盒杂项', 'HAJZD', '小盒外夹杂(烟末3-10点)', 'D', 2 FROM inspection_record WHERE date='2026-06-16' AND shift='早班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'boxSmall', '小盒杂项', 'HAZZC', '小盒轧皱(5-10mm)', 'C', 4 FROM inspection_record WHERE date='2026-06-16' AND shift='中班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'boxSmall', '拉线', 'HLCQC', '拉线残缺(5-10mm)', 'C', 2 FROM inspection_record WHERE date='2026-06-16' AND shift='早班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'boxSmall', '拉线', 'HLDZB', '拉线倒置', 'B', 1 FROM inspection_record WHERE date='2026-06-16' AND shift='晚班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'boxSmall', '透明纸', 'HTZZC', '透明纸皱(C区)', 'C', 3 FROM inspection_record WHERE date='2026-06-16' AND shift='中班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'boxSmall', '透明纸', 'HTPSC', '透明纸破(<10mm)', 'C', 2 FROM inspection_record WHERE date='2026-06-16' AND shift='晚班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'boxSmall', '框架纸', 'HKCYC', '框架纸错用', 'C', 1 FROM inspection_record WHERE date='2026-06-16' AND shift='早班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'boxSmall', '商标纸', 'HSQBB', '商标纸翘边(≥15mm)', 'B', 1 FROM inspection_record WHERE date='2026-06-16' AND shift='晚班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'boxSmall', '内衬纸', 'HCCQB', '内衬纸残缺(≥100mm²)', 'B', 1 FROM inspection_record WHERE date='2026-06-16' AND shift='中班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'boxSmall', '烟支填装', 'HAGDB', '轧坏烟', 'B', 1 FROM inspection_record WHERE date='2026-06-16' AND shift='早班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'boxSmall', '钢印', 'HGHHD', '钢印糊(可辨识)', 'D', 1 FROM inspection_record WHERE date='2026-06-16' AND shift='晚班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'boxSmall', '小盒杂项', 'HANZC', '小盒内夹杂(2-5mm)', 'C', 1 FROM inspection_record WHERE date='2026-06-16' AND shift='中班';

-- 【6月17日】
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'boxSmall', '小盒杂项', 'HAZZB', '小盒轧皱(≥10mm)', 'B', 3 FROM inspection_record WHERE date='2026-06-17' AND shift='早班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'boxSmall', '小盒杂项', 'HAZPB', '小盒轧破(≥5mm)', 'B', 2 FROM inspection_record WHERE date='2026-06-17' AND shift='中班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'boxSmall', '拉线', 'HLCHB', '拉线无', 'B', 1 FROM inspection_record WHERE date='2026-06-17' AND shift='晚班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'boxSmall', '拉线', 'HLLZC', '拉线皱(≥10mm≥10处)', 'C', 1 FROM inspection_record WHERE date='2026-06-17' AND shift='早班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'boxSmall', '透明纸', 'HTWWA', '透明纸无', 'A', 1 FROM inspection_record WHERE date='2026-06-17' AND shift='中班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'boxSmall', '透明纸', 'HTZZC', '透明纸皱(C区)', 'C', 4 FROM inspection_record WHERE date='2026-06-17' AND shift='晚班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'boxSmall', '框架纸', 'HKWWB', '框架纸无', 'B', 1 FROM inspection_record WHERE date='2026-06-17' AND shift='早班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'boxSmall', '商标纸', 'HSCQC', '商标纸残缺(5-25mm²)', 'C', 3 FROM inspection_record WHERE date='2026-06-17' AND shift='中班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'boxSmall', '内衬纸', 'HCZZD', '内衬纸皱(D区)', 'D', 1 FROM inspection_record WHERE date='2026-06-17' AND shift='晚班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'boxSmall', '烟支填装', 'HASTB', '烟支缩头(≥1mm)', 'B', 1 FROM inspection_record WHERE date='2026-06-17' AND shift='早班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'boxSmall', '钢印', 'HGKPD', '钢印刻破(可辨识)', 'D', 2 FROM inspection_record WHERE date='2026-06-17' AND shift='中班';

-- 【6月18日】
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'boxSmall', '小盒杂项', 'HAWLC', '小盒外部粘连(拉不开)', 'C', 2 FROM inspection_record WHERE date='2026-06-18' AND shift='早班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'boxSmall', '小盒杂项', 'HAWXD', '小盒外形不方正(1-3mm)', 'D', 3 FROM inspection_record WHERE date='2026-06-18' AND shift='中班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'boxSmall', '拉线', 'HLDKC', '拉线搭口错位(≥1mm)', 'C', 1 FROM inspection_record WHERE date='2026-06-18' AND shift='晚班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'boxSmall', '拉线', 'HLQKD', '拉线切口切偏(U形≥1/2宽)', 'D', 1 FROM inspection_record WHERE date='2026-06-18' AND shift='早班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'boxSmall', '透明纸', 'HTTPC', '透明纸烫破(1-10mm)', 'C', 2 FROM inspection_record WHERE date='2026-06-18' AND shift='中班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'boxSmall', '透明纸', 'HTZJC', '透明纸折角(C区)', 'C', 1 FROM inspection_record WHERE date='2026-06-18' AND shift='晚班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'boxSmall', '框架纸', 'HKWZC', '框架纸污(≥5mm≥2处)', 'C', 1 FROM inspection_record WHERE date='2026-06-18' AND shift='早班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'boxSmall', '商标纸', 'HSZDB', '商标纸折叠不到位(B)', 'B', 1 FROM inspection_record WHERE date='2026-06-18' AND shift='晚班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'boxSmall', '内衬纸', 'HCZJC', '内衬纸折叠不到位(未露烟)', 'C', 1 FROM inspection_record WHERE date='2026-06-18' AND shift='中班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'boxSmall', '烟支填装', 'HANLB', '小盒烟支粘连', 'B', 1 FROM inspection_record WHERE date='2026-06-18' AND shift='早班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'boxSmall', '钢印', 'HGWWC', '钢印错无', 'C', 1 FROM inspection_record WHERE date='2026-06-18' AND shift='晚班';

-- 【6月19日】
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'boxSmall', '小盒杂项', 'HANZB', '小盒内夹杂(≥5mm)', 'B', 1 FROM inspection_record WHERE date='2026-06-19' AND shift='早班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'boxSmall', '小盒杂项', 'HAZZC', '小盒轧皱(5-10mm)', 'C', 3 FROM inspection_record WHERE date='2026-06-19' AND shift='中班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'boxSmall', '拉线', 'HLCQC', '拉线残缺(5-10mm)', 'C', 1 FROM inspection_record WHERE date='2026-06-19' AND shift='晚班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'boxSmall', '拉线', 'HLSLC', '拉线撕拉不畅(锯齿/轻抽)', 'C', 1 FROM inspection_record WHERE date='2026-06-19' AND shift='早班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'boxSmall', '透明纸', 'HTZZC', '透明纸皱(C区)', 'C', 2 FROM inspection_record WHERE date='2026-06-19' AND shift='中班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'boxSmall', '透明纸', 'HTSJC', '透明纸松紧(余≥3mm/凹≥1mm)', 'C', 1 FROM inspection_record WHERE date='2026-06-19' AND shift='晚班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'boxSmall', '框架纸', 'HKWPC', '框架纸偏位(≥2mm)', 'C', 1 FROM inspection_record WHERE date='2026-06-19' AND shift='早班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'boxSmall', '商标纸', 'HSCSC', '商标纸擦伤(≥6mm)', 'C', 1 FROM inspection_record WHERE date='2026-06-19' AND shift='晚班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'boxSmall', '内衬纸', 'HCCDD', '内衬纸长短(18-21/10-13mm)', 'D', 1 FROM inspection_record WHERE date='2026-06-19' AND shift='中班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'boxSmall', '烟支填装', 'HADYA', '多支(>20支)', 'A', 1 FROM inspection_record WHERE date='2026-06-19' AND shift='晚班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'boxSmall', '钢印', 'HGKPC', '钢印刻破(无法辨识)', 'C', 1 FROM inspection_record WHERE date='2026-06-19' AND shift='早班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'boxSmall', '小盒杂项', 'HAXFC', '透明纸吸附商标纸(≥200mm²)', 'C', 1 FROM inspection_record WHERE date='2026-06-19' AND shift='中班';

-- 【6月20日】
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'boxSmall', '小盒杂项', 'HAJZC', '小盒外夹杂(≥2mm≥1处)', 'C', 2 FROM inspection_record WHERE date='2026-06-20' AND shift='早班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'boxSmall', '小盒杂项', 'HAZZB', '小盒轧皱(≥10mm)', 'B', 1 FROM inspection_record WHERE date='2026-06-20' AND shift='晚班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'boxSmall', '拉线', 'HLDZB', '拉线倒置', 'B', 1 FROM inspection_record WHERE date='2026-06-20' AND shift='中班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'boxSmall', '拉线', 'HLGDD', '拉线高低', 'D', 2 FROM inspection_record WHERE date='2026-06-20' AND shift='早班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'boxSmall', '透明纸', 'HTZJD', '透明纸折角(D区)', 'D', 1 FROM inspection_record WHERE date='2026-06-20' AND shift='晚班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'boxSmall', '透明纸', 'HTPSC', '透明纸破(<10mm)', 'C', 3 FROM inspection_record WHERE date='2026-06-20' AND shift='中班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'boxSmall', '框架纸', 'HKCQC', '框架纸残缺(25-100mm²)', 'C', 1 FROM inspection_record WHERE date='2026-06-20' AND shift='早班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'boxSmall', '商标纸', 'HSDYC', '商标纸多(>1张)', 'C', 1 FROM inspection_record WHERE date='2026-06-20' AND shift='晚班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'boxSmall', '内衬纸', 'HCWWB', '内衬纸无', 'B', 1 FROM inspection_record WHERE date='2026-06-20' AND shift='中班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'boxSmall', '烟支填装', 'HJCPA', '错支', 'A', 1 FROM inspection_record WHERE date='2026-06-20' AND shift='晚班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'boxSmall', '钢印', 'HGWZD', '钢印位置(D)', 'D', 1 FROM inspection_record WHERE date='2026-06-20' AND shift='早班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'boxSmall', '小盒杂项', 'HAJZD', '小盒外夹杂(烟末3-10点)', 'D', 1 FROM inspection_record WHERE date='2026-06-20' AND shift='中班';

-- ====== 烟支外观缺陷明细（按日期×班次×部位×缺陷补充丰富数据） ======

-- 【6月11日】
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'cigarette', '卷烟端面', 'JACTC', '触头(挤压≥1/3圆周深≥2mm)', 'C', 2 FROM inspection_record WHERE date='2026-06-11' AND shift='早班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'cigarette', '卷烟端面', 'JKKTC', '空头(深1-5mm且≥2/3截面)', 'C', 1 FROM inspection_record WHERE date='2026-06-11' AND shift='中班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'cigarette', '卷烟端面', 'JQXXC', '切口斜(高低≥2mm)', 'C', 1 FROM inspection_record WHERE date='2026-06-11' AND shift='晚班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'cigarette', '卷烟搭口', 'JDZZC', '搭口皱(C区)', 'C', 2 FROM inspection_record WHERE date='2026-06-11' AND shift='早班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'cigarette', '卷烟搭口', 'JDHKC', '豁口(脱胶2-5mm)', 'C', 1 FROM inspection_record WHERE date='2026-06-11' AND shift='晚班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'cigarette', '卷烟表面', 'JPZYC', '卷烟纸皱(C区)', 'C', 1 FROM inspection_record WHERE date='2026-06-11' AND shift='中班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'cigarette', '钢印', 'JGYCC', '钢印错无(编码)', 'C', 1 FROM inspection_record WHERE date='2026-06-11' AND shift='早班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'cigarette', '内部/其他', 'JAZWC', '杂物(纸屑/梗签)', 'C', 1 FROM inspection_record WHERE date='2026-06-11' AND shift='晚班';

-- 【6月12日】
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'cigarette', '卷烟端面', 'JZSTC', '滤嘴缩头(深≥1mm)', 'C', 1 FROM inspection_record WHERE date='2026-06-12' AND shift='早班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'cigarette', '卷烟端面', 'JQBQD', '切口不齐(锯齿/毛渣)', 'D', 2 FROM inspection_record WHERE date='2026-06-12' AND shift='中班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'cigarette', '卷烟端面', 'JZJKC', '胶孔(<2mm²)', 'C', 1 FROM inspection_record WHERE date='2026-06-12' AND shift='晚班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'cigarette', '卷烟搭口', 'JDKZC', '搭口宽窄不一(≥2mm)', 'C', 1 FROM inspection_record WHERE date='2026-06-12' AND shift='早班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'cigarette', '卷烟搭口', 'JDJZC', '卷烟搭口夹杂(非烟末/≥4mm)', 'C', 2 FROM inspection_record WHERE date='2026-06-12' AND shift='晚班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'cigarette', '卷烟表面', 'JPPSD', '破烟(<2mm)', 'D', 1 FROM inspection_record WHERE date='2026-06-12' AND shift='中班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'cigarette', '钢印', 'JGCQC', '钢印残缺(无法识别)', 'C', 1 FROM inspection_record WHERE date='2026-06-12' AND shift='早班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'cigarette', '内部/其他', 'JAKXD', '烟支凹陷(软点)', 'D', 1 FROM inspection_record WHERE date='2026-06-12' AND shift='晚班';

-- 【6月13日】
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'cigarette', '卷烟端面', 'JACTC', '触头(挤压≥1/3圆周深≥2mm)', 'C', 3 FROM inspection_record WHERE date='2026-06-13' AND shift='早班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'cigarette', '卷烟端面', 'JZMLC', '棉线露出(≥2mm)', 'C', 1 FROM inspection_record WHERE date='2026-06-13' AND shift='中班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'cigarette', '卷烟搭口', 'JDBPC', '搭口翘褶(露<1/4圆周)', 'C', 2 FROM inspection_record WHERE date='2026-06-13' AND shift='晚班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'cigarette', '卷烟搭口', 'JDTJC', '搭口焦黄(≥10mm)', 'C', 1 FROM inspection_record WHERE date='2026-06-13' AND shift='早班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'cigarette', '卷烟表面', 'JAWZC', '卷烟表面污(≥6mm²)', 'C', 1 FROM inspection_record WHERE date='2026-06-13' AND shift='中班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'cigarette', '钢印', 'JGKPC', '钢印刻破(<3mm)', 'C', 1 FROM inspection_record WHERE date='2026-06-13' AND shift='晚班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'cigarette', '内部/其他', 'JZSRC', '滤嘴软', 'C', 1 FROM inspection_record WHERE date='2026-06-13' AND shift='早班';

-- 【6月14日】
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'cigarette', '卷烟端面', 'JKKTB', '空头(深≥5mm且≥2/3截面)', 'B', 1 FROM inspection_record WHERE date='2026-06-14' AND shift='早班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'cigarette', '卷烟端面', 'JATSC', '吐丝(≥4mm≥1条或2-4mm≥2条)', 'C', 2 FROM inspection_record WHERE date='2026-06-14' AND shift='中班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'cigarette', '卷烟端面', 'JZWZB', '滤嘴污(≥1mm²)', 'B', 1 FROM inspection_record WHERE date='2026-06-14' AND shift='晚班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'cigarette', '卷烟搭口', 'JDBKA', '爆口(≥1/4长度)', 'A', 1 FROM inspection_record WHERE date='2026-06-14' AND shift='中班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'cigarette', '卷烟搭口', 'JSBQC', '水松纸粘贴不齐(≥2mm)', 'C', 1 FROM inspection_record WHERE date='2026-06-14' AND shift='早班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'cigarette', '卷烟表面', 'JSZTC', '水松纸皱(C区)', 'C', 1 FROM inspection_record WHERE date='2026-06-14' AND shift='晚班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'cigarette', '钢印', 'JGWDC', '钢印污点(≥1mm)', 'C', 1 FROM inspection_record WHERE date='2026-06-14' AND shift='早班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'cigarette', '内部/其他', 'JZPHC', '装接间隙(≥3mm)', 'C', 1 FROM inspection_record WHERE date='2026-06-14' AND shift='中班';

-- 【6月15日】
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'cigarette', '卷烟端面', 'JKKTC', '空头(深1-5mm且≥2/3截面)', 'C', 2 FROM inspection_record WHERE date='2026-06-15' AND shift='早班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'cigarette', '卷烟端面', 'JQJZC', '端面夹杂(非烟草)', 'C', 1 FROM inspection_record WHERE date='2026-06-15' AND shift='中班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'cigarette', '卷烟搭口', 'JDHKB', '豁口(脱胶≥5mm)', 'B', 1 FROM inspection_record WHERE date='2026-06-15' AND shift='晚班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'cigarette', '卷烟搭口', 'JDPSD', '搭口破(<3mm)', 'D', 2 FROM inspection_record WHERE date='2026-06-15' AND shift='早班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'cigarette', '卷烟表面', 'JPZYD', '卷烟纸皱(D区)', 'D', 1 FROM inspection_record WHERE date='2026-06-15' AND shift='晚班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'cigarette', '钢印', 'JGMHC', '钢印模糊(无法识别)', 'C', 1 FROM inspection_record WHERE date='2026-06-15' AND shift='中班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'cigarette', '内部/其他', 'JFBZB', '滤嘴内无爆珠', 'B', 1 FROM inspection_record WHERE date='2026-06-15' AND shift='晚班';

-- 【6月16日】
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'cigarette', '卷烟端面', 'JACTC', '触头(挤压≥1/3圆周深≥2mm)', 'C', 4 FROM inspection_record WHERE date='2026-06-16' AND shift='早班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'cigarette', '卷烟端面', 'JZSTD', '滤嘴缩头(深0.5-1mm)', 'D', 2 FROM inspection_record WHERE date='2026-06-16' AND shift='中班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'cigarette', '卷烟搭口', 'JDZZC', '搭口皱(C区)', 'C', 3 FROM inspection_record WHERE date='2026-06-16' AND shift='晚班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'cigarette', '卷烟搭口', 'JDKZD', '搭口宽窄不一(0.5-2mm)', 'D', 1 FROM inspection_record WHERE date='2026-06-16' AND shift='早班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'cigarette', '卷烟表面', 'JPZYC', '卷烟纸皱(C区)', 'C', 2 FROM inspection_record WHERE date='2026-06-16' AND shift='中班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'cigarette', '钢印', 'JGYCB', '钢印错无(牌号)', 'B', 1 FROM inspection_record WHERE date='2026-06-16' AND shift='晚班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'cigarette', '内部/其他', 'JZBZB', '滤嘴内爆珠破损', 'B', 1 FROM inspection_record WHERE date='2026-06-16' AND shift='早班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'cigarette', '卷烟端面', 'JZJKB', '胶孔(≥2mm²)', 'B', 1 FROM inspection_record WHERE date='2026-06-16' AND shift='中班';

-- 【6月17日】
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'cigarette', '卷烟端面', 'JKKTB', '空头(深≥5mm且≥2/3截面)', 'B', 2 FROM inspection_record WHERE date='2026-06-17' AND shift='早班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'cigarette', '卷烟端面', 'JATSC', '吐丝(≥4mm≥1条或2-4mm≥2条)', 'C', 3 FROM inspection_record WHERE date='2026-06-17' AND shift='中班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'cigarette', '卷烟搭口', 'JALQC', '漏气(有毛渣/胶)', 'C', 2 FROM inspection_record WHERE date='2026-06-17' AND shift='晚班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'cigarette', '卷烟搭口', 'JDTJD', '搭口焦黄(<10mm)', 'D', 1 FROM inspection_record WHERE date='2026-06-17' AND shift='早班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'cigarette', '卷烟表面', 'JSZTD', '水松纸皱(D区)', 'D', 1 FROM inspection_record WHERE date='2026-06-17' AND shift='中班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'cigarette', '钢印', 'JGKPC', '钢印刻破(<3mm)', 'C', 2 FROM inspection_record WHERE date='2026-06-17' AND shift='晚班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'cigarette', '内部/其他', 'JAZJD', '竹节烟', 'D', 1 FROM inspection_record WHERE date='2026-06-17' AND shift='早班';

-- 【6月18日】
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'cigarette', '卷烟端面', 'JACTC', '触头(挤压≥1/3圆周深≥2mm)', 'C', 2 FROM inspection_record WHERE date='2026-06-18' AND shift='早班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'cigarette', '卷烟端面', 'JKKTC', '空头(深1-5mm且≥2/3截面)', 'C', 1 FROM inspection_record WHERE date='2026-06-18' AND shift='中班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'cigarette', '卷烟搭口', 'JDBPC', '搭口翘褶(露<1/4圆周)', 'C', 1 FROM inspection_record WHERE date='2026-06-18' AND shift='晚班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'cigarette', '卷烟搭口', 'JDPSC', '搭口破(3-5mm)', 'C', 1 FROM inspection_record WHERE date='2026-06-18' AND shift='早班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'cigarette', '卷烟表面', 'JPPSD', '破烟(<2mm)', 'D', 2 FROM inspection_record WHERE date='2026-06-18' AND shift='中班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'cigarette', '钢印', 'JGWZC', '钢印位置不对(C)', 'C', 1 FROM inspection_record WHERE date='2026-06-18' AND shift='晚班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'cigarette', '内部/其他', 'JZJMD', '滤嘴夹烟末', 'D', 1 FROM inspection_record WHERE date='2026-06-18' AND shift='早班';

-- 【6月19日】
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'cigarette', '卷烟端面', 'JATSC', '吐丝(≥4mm≥1条或2-4mm≥2条)', 'C', 3 FROM inspection_record WHERE date='2026-06-19' AND shift='早班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'cigarette', '卷烟端面', 'JZSTC', '滤嘴缩头(深≥1mm)', 'C', 1 FROM inspection_record WHERE date='2026-06-19' AND shift='中班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'cigarette', '卷烟搭口', 'JDZZC', '搭口皱(C区)', 'C', 2 FROM inspection_record WHERE date='2026-06-19' AND shift='晚班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'cigarette', '卷烟搭口', 'JDBPD', '搭口翘褶(未露纸)', 'D', 1 FROM inspection_record WHERE date='2026-06-19' AND shift='早班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'cigarette', '卷烟表面', 'JAWZD', '卷烟表面污(1-6mm²)', 'D', 1 FROM inspection_record WHERE date='2026-06-19' AND shift='晚班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'cigarette', '钢印', 'JGCQC', '钢印残缺(无法识别)', 'C', 1 FROM inspection_record WHERE date='2026-06-19' AND shift='中班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'cigarette', '内部/其他', 'JAZWC', '杂物(纸屑/梗签)', 'C', 2 FROM inspection_record WHERE date='2026-06-19' AND shift='早班';

-- 【6月20日】
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'cigarette', '卷烟端面', 'JACTC', '触头(挤压≥1/3圆周深≥2mm)', 'C', 2 FROM inspection_record WHERE date='2026-06-20' AND shift='早班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'cigarette', '卷烟端面', 'JQBQD', '切口不齐(锯齿/毛渣)', 'D', 1 FROM inspection_record WHERE date='2026-06-20' AND shift='中班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'cigarette', '卷烟搭口', 'JDBPC', '搭口翘褶(露<1/4圆周)', 'C', 1 FROM inspection_record WHERE date='2026-06-20' AND shift='晚班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'cigarette', '卷烟搭口', 'JDKZC', '搭口宽窄不一(≥2mm)', 'C', 2 FROM inspection_record WHERE date='2026-06-20' AND shift='早班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'cigarette', '卷烟表面', 'JPZYC', '卷烟纸皱(C区)', 'C', 1 FROM inspection_record WHERE date='2026-06-20' AND shift='中班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'cigarette', '钢印', 'JGMHD', '钢印模糊(可识别)', 'D', 1 FROM inspection_record WHERE date='2026-06-20' AND shift='晚班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'cigarette', '内部/其他', 'JZPHD', '装接间隙(1-3mm)', 'D', 1 FROM inspection_record WHERE date='2026-06-20' AND shift='早班';
INSERT INTO defect_detail (inspection_id, module, body_part, code, name, grade, count)
SELECT id, 'cigarette', '卷烟端面', 'JQXXD', '切口斜(高低0.5-2mm)', 'D', 1 FROM inspection_record WHERE date='2026-06-20' AND shift='晚班';

-- ==================== 预警日志 ====================

INSERT INTO warning_log (occur_time, date, team, machine_id, defect_level, defect_count, description) VALUES
('2026-06-13 23:15:30','2026-06-13','丙班','3#','A',1,'检出A类严重缺陷1个，高风险，立即复核。涉及：烟支空头JKKTB(1个)'),
('2026-06-13 23:15:30','2026-06-13','丙班','3#','B',2,'B类缺陷合计2个，中度风险，及时排查。涉及：烟支触头JACTC(2个)'),
('2026-06-16 23:10:20','2026-06-16','丙班','3#','A',1,'检出A类严重缺陷1个，高风险，立即复核。涉及：小盒透明纸残缺HTCQA(1个)'),
('2026-06-16 23:10:20','2026-06-16','丙班','3#','B',1,'B类缺陷合计1个，中度风险，及时排查。涉及：小盒拉线倒置HLDZB(1个)'),
('2026-06-15 16:20:15','2026-06-15','乙班','2#','B',3,'B类缺陷合计3个，中度风险，及时排查。涉及：烟支触头JACTC(2个)，小盒透明纸破HTPSB(1个)'),
('2026-06-18 09:30:10','2026-06-18','甲班','1#','C',7,'C类缺陷连续3班次上涨，一般风险，请关注。当前值：7个'),
('2026-06-18 16:25:20','2026-06-18','乙班','2#','C',8,'C类缺陷连续3班次上涨，一般风险，请关注。当前值：8个'),
('2026-06-18 23:20:30','2026-06-18','丙班','3#','C',9,'C类缺陷连续3班次上涨，一般风险，请关注。当前值：9个'),
('2026-06-19 09:35:10','2026-06-19','甲班','1#','C',10,'C类缺陷连续3班次上涨，一般风险，请关注。当前值：10个'),
('2026-06-19 16:30:20','2026-06-19','乙班','2#','C',11,'C类缺陷连续3班次上涨，一般风险，请关注。当前值：11个。B类也增多：3个'),
('2026-06-19 23:25:30','2026-06-19','丙班','3#','C',12,'C类缺陷连续3班次上涨，一般风险，请关注。当前值：12个'),
('2026-06-20 09:40:10','2026-06-20','甲班','1#','C',13,'C类缺陷连续3班次上涨，一般风险，请关注。当前值：13个'),
('2026-06-20 16:35:20','2026-06-20','乙班','2#','C',12,'C类缺陷连续3班次上涨，一般风险，请关注。当前值：12个。B类：4个'),
('2026-06-20 23:30:30','2026-06-20','丙班','3#','C',14,'C类缺陷连续3班次上涨，一般风险，请关注。当前值：14个');

