/**
 * 卷烟外观缺陷标准库
 * 来源：QJ/ZY-GY.02-026-2023《卷烟外在质量缺陷判定》
 * 生成时间：2026-08-10
 *
 * 分类说明：
 * - X开头：箱装外观缺陷（纸箱及箱内大条）
 * - T开头：条装外观缺陷（条盒含透明纸、拉线等）
 * - H开头：盒装外观缺陷（小盒含透明纸、拉线、商标纸、内衬纸等）
 * - J开头：烟支外观缺陷（烟支本身及物理指标）
 */

export interface DefectItem {
  code: string;           // 缺陷代码
  name: string;           // 缺陷名称
  category: string;       // 缺陷类别（A/B/C/D）
  standard: string;       // 判定标准
}

export interface DefectLocation {
  location: string;       // 缺陷部位
  defects: DefectItem[];  // 该部位下的所有缺陷
}

export interface DefectCategory {
  key: string;                     // 分类标识
  label: string;                   // 分类名称
  description: string;             // 描述
  locations: DefectLocation[];     // 部位列表
}

/**
 * 箱装外观缺陷库（21项）
 */
export const BOX_DEFECTS: DefectCategory = {
  key: 'box',
  label: '箱装外观缺陷',
  description: '纸箱及箱内大条相关缺陷',
  locations: [
    {
      location: '纸箱杂项',
      defects: [
        { code: 'XXWNC', name: '纸箱未粘牢', category: 'C', standard: '机封纸箱无胶，或纸箱胶带未封牢纸箱摇盖接缝' },
        { code: 'XXNNC', name: '纸箱内部粘牢', category: 'C', standard: '纸箱与大条或大条与大条粘结在一起' },
        { code: 'XTCPA', name: '纸箱大条错装混装', category: 'A', standard: '甲牌号卷烟纸箱中错装混装了乙牌号大条' },
        { code: 'XTQDA', name: '纸箱缺条多条', category: 'A', standard: '箱内实装大条数量少于或多于产品内控标准要求的数量' },
        { code: 'XAJZC', name: '纸箱夹杂', category: 'C', standard: '纸箱内装有非标准要求装入的物品，如废纸、胶带等' },
        { code: 'XFJZC', name: '纸箱来料夹杂', category: 'C', standard: '纸箱来料带有非标准要求装入的物品，如废纸、胶带等' },
      ]
    },
    {
      location: '纸箱',
      defects: [
        { code: 'XXPSC', name: '纸箱破残', category: 'C', standard: '纸箱可视面有撕裂长度≥20cm的破损或有最大直径≥20cm的孔洞' },
        { code: 'XXSSC', name: '纸箱损伤', category: 'C', standard: '纸箱损坏并导致条盒产生C类缺陷' },
        { code: 'XXCYA', name: '纸箱错用', category: 'A', standard: '甲牌号卷烟成品中错用乙牌号纸箱' },
        { code: 'XXMBA', name: '纸箱霉变', category: 'A', standard: '纸箱表面有霉变痕迹' },
        { code: 'XXWZC', name: '纸箱污', category: 'C', standard: '污迹长度（或直径）及数目符合C区规定' },
        { code: 'XXZJC', name: '纸箱箱盖摺角', category: 'C', standard: '大小箱盖向外翘起或向内折进' },
        { code: 'XFYSD', name: '纸箱印刷缺陷', category: 'D', standard: '文字、图案模糊或轻微残缺不全' },
        { code: 'XFSYC', name: '纸箱式样不符', category: 'C', standard: '文字、图案错印、漏印或严重残缺不全' },
      ]
    },
    {
      location: '胶带',
      defects: [
        { code: 'XJLDC', name: '纸箱漏底', category: 'C', standard: '纸箱盖整体或局部无胶带粘接' },
        { code: 'XJNJD', name: '纸箱胶带粘结异常', category: 'D', standard: '纸箱侧面胶带长度异常或切口倾斜' },
        { code: 'XJCYD', name: '纸箱胶带错用', category: 'D', standard: '甲牌号封箱胶带用作乙牌号' },
        { code: 'XFJYD', name: '纸箱胶带式样不符', category: 'D', standard: '文字、图案错印、漏印或残缺不全' },
      ]
    },
    {
      location: '追溯标识',
      defects: [
        { code: 'XMBWC', name: '标识无', category: 'C', standard: '纸箱追溯标识印被抹去但未补盖新印' },
        { code: 'XMBCC', name: '标识错误', category: 'C', standard: '追溯标识印有数字错误、模糊或缺失' },
        { code: 'XMGCB', name: '条件关联错误', category: 'B', standard: '条件关联列表中不存在抽取的条烟二维码' },
      ]
    }
  ]
};

/**
 * 条装外观缺陷库（70项）
 */
export const CARTON_DEFECTS: DefectCategory = {
  key: 'carton',
  label: '条装外观缺陷',
  description: '条盒（含透明纸、拉线等）相关缺陷',
  locations: [
    {
      location: '条盒杂项',
      defects: [
        { code: 'TAZZC', name: '条盒轧皱', category: 'C', standard: '条盒表面皱褶线长度≥30mm或皱纹累积面积≥900mm²' },
        { code: 'TAZPB', name: '条盒轧破', category: 'B', standard: '条盒表面破损长度≥30mm或有孔洞直径≥5mm' },
        { code: 'THNNC', name: '条盒内部粘连', category: 'C', standard: '条盒长边或横头粘连小包' },
        { code: 'TBQBA', name: '条盒缺包', category: 'A', standard: '条内实装小包数量少于产品内控标准要求的数量' },
        { code: 'TBCPA', name: '条盒小包错装混装', category: 'A', standard: '甲牌号大条内错装混装乙牌号小包' },
        { code: 'TAWZC', name: '条盒外夹杂', category: 'C', standard: '条盒透明纸内部或外部夹有杂物' },
        { code: 'TANZC', name: '条盒内夹杂', category: 'C', standard: '条盒纸内部夹有杂物' },
        { code: 'THXTC', name: '透明纸吸附条盒纸', category: 'C', standard: '累积吸附面积≥900mm²' },
        { code: 'TAGCB', name: '盒条关联错误', category: 'B', standard: '盒条关联列表中不存在抽取的盒装二维码' },
      ]
    },
    {
      location: '拉线',
      defects: [
        { code: 'TLWWB', name: '拉线无', category: 'B', standard: '透明纸上无拉线粘结' },
        { code: 'TLCQC', name: '拉线残缺', category: 'C', standard: '透明纸上拉线不完整，未粘结长度≥10mm' },
        { code: 'TLCYC', name: '拉线错用', category: 'C', standard: '甲牌号卷烟成品中错用乙牌号拉线' },
        { code: 'TLDZC', name: '拉线倒置', category: 'C', standard: '拉线位置错误' },
        { code: 'TLDKC', name: '拉线搭口错位', category: 'C', standard: '拉线内外端头垂直拉线方向无重合且间距d≥2mm' },
        { code: 'TLGDD', name: '拉线高低', category: 'D', standard: '拉线中心距临近横头过远或过近' },
        { code: 'TLSLC', name: '拉线撕拉不畅', category: 'C', standard: '拉线拉不开或拉断或拉线头反向烫死' },
        { code: 'TLQKC', name: '拉线切口切偏', category: 'C', standard: '切口切偏，拉线头被切断' },
        { code: 'TFLKC', name: '拉线宽度不符', category: 'C', standard: '宽度偏差大于0.5mm' },
        { code: 'TFLYD', name: '拉线印刷缺陷', category: 'D', standard: '拉线印刷不完整、或同批存在明显色差' },
      ]
    },
    {
      location: '透明纸',
      defects: [
        { code: 'TTWWB', name: '透明纸无', category: 'B', standard: '条盒纸外无透明纸包装' },
        { code: 'TTDYC', name: '透明纸多', category: 'C', standard: '条盒纸外透明纸＞1张' },
        { code: 'TTCQB', name: '透明纸残缺', category: 'C', standard: '透明纸不完整面积≥100mm²' },
        { code: 'TTPSB', name: '透明纸破', category: 'B', standard: '透明纸有长度≥10mm的撕破、裂缝' },
        { code: 'TTZWC', name: '透明纸污', category: 'C', standard: '污迹长度（或直径）≥5mm的≥1处' },
        { code: 'TTHHC', name: '透明纸划痕', category: 'C', standard: '表面因摩擦留有划伤痕迹≥5条' },
        { code: 'TTZJC', name: '透明纸折角', category: 'C', standard: '透明纸折角长度≥10mm的个数≥2个' },
        { code: 'TTRKC', name: '透明纸热封不牢', category: 'C', standard: '粘结不牢长度≥60mm或露出条盒纸≥8mm' },
        { code: 'TTSJC', name: '透明纸松紧', category: 'C', standard: '拉紧后多余长度≥4mm或过紧导致凹陷' },
        { code: 'TTJC', name: '透明纸折叠突出', category: 'C', standard: '超出条盒平面长度≥2mm' },
        { code: 'TTCDC', name: '透明纸长短', category: 'C', standard: '一端搭口宽度≤3mm' },
        { code: 'TTPJC', name: '透明纸拼接', category: 'C', standard: '透明纸含有拼接段' },
        { code: 'TFTWC', name: '透明纸材料缺陷', category: 'C', standard: '来料有折皱、暴筋、气泡' },
      ]
    },
    {
      location: '免税烟标志',
      defects: [
        { code: 'TMSCA', name: '免税烟标志错用', category: 'A', standard: '甲客商卷烟成品中错用乙客商免税烟标志' },
        { code: 'TMSWB', name: '免税烟标志无', category: 'B', standard: '条透明纸免税烟标志粘结处无免税烟标志' },
        { code: 'TMSBB', name: '免税烟标志信息不全', category: 'B', standard: '数字码位等特征信息辨识不清' },
        { code: 'TMSUC', name: '免税烟标志污', category: 'C', standard: '污迹长度（或直径）≥5mm的≥3处' },
        { code: 'TMSQB', name: '免税烟标志残缺', category: 'B', standard: '缺损≥1/4总面积' },
        { code: 'TMSPC', name: '免税烟标志破', category: 'C', standard: '有长度≥2mm的撕破、裂缝或孔洞' },
        { code: 'TMSID', name: '免税烟标志擦伤', category: 'D', standard: '表面有露底' },
        { code: 'TMSZC', name: '免税烟标志翘折', category: 'C', standard: '斜线长度≥10mm，或两个粘结面都没粘牢' },
        { code: 'TMSYC', name: '免税烟标志多', category: 'C', standard: '粘结处＞1张' },
        { code: 'TMSFC', name: '免税烟标志皱', category: 'C', standard: '表面有长度≥10mm的皱褶' },
        { code: 'TMSDB', name: '免税烟标志反倒', category: 'B', standard: '内外面反向' },
        { code: 'TMSLC', name: '免税烟标志偏位', category: 'C', standard: '距标准位距离差≥3mm' },
        { code: 'TMSTC', name: '免税烟标志凸出', category: 'C', standard: '凸出长度≥2mm' },
      ]
    },
    {
      location: '条盒纸',
      defects: [
        { code: 'THWWA', name: '条盒纸无', category: 'A', standard: '条盒无条盒纸' },
        { code: 'THCQB', name: '条盒纸残缺', category: 'B', standard: '有直径或长度≥1mm的洞或缺角' },
        { code: 'THPSB', name: '条盒纸破', category: 'B', standard: '有撕裂长度≥5mm的破裂或孔洞' },
        { code: 'THCYA', name: '条盒纸错用', category: 'A', standard: '错用乙牌号条盒纸' },
        { code: 'THFBA', name: '条盒纸反包', category: 'A', standard: '条盒纸印刷面在条盒内部' },
        { code: 'THZZC', name: '条盒纸皱', category: 'C', standard: '表面有长度≥15mm皱褶' },
        { code: 'THYHC', name: '条盒纸压痕', category: 'C', standard: '深度≥0.2mm且长度≥20mm的轧压痕迹' },
        { code: 'THCSC', name: '条盒纸擦伤', category: 'C', standard: '擦露底纸长度≥6mm' },
        { code: 'THWZC', name: '条盒纸污', category: 'C', standard: '污迹长度（或直径）≥5mm的≥1处' },
        { code: 'THDYC', name: '条盒纸多', category: 'C', standard: '条盒纸＞1张' },
        { code: 'THZDC', name: '条盒纸折叠不到位', category: 'C', standard: '长边超出临近端面距离≥1mm' },
        { code: 'THBMC', name: '条盒纸爆墨', category: 'C', standard: '油墨爆裂符合C区规定' },
        { code: 'THBKC', name: '条盒纸粘接不牢', category: 'C', standard: '长边或短边完全爆开' },
        { code: 'THQZC', name: '条盒纸翘折', category: 'C', standard: '斜线摺角≥5mm' },
        { code: 'TFHCC', name: '条盒纸色差', category: 'C', standard: '严重色差，或△E≥4.0' },
        { code: 'TFHWC', name: '条盒纸外观缺陷', category: 'C', standard: '文字、图案严重模糊或残缺不全' },
        { code: 'TFHYC', name: '条盒纸印刷缺陷', category: 'C', standard: '印刷污点或脱色面积≥400mm²' },
        { code: 'TFHSA', name: '条盒纸样式不符', category: 'A', standard: '文字、图案错印、漏印' },
      ]
    },
    {
      location: '钢印',
      defects: [
        { code: 'TGWWC', name: '钢印错无', category: 'C', standard: '钢印错用或无钢印' },
        { code: 'TGQHD', name: '钢印缺或糊', category: 'D', standard: '钢印缺或糊而无法辨识' },
        { code: 'TGKPC', name: '钢印刻破', category: 'C', standard: '刻破字符导致无法辨识' },
      ]
    }
  ]
};

/**
 * 盒装外观缺陷库（164项）
 * 注意：由于项目较多，这里只列出主要部位和部分示例，
 * 完整数据请参考 defect_library.json 文件
 */
export const PACK_DEFECTS: DefectCategory = {
  key: 'pack',
  label: '盒装外观缺陷',
  description: '小盒（含透明纸、拉线、商标纸、内衬纸等）相关缺陷',
  locations: [
    {
      location: '小盒杂项',
      defects: [
        { code: 'HAZZB', name: '小盒轧皱', category: 'B', standard: '表面有最大直径≥10mm的皱褶' },
        { code: 'HAZPB', name: '小盒轧破', category: 'B', standard: '有长度≥5mm撕破、裂缝或孔洞' },
        { code: 'HAWLC', name: '小盒外部粘连', category: 'C', standard: '小盒粘结在一起，轻拉不开' },
        { code: 'HANJB', name: '小盒内部未粘牢', category: 'B', standard: '包装材料之间无胶水或成型明显错位' },
        { code: 'HAJZB', name: '小盒外夹杂', category: 'B', standard: '夹有长度≥5mm纸屑、胶块等杂物≥2处' },
        { code: 'HANZB', name: '小盒内夹杂', category: 'B', standard: '商标纸内夹有长度≥5mm的纸屑、胶块等' },
        { code: 'HAWXC', name: '小盒外形不方正', category: 'C', standard: '上部与下部宽度之差≥3mm' },
        { code: 'HAXFC', name: '透明纸吸附商标纸', category: 'C', standard: '累积吸附面积≥200mm²' },
      ]
    },
    {
      location: '拉线',
      defects: [
        { code: 'HLCHB', name: '拉线无', category: 'B', standard: '透明纸上无拉线粘结' },
        { code: 'HLCYC', name: '拉线错用', category: 'C', standard: '错用乙牌号拉线' },
        { code: 'HLCQB', name: '拉线残缺', category: 'B', standard: '未粘结长度≥10mm' },
        { code: 'HLLZC', name: '拉线皱', category: 'C', standard: '连续长度≥10mm且≥10处' },
        { code: 'HLZFD', name: '拉线字体反向', category: 'D', standard: '字体顺序颠倒' },
        { code: 'HLDZB', name: '拉线倒置', category: 'B', standard: '位置错误' },
        { code: 'HLDKC', name: '拉线搭口错位', category: 'C', standard: '间距d≥1mm' },
        { code: 'HLQKC', name: '拉线切口切偏', category: 'C', standard: '拉线头被切断' },
        { code: 'HLGDD', name: '拉线高低', category: 'D', standard: '距商标纸顶部长度异常' },
        { code: 'HLSLB', name: '拉线撕拉不畅', category: 'B', standard: '拉不开或拉断' },
        { code: 'HFLKC', name: '拉线宽度不符', category: 'C', standard: '偏差大于0.5mm' },
        { code: 'HFLYD', name: '拉线印刷缺陷', category: 'D', standard: '印刷不完整或色差' },
      ]
    },
    {
      location: '透明纸',
      defects: [
        { code: 'HTWWA', name: '透明纸无', category: 'A', standard: '商标纸外无透明纸包装' },
        { code: 'HTCQA', name: '透明纸残缺', category: 'A', standard: '不完整面积≥100mm²' },
        { code: 'HTDYC', name: '透明纸多', category: 'C', standard: '透明纸＞1张' },
        { code: 'HTPSB', name: '透明纸破', category: 'B', standard: '有长度≥10mm的撕破、裂缝' },
        { code: 'HTTPB', name: '透明纸烫破', category: 'B', standard: '烫损最大直径≥10mm' },
        { code: 'HTZZC', name: '透明纸皱', category: 'C', standard: '非热封面皱褶符合C区规定' },
        { code: 'HTTZC', name: '透明纸烫皱', category: 'C', standard: '热封面皱褶长度≥20mm' },
        { code: 'HTBSC', name: '透明纸热封变色', category: 'C', standard: '明显色差面积≥1/2热封面积' },
        { code: 'HTRKC', name: '透明纸热封不牢', category: 'C', standard: '粘结不牢长度≥5mm' },
        { code: 'HTSJC', name: '透明纸松紧', category: 'C', standard: '多余长度≥3mm或过紧导致凹陷' },
        { code: 'HTWZC', name: '透明纸污', category: 'C', standard: '污迹长度（或直径）≥3mm' },
        { code: 'HTHHC', name: '透明纸划痕', category: 'C', standard: '划伤痕迹≥3条' },
        { code: 'HTCMC', name: '透明纸超平面', category: 'C', standard: '超出小盒平面≥2mm' },
        { code: 'HTDHB', name: '透明纸倒包', category: 'B', standard: '拉线处于小盒下部' },
        { code: 'HTZJC', name: '透明纸折角', category: 'C', standard: '符合C区规定' },
        { code: 'HTCJC', name: '透明纸出角', category: 'C', standard: '超出小盒平面长度≥2mm' },
        { code: 'HTCDC', name: '透明纸长短', category: 'C', standard: '搭口重叠宽度≤4mm' },
        { code: 'HTPJC', name: '透明纸拼接', category: 'C', standard: '含有拼接段' },
        { code: 'HFTWC', name: '透明纸材料缺陷', category: 'C', standard: '来料有折皱、暴筋、气泡' },
      ]
    },
    {
      location: '印花',
      defects: [
        { code: 'HYCYB', name: '印花错用', category: 'B', standard: '错用乙牌号印花' },
        { code: 'HYWWA', name: '印花无', category: 'A', standard: '粘结处无印花' },
        { code: 'HYWZC', name: '印花污', category: 'C', standard: '污迹长度（或直径）≥5mm的≥1处' },
        { code: 'HYCQB', name: '印花残缺', category: 'B', standard: '缺损≥1/4总面积' },
        { code: 'HYPSB', name: '印花破', category: 'B', standard: '有长度≥2mm的撕破、裂缝或孔洞' },
        { code: 'HYCSD', name: '印花擦伤', category: 'D', standard: '表面有露底' },
        { code: 'HYQZB', name: '印花翘折', category: 'B', standard: '斜线长度≥10mm或两个粘结面没粘牢' },
        { code: 'HYDYC', name: '印花多', category: 'C', standard: '粘结处＞1张' },
        { code: 'HYZZC', name: '印花皱', category: 'C', standard: '表面有长度≥10mm的皱褶' },
        { code: 'HYFDC', name: '印花反倒', category: 'C', standard: '内外面反向' },
        { code: 'HYWPC', name: '印花偏位', category: 'C', standard: '四角距顶部/侧边最大距离差≥6mm/4mm' },
        { code: 'HYTCC', name: '印花凸出', category: 'C', standard: '凸出长度≥2mm' },
        { code: 'HYTJC', name: '印花吐胶', category: 'C', standard: '胶水溢出符合C区规定' },
        { code: 'HYCPC', name: '印花裁切偏位', category: 'C', standard: '裁切边与印刷边框间距＜0.5mm' },
        { code: 'HFYYC', name: '印花印刷缺陷', category: 'C', standard: '严重模糊、残缺不全或偏位≥0.5mm' },
        { code: 'HFYCC', name: '印花色差', category: 'C', standard: '严重色差，或△E≥4.0' },
        { code: 'HFYSC', name: '印花式样不符', category: 'C', standard: '文字、图案错印、漏印' },
        { code: 'HYMCD', name: '印花毛刺', category: 'D', standard: '裁切后有毛刺' },
      ]
    },
    {
      location: '税票',
      defects: [
        { code: 'HSPCA', name: '税票错用', category: 'A', standard: '错用乙牌号税票' },
        { code: 'HSPWB', name: '税票无', category: 'B', standard: '粘结处无税票' },
        { code: 'HSPNB', name: '税票粘结不符', category: 'B', standard: '盒盖打开税票无破损' },
        { code: 'HSPBB', name: '税码不全', category: 'B', standard: '税码辨识不清' },
        { code: 'HSPUC', name: '税票污', category: 'C', standard: '污迹长度（或直径）≥5mm的≥3处' },
        { code: 'HSPQB', name: '税票残缺', category: 'B', standard: '缺损≥1/4总面积' },
        { code: 'HSPPC', name: '税票破', category: 'C', standard: '有长度≥2mm的撕破、裂缝或孔洞' },
        { code: 'HSPID', name: '税票擦伤', category: 'D', standard: '表面有露底' },
        { code: 'HSPZC', name: '税票翘折', category: 'C', standard: '斜线长度≥10mm或两个粘结面没粘牢' },
        { code: 'HSPYC', name: '税票多', category: 'C', standard: '粘结处＞1张' },
        { code: 'HSPFC', name: '税票皱', category: 'C', standard: '表面有长度≥10mm的皱褶' },
        { code: 'HSPDB', name: '税票反倒', category: 'B', standard: '内外面反向' },
        { code: 'HSPLC', name: '税票偏位', category: 'C', standard: '距标准位距离差≥3mm' },
        { code: 'HSPTC', name: '税票凸出', category: 'C', standard: '凸出长度≥2mm' },
        { code: 'HSPJC', name: '税票吐胶', category: 'C', standard: '胶水溢点数＞3点且总长度＞10mm' },
      ]
    },
    {
      location: '免税烟标志',
      defects: [
        { code: 'HMSCA', name: '免税烟标志错用', category: 'A', standard: '错用乙客商免税烟标志' },
        { code: 'HMSWB', name: '免税烟标志无', category: 'B', standard: '粘结处无免税烟标志' },
        { code: 'HMSBB', name: '免税烟标志信息不全', category: 'B', standard: '数字码位等辨识不清' },
        { code: 'HMSUC', name: '免税烟标志污', category: 'C', standard: '污迹长度（或直径）≥5mm的≥3处' },
        { code: 'HMSQB', name: '免税烟标志残缺', category: 'B', standard: '缺损≥1/4总面积' },
        { code: 'HMSPC', name: '免税烟标志破', category: 'C', standard: '有长度≥2mm的撕破、裂缝或孔洞' },
        { code: 'HMSID', name: '免税烟标志擦伤', category: 'D', standard: '表面有露底' },
        { code: 'HMSZC', name: '免税烟标志翘折', category: 'C', standard: '斜线长度≥10mm或两个粘结面没粘牢' },
        { code: 'HMSYC', name: '免税烟标志多', category: 'C', standard: '粘结处＞1张' },
        { code: 'HMSFC', name: '免税烟标志皱', category: 'C', standard: '表面有长度≥10mm的皱褶' },
        { code: 'HMSDB', name: '免税烟标志反倒', category: 'B', standard: '内外面反向' },
        { code: 'HMSLC', name: '免税烟标志偏位', category: 'C', standard: '距标准位距离差≥3mm' },
        { code: 'HMSTC', name: '免税烟标志凸出', category: 'C', standard: '凸出长度≥2mm' },
        { code: 'HMSJC', name: '免税烟标志吐胶', category: 'C', standard: '胶水溢点数＞3点且总长度＞10mm' },
      ]
    },
    {
      location: '框架纸',
      defects: [
        { code: 'HKWWB', name: '框架纸无', category: 'B', standard: '小盒内无框架纸' },
        { code: 'HKCQB', name: '框架纸残缺', category: 'B', standard: '不完整面积≥100mm²' },
        { code: 'HKPSC', name: '框架纸破', category: 'C', standard: '有长度≥5mm的撕破、裂缝或孔洞' },
        { code: 'HKLCC', name: '框架纸露', category: 'C', standard: '框架纸露于商标纸外' },
        { code: 'HKCYC', name: '框架纸错用', category: 'C', standard: '错用乙牌号框架纸' },
        { code: 'HFKFC', name: '框架纸反', category: 'C', standard: '内外面反向' },
        { code: 'HKZZC', name: '框架纸皱', category: 'C', standard: '表面有长度≥10mm的皱褶' },
        { code: 'HKWZC', name: '框架纸污', category: 'C', standard: '污迹长度（或直径）≥5mm的≥2处' },
        { code: 'HKCSC', name: '框架纸擦伤', category: 'C', standard: '可视擦露底纸符合C区规定' },
        { code: 'HKPJB', name: '框架纸拼接', category: 'B', standard: '含有拼接段' },
        { code: 'HKMCD', name: '框架纸毛刺', category: 'D', standard: '裁切后有毛刺' },
        { code: 'HKKKC', name: '框架纸卡口', category: 'C', standard: '两折切虚线距离异常' },
        { code: 'HKKBD', name: '框架纸卡边', category: 'D', standard: '反复开合产生卡顿损伤' },
        { code: 'HKWPC', name: '框架纸偏位', category: 'C', standard: '露出长度与中心值差值≥2mm' },
        { code: 'HFKSC', name: '框架纸式样不符', category: 'C', standard: '无花纹（压纹）' },
      ]
    },
    {
      location: '商标纸',
      defects: [
        { code: 'HSWWA', name: '商标纸无', category: 'A', standard: '小盒无商标纸' },
        { code: 'HSCQB', name: '商标纸残缺', category: 'B', standard: '缺损面积≥25mm²' },
        { code: 'HSPSB', name: '商标纸破', category: 'B', standard: '有长度≥10mm的撕破、裂缝或孔洞' },
        { code: 'HSCYA', name: '商标纸错用', category: 'A', standard: '错用乙牌号商标纸' },
        { code: 'HSFBA', name: '商标纸反包', category: 'A', standard: '印刷面在小盒内部' },
        { code: 'HSZZC', name: '商标纸皱', category: 'C', standard: '表面有长度≥10mm的皱褶' },
        { code: 'HSYHC', name: '商标纸压痕', category: 'C', standard: '深度≥0.2mm且长度≥3mm的轧压痕迹' },
        { code: 'HSCSC', name: '商标纸擦伤', category: 'C', standard: '擦伤或露底纸长度≥6mm' },
        { code: 'HSWZC', name: '商标纸污', category: 'C', standard: '污迹长度（或直径）符合C区规定' },
        { code: 'HSDYC', name: '商标纸多', category: 'C', standard: '商标纸＞1张' },
        { code: 'HSBMC', name: '商标纸爆墨', category: 'C', standard: '油墨爆裂长度≥5mm且≥3点' },
        { code: 'HSBKB', name: '商标纸爆壳', category: 'B', standard: '硬包小耳朵或软包长侧边爆开' },
        { code: 'HSXLC', name: '商标纸斜角露白', category: 'C', standard: '斜角露框架纸最大宽度≥2mm' },
        { code: 'HSQBB', name: '商标纸翘边', category: 'B', standard: '折角线≥15mm' },
        { code: 'HSZDB', name: '商标纸折叠不到位', category: 'B', standard: '舌头没有完全折入或距离异常' },
        { code: 'HSGNB', name: '盒盖粘连', category: 'B', standard: '盒盖与衬纸或框架纸粘结' },
        { code: 'HSCDC', name: '商标纸长短壳', category: 'C', standard: '高低≥2mm或低于铝纸上边沿≥3mm' },
        { code: 'HFSYC', name: '商标纸印刷缺陷', category: 'C', standard: '印刷污点符合C区规定' },
        { code: 'HFSGC', name: '商标纸光油缺陷', category: 'C', standard: '表面上光明显起泡' },
        { code: 'HFSWC', name: '商标纸外观缺陷', category: 'C', standard: '文字、图案严重模糊或残缺不全' },
        { code: 'HFSCC', name: '商标纸色差', category: 'C', standard: '严重色差，或△E≥4.0' },
        { code: 'HFSSA', name: '商标纸式样不符', category: 'A', standard: '文字、图案错印、漏印' },
      ]
    },
    {
      location: '商标纸/内衬纸',
      defects: [
        { code: 'HGWWC', name: '钢印错无', category: 'C', standard: '无钢印或者错用钢印' },
        { code: 'HGCQC', name: '钢印残缺', category: 'C', standard: '字符线条不完整导致无法辨识' },
        { code: 'HGHHC', name: '钢印糊', category: 'C', standard: '因模糊导致无法辨识' },
        { code: 'HGKPC', name: '钢印刻破', category: 'C', standard: '刻破字符导致无法辨识' },
        { code: 'HGWZC', name: '钢印位置（倒置/偏/多）', category: 'C', standard: '倒置或多、少字符或偏位' },
      ]
    },
    {
      location: '内衬纸',
      defects: [
        { code: 'HCWWB', name: '内衬纸无', category: 'B', standard: '盒包装无内衬纸' },
        { code: 'HCCQB', name: '内衬纸残缺', category: 'B', standard: '不完整≥100mm²' },
        { code: 'HCPSB', name: '内衬纸破', category: 'B', standard: '有长度≥5mm的撕破、裂缝或孔洞' },
        { code: 'HCCYB', name: '内衬纸错用', category: 'B', standard: '错用乙牌号内衬纸' },
        { code: 'HCZZC', name: '内衬纸皱', category: 'C', standard: '皱褶长度或所占面积符合C区规定' },
        { code: 'HFCSC', name: '内衬纸式样不符', category: 'C', standard: '文字、图案错印、漏印' },
        { code: 'HFCCC', name: '内衬纸色差', category: 'C', standard: '严重色差，或△E≥4.0' },
        { code: 'HFCWC', name: '内衬纸压花后墨色脱落', category: 'C', standard: '压花后明显露底' },
        { code: 'HFCMC', name: '内衬纸爆墨', category: 'C', standard: '油墨爆裂长度≥5mm且≥3点' },
        { code: 'HCWZC', name: '内衬纸污', category: 'C', standard: '污迹长度（或直径）≥5mm的≥1处' },
        { code: 'HCYQC', name: '内衬纸轧花缺', category: 'C', standard: '缺失面积≥100mm²' },
        { code: 'HCYHC', name: '内衬纸轧花不清晰', category: 'C', standard: '淡、糊、不匀' },
        { code: 'HCCHB', name: '厂徽无', category: 'B', standard: '没有应有的厂徽' },
        { code: 'HCHQC', name: '厂徽残缺', category: 'C', standard: '缺失≥1/2个厂徽' },
        { code: 'HCBQC', name: '厂徽不清晰', category: 'C', standard: '模糊面积≥1/2个厂徽' },
        { code: 'HCHPC', name: '厂徽位置', category: 'C', standard: '被框架纸遮盖或超出铝纸折线' },
        { code: 'HCPJB', name: '内衬纸拼接', category: 'B', standard: '含有拼接段' },
        { code: 'HCCDC', name: '内衬纸长短', category: 'C', standard: '顶部衬纸长度异常' },
        { code: 'HCZJB', name: '内衬纸折叠不到位', category: 'B', standard: '顶部折角不到位且露烟支' },
        { code: 'HCFQC', name: '内衬纸撕片未切断', category: 'C', standard: '应切断的长边未切断' },
        { code: 'HCCSC', name: '内衬纸擦伤', category: 'C', standard: '擦伤或露底纸长度≥10mm' },
        { code: 'HCDJB', name: '内衬纸搭接无重叠', category: 'B', standard: '分切长度不足、无搭接' },
        { code: 'HCLQD', name: '内衬纸印字利群切割', category: 'D', standard: '字体不完整' },
      ]
    },
    {
      location: '烟支填装',
      defects: [
        { code: 'HJQYA', name: '缺支', category: 'A', standard: '1包内烟支数量＜20支' },
        { code: 'HJDZB', name: '倒支', category: 'B', standard: '滤嘴端位于小盒底部' },
        { code: 'HADYA', name: '多支', category: 'A', standard: '1包内烟支＞20支' },
        { code: 'HJPLD', name: '烟支排列不齐', category: 'D', standard: '未按7-6-7方式整齐排列' },
        { code: 'HJCPA', name: '错支', category: 'A', standard: '烟支为（或混有）乙牌号' },
        { code: 'HADZA', name: '短支', category: 'A', standard: '比标准长度短5mm以上' },
        { code: 'HACZA', name: '残支', category: 'A', standard: '破裂长度≥5mm' },
        { code: 'HAGDB', name: '轧坏烟', category: 'B', standard: '烟支虽完整但有损坏' },
        { code: 'HANLB', name: '小盒烟支粘连', category: 'B', standard: '烟支之间或烟支与铝纸粘接' },
        { code: 'HALTA', name: '滤嘴脱落', category: 'A', standard: '滤嘴和烟支脱离' },
        { code: 'HASTB', name: '烟支缩头', category: 'B', standard: '端部有≥1mm的空陷' },
        { code: 'HANMD', name: '烟支粘末', category: 'D', standard: '滤嘴端部粘有≥10点的烟末' },
        { code: 'HACYA', name: '虫烟', category: 'A', standard: '内有虫或异物或虫蛀' },
      ]
    }
  ]
};

/**
 * 烟支外观缺陷库（77项）
 */
export const CIGARETTE_DEFECTS: DefectCategory = {
  key: 'cigarette',
  label: '烟支外观缺陷',
  description: '烟支本身及烟支物理指标相关缺陷',
  locations: [
    {
      location: '卷烟端面',
      defects: [
        { code: 'JKKTB', name: '空头', category: 'B', standard: '空陷深度≥5mm且空陷截面积≥2/3端面' },
        { code: 'JACTC', name: '触头', category: 'C', standard: '受挤压变形≥1/3圆周且深度≥2mm' },
        { code: 'JATSC', name: '吐丝', category: 'C', standard: '烟丝长度≥4mm的≥1条' },
        { code: 'JZSTC', name: '滤嘴缩头', category: 'C', standard: '整个滤嘴截面下陷深度≥1mm' },
        { code: 'JQBQD', name: '切口不齐', category: 'D', standard: '切口锯齿状或有毛渣' },
        { code: 'JQXXC', name: '切口斜', category: 'C', standard: '高低差距≥2mm' },
        { code: 'JQPSC', name: '切口破', category: 'C', standard: '有划破或撕破长度≥3mm' },
        { code: 'JZMLC', name: '棉线露出', category: 'C', standard: '薄荷棉线在切口截面以外长度≥2mm' },
        { code: 'JZJKB', name: '胶孔', category: 'B', standard: '滤嘴端面有孔洞面积≥2mm²' },
        { code: 'JZGCD', name: '沟槽不均匀', category: 'D', standard: '沟槽孔径大小不一' },
        { code: 'JFZKC', name: '滤嘴中空深度不符', category: 'C', standard: '中空深度异常' },
        { code: 'JZWZB', name: '滤嘴污', category: 'B', standard: '污迹总面积≥1mm²' },
        { code: 'JQJZC', name: '端面夹杂', category: 'C', standard: '有非烟草类杂物夹入' },
        { code: 'JZSSC', name: '滤嘴生丝', category: 'C', standard: '白色丝束白点≥3点' },
        { code: 'JFXZB', name: '中空滤嘴形状不符', category: 'B', standard: '丝束断层或开裂' },
        { code: 'JZKDB', name: '孔洞', category: 'B', standard: '非胶孔的长边直径≥1mm' },
      ]
    },
    {
      location: '卷烟搭口',
      defects: [
        { code: 'JDJZC', name: '卷烟搭口夹杂', category: 'C', standard: '夹有非烟末类杂物' },
        { code: 'JDKZC', name: '烟支搭口宽窄不一', category: 'C', standard: '长短差≥2mm' },
        { code: 'JDBPB', name: '卷烟搭口翘褶', category: 'B', standard: '露出卷烟纸最宽长度≥1/4滤棒圆周' },
        { code: 'JDBKA', name: '爆口', category: 'A', standard: '90°扭转后爆开长度≥1/4烟支长度' },
        { code: 'JDHKB', name: '豁口', category: 'B', standard: '脱胶长度≥5mm' },
        { code: 'JDTJC', name: '烟支搭口焦黄', category: 'C', standard: '焦黄总长度≥10mm' },
        { code: 'JDZZC', name: '搭口皱', category: 'C', standard: '皱纹总长度及凹陷深度符合C区规定' },
        { code: 'JDWZC', name: '搭口污', category: 'C', standard: '污迹总面积≥6mm²' },
        { code: 'JDPSC', name: '搭口破', category: 'C', standard: '被划破、撕破长度≥3mm' },
        { code: 'JALQB', name: '漏气', category: 'B', standard: '滤棒与烟支接装不牢固' },
        { code: 'JSBQC', name: '水松纸粘贴不齐', category: 'C', standard: '上下有差牙，长短差≥2mm' },
        { code: 'JSDBD', name: '水松纸标示错位', category: 'D', standard: '字体图案少笔划或多笔划' },
        { code: 'JSFQB', name: '水松纸分切', category: 'B', standard: '分切宽度≤3/4倍滤棒圆周' },
        { code: 'JPFQD', name: '卷烟纸分切', category: 'D', standard: '切口不平齐，有锯齿形或毛渣' },
        { code: 'JDCWC', name: '卷烟纸搭口粘贴位置错误', category: 'C', standard: '搭接方向错误' },
      ]
    },
    {
      location: '卷烟钢印',
      defects: [
        { code: 'JGKPB', name: '钢印刻破', category: 'B', standard: '卷烟纸破开长度≥3mm' },
        { code: 'JGYCB', name: '钢印错无', category: 'B', standard: '牌号钢印用错或无' },
        { code: 'JGCQC', name: '钢印残缺', category: 'C', standard: '线条不完整不能识别' },
        { code: 'JGMHC', name: '钢印模糊', category: 'C', standard: '线条不清晰不能识别' },
        { code: 'JGWDC', name: '钢印污点', category: 'C', standard: '染有油墨，墨线长度≥1mm' },
        { code: 'JGYSC', name: '钢印颜色不符', category: 'C', standard: '钢印油墨用错' },
        { code: 'JGWZC', name: '钢印位置不对', category: 'C', standard: '间距异常或内置钢印外露' },
      ]
    },
    {
      location: '卷烟表面',
      defects: [
        { code: 'JPPSC', name: '破烟', category: 'C', standard: '表面破裂长度≥2mm且＜5mm' },
        { code: 'JPZYC', name: '卷烟纸皱', category: 'C', standard: '总长度及凹陷深度符合C区规定' },
        { code: 'JSZTC', name: '水松纸皱', category: 'C', standard: '总长度及凹陷深度符合C区规定' },
        { code: 'JAWZC', name: '卷烟表面污', category: 'C', standard: '污渍总面积≥6mm²' },
        { code: 'JFSSC', name: '水松纸式样不符', category: 'C', standard: '文字、图案错印、漏印' },
        { code: 'JFSCC', name: '水松纸色差', category: 'C', standard: '严重色差，或△E≥2.5' },
        { code: 'JFSTC', name: '水松纸拖墨', category: 'C', standard: '拖墨总面积≥6mm²' },
        { code: 'JFSYC', name: '水松纸印刷缺陷', category: 'C', standard: '严重模糊或残缺不全' },
        { code: 'JFSFC', name: '水松纸分切偏位', category: 'C', standard: '图案、文字距边偏差≥1mm' },
        { code: 'JFJWB', name: '卷烟纸外观不符', category: 'B', standard: '罗纹缺失' },
        { code: 'JPBDC', name: '布带印', category: 'C', standard: '由布带造成的明显针眼' },
        { code: 'JZBXD', name: '滤嘴挤压变形', category: 'D', standard: '受挤压变形明显' },
        { code: 'JSQPC', name: '水松纸起泡', category: 'C', standard: '贯通整个滤嘴的长条泡状' },
        { code: 'JSCDC', name: '水松纸长短', category: 'C', standard: '与标准长度差≥1mm' },
        { code: 'JPDYB', name: '卷烟纸多', category: 'B', standard: '带有盘间拼接卷烟纸' },
        { code: 'JSDYB', name: '水松纸多', category: 'B', standard: '带有盘间拼接水松纸' },
        { code: 'JSCHC', name: '水松纸擦痕', category: 'C', standard: '露出底色的划痕总长度≥1周' },
      ]
    },
    {
      location: '卷烟内部',
      defects: [
        { code: 'JAZWB', name: '杂物', category: 'B', standard: '内有塑料、铁器等非烟草类杂物' },
        { code: 'JKAXD', name: '烟支凹陷（软点）', category: 'D', standard: '手摸感觉部分区域偏软' },
        { code: 'JAZJD', name: '竹节烟', category: 'D', standard: '手摸感觉有明显松紧节' },
        { code: 'JZSRC', name: '滤嘴软', category: 'C', standard: '手摸滤嘴明显感觉偏软' },
        { code: 'JZJMD', name: '滤嘴夹烟末', category: 'D', standard: '水松纸与滤棒之间有可见烟末' },
        { code: 'JFBZB', name: '滤嘴内无爆珠', category: 'B', standard: '没有指定数量和要求的爆珠' },
        { code: 'JZBZB', name: '滤嘴内爆珠破损', category: 'B', standard: '爆珠不完整' },
        { code: 'JZPHC', name: '装接间隙（皮老虎）', category: 'C', standard: '结合处有间隙距离≥3mm' },
      ]
    },
    {
      location: '其他',
      defects: [
        { code: 'JACHB', name: '错牌混牌', category: 'B', standard: '烟支卷烟材料错用' },
        { code: 'JAZLC', name: '重量', category: 'C', standard: '检测值超限且超限值＞允差的50%' },
        { code: 'JAYZC', name: '圆周', category: 'C', standard: '检测值超限且超限值＞允差的50%' },
        { code: 'JAXZC', name: '吸阻', category: 'C', standard: '检测值超限且超限值＞允差的50%' },
        { code: 'JACDC', name: '长度', category: 'C', standard: '检测值超限且超限值＞允差的50%' },
        { code: 'JAZTC', name: '总通风度', category: 'C', standard: '检测值超限且超限值＞允差的50%' },
        { code: 'JALTC', name: '嘴通风度', category: 'C', standard: '检测值超限且超限值＞允差的50%' },
        { code: 'JAYDC', name: '硬度', category: 'C', standard: '检测值超限且超限值＞允差的50%' },
        { code: 'JASFB', name: '含水率', category: 'B', standard: '≤10.5%或≥13.5%' },
        { code: 'JAHMB', name: '含末率', category: 'B', standard: '超上限且超限值＞上限值的50%' },
        { code: 'JADLC', name: '端部落丝量', category: 'C', standard: '检测值≥15mg' },
        { code: 'JAXHA', name: '熄火', category: 'A', standard: '连续阴燃长度＜40mm' },
        { code: 'JAYRA', name: '引燃强度', category: 'A', standard: '熄火测试通过率≤75%' },
        { code: 'JAYSB', name: '压实端位置', category: 'B', standard: '绝对值＞8mm' },
      ]
    }
  ]
};

/**
 * 所有缺陷分类汇总
 */
export const ALL_DEFECT_CATEGORIES: DefectCategory[] = [
  BOX_DEFECTS,
  CARTON_DEFECTS,
  PACK_DEFECTS,
  CIGARETTE_DEFECTS
];

/**
 * 根据分类key获取缺陷库
 */
export function getDefectLibrary(key: string): DefectCategory | undefined {
  return ALL_DEFECT_CATEGORIES.find(cat => cat.key === key);
}

/**
 * 获取某个分类下的所有部位
 */
export function getLocations(categoryKey: string): string[] {
  const library = getDefectLibrary(categoryKey);
  return library?.locations.map(loc => loc.location) || [];
}

/**
 * 根据分类和部位获取缺陷列表
 */
export function getDefectsByLocation(categoryKey: string, location: string): DefectItem[] {
  const library = getDefectLibrary(categoryKey);
  const loc = library?.locations.find(l => l.location === location);
  return loc?.defects || [];
}
