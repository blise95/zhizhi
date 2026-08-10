package com.zjzy.quality.constant;

import java.util.*;

/**
 * 卷烟外在质量缺陷目录
 * 按QJ/ZY-GY.02-026-2023标准提取
 * 
 * 编码规则：5位编码 = 区域(1位) + 部位(1位) + 简称(2位) + 等级(1位)
 * 区域: X=箱装, T=条装, H=盒装, J=烟支
 */
public class DefectCatalog {

    public static class DefectEntry {
        public String code;      // 5位缺陷编码
        public String name;      // 缺陷名称
        public String bodyPart;  // 所属部位
        public String grade;     // 等级 A/B/C/D

        public DefectEntry(String code, String name, String bodyPart, String grade) {
            this.code = code;
            this.name = name;
            this.bodyPart = bodyPart;
            this.grade = grade;
        }
    }

    public static class ModuleDefects {
        public String module;                 // 模块名
        public List<String> bodyParts;        // 该模块下的部位列表
        public List<DefectEntry> defects;     // 所有缺陷

        public ModuleDefects(String module, List<String> bodyParts, List<DefectEntry> defects) {
            this.module = module;
            this.bodyParts = bodyParts;
            this.defects = defects;
        }

        /** 根据部位过滤缺陷 */
        public List<DefectEntry> getByBodyPart(String bodyPart) {
            List<DefectEntry> result = new ArrayList<>();
            for (DefectEntry d : defects) {
                if (d.bodyPart.equals(bodyPart)) result.add(d);
            }
            return result;
        }
    }

    // ==================== 静态目录 ====================

    public static final Map<String, ModuleDefects> CATALOG = new LinkedHashMap<>();

    static {
        // ---- 箱装 (X) ----
        initCase();
        // ---- 条装 (T) ----
        initStrip();
        // ---- 盒装 (H) ----
        initBox();
        // ---- 烟支 (J) ----
        initCigarette();
    }

    // ==================== 箱装 ====================
    private static void initCase() {
        String module = "箱装外观";
        List<String> parts = Arrays.asList("纸箱杂项", "纸箱", "胶带", "追溯标识");
        List<DefectEntry> list = new ArrayList<>();

        // 纸箱杂项
        add(list, "XXWNC", "纸箱未粘牢", "纸箱杂项", "C");
        add(list, "XXNNC", "纸箱内部粘牢", "纸箱杂项", "C");
        add(list, "XTCPA", "纸箱大条错装混装", "纸箱杂项", "A");
        add(list, "XTCPB", "纸箱大条错装混装(警图1组)", "纸箱杂项", "B");
        add(list, "XTCPC", "纸箱大条错装混装(警图>1组)", "纸箱杂项", "C");
        add(list, "XTQDA", "纸箱缺条多条", "纸箱杂项", "A");
        add(list, "XAJZC", "纸箱夹杂", "纸箱杂项", "C");
        add(list, "XFJZC", "纸箱来料夹杂", "纸箱杂项", "C");
        // 纸箱
        add(list, "XXPSC", "纸箱破残(≥20cm)", "纸箱", "C");
        add(list, "XXPSD", "纸箱破残(<20cm)", "纸箱", "D");
        add(list, "XXSSC", "纸箱损伤(致C类)", "纸箱", "C");
        add(list, "XXSSD", "纸箱损伤(致D类)", "纸箱", "D");
        add(list, "XXCYA", "纸箱错用", "纸箱", "A");
        add(list, "XXMBA", "纸箱霉变", "纸箱", "A");
        add(list, "XXWZC", "纸箱污(C区)", "纸箱", "C");
        add(list, "XXWZD", "纸箱污(D区)", "纸箱", "D");
        add(list, "XXZJC", "纸箱箱盖摺角", "纸箱", "C");
        add(list, "XFYSD", "纸箱印刷缺陷", "纸箱", "D");
        add(list, "XFSYC", "纸箱式样不符", "纸箱", "C");
        // 胶带
        add(list, "XJLDC", "纸箱漏底(无胶带)", "胶带", "C");
        add(list, "XJLDD", "纸箱漏底(断开)", "胶带", "D");
        add(list, "XJNJD", "纸箱胶带粘结异常", "胶带", "D");
        add(list, "XJCYD", "纸箱胶带错用", "胶带", "D");
        add(list, "XFJYD", "纸箱胶带式样不符", "胶带", "D");
        // 追溯标识
        add(list, "XMBWC", "标识无", "追溯标识", "C");
        add(list, "XMBCC", "标识错误", "追溯标识", "C");
        add(list, "XMGCB", "条件关联错误", "追溯标识", "B");

        CATALOG.put("case", new ModuleDefects(module, parts, list));
    }

    // ==================== 条装 ====================
    private static void initStrip() {
        String module = "条装外观";
        List<String> parts = Arrays.asList("条盒杂项", "拉线", "透明纸", "条盒纸", "钢印");
        List<DefectEntry> list = new ArrayList<>();

        // 条盒杂项
        add(list, "TAZZC", "条盒轧皱(≥30mm)", "条盒杂项", "C");
        add(list, "TAZZD", "条盒轧皱(20-30mm)", "条盒杂项", "D");
        add(list, "TAZPB", "条盒轧破(≥30mm)", "条盒杂项", "B");
        add(list, "TAZPC", "条盒轧破(<30mm)", "条盒杂项", "C");
        add(list, "THNNC", "条盒内部粘连", "条盒杂项", "C");
        add(list, "TBQBA", "条盒缺包", "条盒杂项", "A");
        add(list, "TBCPA", "条盒小包错装混装", "条盒杂项", "A");
        add(list, "TBCPB", "条盒小包错装混装(警图1组)", "条盒杂项", "B");
        add(list, "TBCPC", "条盒小包错装混装(警图>1组)", "条盒杂项", "C");
        add(list, "TAWZC", "条盒外夹杂(C区)", "条盒杂项", "C");
        add(list, "TAWZD", "条盒外夹杂(D区)", "条盒杂项", "D");
        add(list, "TANZC", "条盒内夹杂(C区)", "条盒杂项", "C");
        add(list, "TANZD", "条盒内夹杂(D区)", "条盒杂项", "D");
        add(list, "TAGCB", "盒条关联错误", "条盒杂项", "B");
        // 拉线
        add(list, "TLWWB", "拉线无", "拉线", "B");
        add(list, "TLCQC", "拉线残缺(≥10mm)", "拉线", "C");
        add(list, "TLCYC", "拉线错用", "拉线", "C");
        add(list, "TLDZC", "拉线倒置", "拉线", "C");
        add(list, "TLDKC", "拉线搭口错位(≥2mm)", "拉线", "C");
        add(list, "TLDKD", "拉线搭口错位(1-2mm)", "拉线", "D");
        add(list, "TLGDD", "拉线高低", "拉线", "D");
        add(list, "TLSLC", "拉线撕拉不畅(锯齿/轻抽)", "拉线", "C");
        add(list, "TLSLD", "拉线撕拉不畅(可抽出)", "拉线", "D");
        add(list, "TLQKC", "拉线切口切偏(切断)", "拉线", "C");
        add(list, "TLQKD", "拉线切口切偏(U形刀≥1/2宽)", "拉线", "D");
        add(list, "TFLKC", "拉线宽度不符(>0.5mm)", "拉线", "C");
        add(list, "TFLKD", "拉线宽度不符(0.1-0.5mm)", "拉线", "D");
        add(list, "TFLYD", "拉线印刷缺陷", "拉线", "D");
        // 透明纸
        add(list, "TTWWB", "透明纸无", "透明纸", "B");
        add(list, "TTDYC", "透明纸多(>1张)", "透明纸", "C");
        add(list, "TTCQB", "透明纸残缺(≥100mm²)", "透明纸", "B");
        add(list, "TTCQC", "透明纸残缺(25-100mm²)", "透明纸", "C");
        add(list, "TTZPB", "透明纸破(≥10mm)", "透明纸", "B");
        add(list, "TTZPC", "透明纸破(<10mm)", "透明纸", "C");
        add(list, "TTTPB", "透明纸烫破(≥10mm)", "透明纸", "B");
        add(list, "TTTPC", "透明纸烫破(5-10mm)", "透明纸", "C");
        add(list, "TTZZC", "透明纸皱(C区)", "透明纸", "C");
        add(list, "TTZZD", "透明纸皱(D区)", "透明纸", "D");
        add(list, "TTTZC", "透明纸烫皱(≥3/4面积)", "透明纸", "C");
        add(list, "TTTZD", "透明纸烫皱(≥1/2面积)", "透明纸", "D");
        add(list, "TTRKC", "透明纸热封不牢(≥60mm)", "透明纸", "C");
        add(list, "TTRKD", "透明纸热封不牢(10-60mm)", "透明纸", "D");
        add(list, "TTSJC", "透明纸松紧(余≥4mm/凹≥2mm)", "透明纸", "C");
        add(list, "TTSJD", "透明纸松紧(余2-4mm/凹1-2mm)", "透明纸", "D");
        add(list, "TTZWC", "透明纸污(≥5mm≥1处)", "透明纸", "C");
        add(list, "TTZWD", "透明纸污(<3处或<2mm≥3处)", "透明纸", "D");
        add(list, "TTHHC", "透明纸划痕(≥50mm×0.5mm≥5条)", "透明纸", "C");
        add(list, "TTHHD", "透明纸划痕(10-50mm×0.5mm≥5条)", "透明纸", "D");
        add(list, "TTZJC", "透明纸折角(≥10mm≥2个)", "透明纸", "C");
        add(list, "TTZJD", "透明纸折角(D区)", "透明纸", "D");
        add(list, "TTCDC", "透明纸长短(≤3mm)", "透明纸", "C");
        add(list, "TTCDD", "透明纸长短(3-5mm)", "透明纸", "D");
        add(list, "TTRBD", "透明纸热封变色", "透明纸", "D");
        add(list, "TTPJC", "透明纸拼接", "透明纸", "C");
        // 条盒纸
        add(list, "THWWA", "条盒纸无", "条盒纸", "A");
        add(list, "THCQB", "条盒纸残缺(≥1mm洞)", "条盒纸", "B");
        add(list, "THPSB", "条盒纸破(≥5mm)", "条盒纸", "B");
        add(list, "THPSC", "条盒纸破(<5mm)", "条盒纸", "C");
        add(list, "THCYA", "条盒纸错用", "条盒纸", "A");
        add(list, "THFBA", "条盒纸反包", "条盒纸", "A");
        add(list, "THZZC", "条盒纸皱(≥15mm)", "条盒纸", "C");
        add(list, "THZZD", "条盒纸皱(5-15mm)", "条盒纸", "D");
        add(list, "THYHC", "条盒纸压痕(深≥0.2mm)", "条盒纸", "C");
        add(list, "THYHD", "条盒纸压痕(深<0.2mm)", "条盒纸", "D");
        add(list, "THCSC", "条盒纸擦伤(≥6mm)", "条盒纸", "C");
        add(list, "THCSD", "条盒纸擦伤(3-6mm)", "条盒纸", "D");
        add(list, "THWZC", "条盒纸污(≥5mm≥1处)", "条盒纸", "C");
        add(list, "THWZD", "条盒纸污(<5mm≥3处)", "条盒纸", "D");
        add(list, "THDYC", "条盒纸多(>1张)", "条盒纸", "C");
        add(list, "THZDC", "条盒纸折叠不到位(≥1mm)", "条盒纸", "C");
        add(list, "THZDD", "条盒纸折叠不到位(≥0.5mm)", "条盒纸", "D");
        add(list, "THBMC", "条盒纸爆墨(C区)", "条盒纸", "C");
        add(list, "THBMD", "条盒纸爆墨(D区)", "条盒纸", "D");
        add(list, "THBKC", "条盒纸粘接不牢(爆开)", "条盒纸", "C");
        add(list, "THBKD", "条盒纸粘接不牢(部分)", "条盒纸", "D");
        add(list, "THQZC", "条盒纸翘折(≥5mm)", "条盒纸", "C");
        add(list, "THQZD", "条盒纸翘折(2-5mm)", "条盒纸", "D");
        add(list, "TFHSA", "条盒纸样式不符", "条盒纸", "A");
        // 钢印
        add(list, "TGWWC", "钢印错无", "钢印", "C");
        add(list, "TGQHD", "钢印缺或糊", "钢印", "D");
        add(list, "TGKPC", "钢印刻破(无法辨识)", "钢印", "C");
        add(list, "TGKPD", "钢印刻破(可辨识)", "钢印", "D");

        CATALOG.put("carton", new ModuleDefects(module, parts, list));
    }

    // ==================== 盒装 ====================
    private static void initBox() {
        String module = "盒装外观";
        List<String> parts = Arrays.asList("小盒杂项","拉线","透明纸","框架纸","商标纸","内衬纸","烟支填装","钢印");
        List<DefectEntry> list = new ArrayList<>();

        // 小盒杂项
        add(list, "HAZZB", "小盒轧皱(≥10mm)", "小盒杂项", "B");
        add(list, "HAZZC", "小盒轧皱(5-10mm)", "小盒杂项", "C");
        add(list, "HAZPB", "小盒轧破(≥5mm)", "小盒杂项", "B");
        add(list, "HAWLC", "小盒外部粘连(拉不开)", "小盒杂项", "C");
        add(list, "HAWLD", "小盒外部粘连(可分离)", "小盒杂项", "D");
        add(list, "HANJB", "小盒内部未粘牢(无胶)", "小盒杂项", "B");
        add(list, "HANJC", "小盒内部未粘牢(少胶)", "小盒杂项", "C");
        add(list, "HAJZB", "小盒外夹杂(≥5mm≥2处)", "小盒杂项", "B");
        add(list, "HAJZC", "小盒外夹杂(≥2mm≥1处)", "小盒杂项", "C");
        add(list, "HAJZD", "小盒外夹杂(烟末3-10点)", "小盒杂项", "D");
        add(list, "HANZB", "小盒内夹杂(≥5mm)", "小盒杂项", "B");
        add(list, "HANZC", "小盒内夹杂(2-5mm)", "小盒杂项", "C");
        add(list, "HAWXC", "小盒外形不方正(≥3mm)", "小盒杂项", "C");
        add(list, "HAWXD", "小盒外形不方正(1-3mm)", "小盒杂项", "D");
        add(list, "HAXFC", "透明纸吸附商标纸(≥200mm²)", "小盒杂项", "C");
        add(list, "HAXFD", "透明纸吸附商标纸(25-200mm²)", "小盒杂项", "D");
        // 拉线
        add(list, "HLCHB", "拉线无", "拉线", "B");
        add(list, "HLCYC", "拉线错用", "拉线", "C");
        add(list, "HLCQB", "拉线残缺(≥10mm)", "拉线", "B");
        add(list, "HLCQC", "拉线残缺(5-10mm)", "拉线", "C");
        add(list, "HLLZC", "拉线皱(≥10mm≥10处)", "拉线", "C");
        add(list, "HLLZD", "拉线皱(<10处)", "拉线", "D");
        add(list, "HLZFD", "拉线字体反向", "拉线", "D");
        add(list, "HLDZB", "拉线倒置", "拉线", "B");
        add(list, "HLDKC", "拉线搭口错位(≥1mm)", "拉线", "C");
        add(list, "HLDKD", "拉线搭口错位(<1mm)", "拉线", "D");
        add(list, "HLQKC", "拉线切口切偏(切断)", "拉线", "C");
        add(list, "HLQKD", "拉线切口切偏(U形≥1/2宽)", "拉线", "D");
        add(list, "HLGDD", "拉线高低", "拉线", "D");
        add(list, "HLSLB", "拉线撕拉不畅(拉不开)", "拉线", "B");
        add(list, "HLSLC", "拉线撕拉不畅(锯齿/轻抽)", "拉线", "C");
        add(list, "HFLKC", "拉线宽度不符(>0.5mm)", "拉线", "C");
        add(list, "HFLKD", "拉线宽度不符(0.1-0.5mm)", "拉线", "D");
        add(list, "HFLYD", "拉线印刷缺陷", "拉线", "D");
        // 透明纸
        add(list, "HTWWA", "透明纸无", "透明纸", "A");
        add(list, "HTCQA", "透明纸残缺(≥100mm²)", "透明纸", "A");
        add(list, "HTCQB", "透明纸残缺(25-100mm²)", "透明纸", "B");
        add(list, "HTDYC", "透明纸多(>1张)", "透明纸", "C");
        add(list, "HTPSB", "透明纸破(≥10mm)", "透明纸", "B");
        add(list, "HTPSC", "透明纸破(<10mm)", "透明纸", "C");
        add(list, "HTTPB", "透明纸烫破(≥10mm)", "透明纸", "B");
        add(list, "HTTPC", "透明纸烫破(1-10mm)", "透明纸", "C");
        add(list, "HTZZC", "透明纸皱(C区)", "透明纸", "C");
        add(list, "HTZZD", "透明纸皱(D区)", "透明纸", "D");
        add(list, "HTTZC", "透明纸烫皱(≥3/4面积)", "透明纸", "C");
        add(list, "HTTZD", "透明纸烫皱(≥1/2面积)", "透明纸", "D");
        add(list, "HTRKC", "透明纸热封不牢(≥5mm)", "透明纸", "C");
        add(list, "HTRKD", "透明纸热封不牢(<5mm)", "透明纸", "D");
        add(list, "HTSJC", "透明纸松紧(余≥3mm/凹≥1mm)", "透明纸", "C");
        add(list, "HTSJD", "透明纸松紧(余2-3mm/凹0.5-1mm)", "透明纸", "D");
        add(list, "HTWZC", "透明纸污(≥3mm)", "透明纸", "C");
        add(list, "HTWZD", "透明纸污(<3mm)", "透明纸", "D");
        add(list, "HTHHC", "透明纸划痕(≥50mm×0.5mm≥3条)", "透明纸", "C");
        add(list, "HTHHD", "透明纸划痕(10-50mm×0.3-0.5mm≥3条)", "透明纸", "D");
        add(list, "HTCMC", "透明纸超平面(≥2mm)", "透明纸", "C");
        add(list, "HTCMD", "透明纸超平面(<2mm)", "透明纸", "D");
        add(list, "HTDHB", "透明纸倒包", "透明纸", "B");
        add(list, "HTZJC", "透明纸折角(C区)", "透明纸", "C");
        add(list, "HTZJD", "透明纸折角(D区)", "透明纸", "D");
        add(list, "HTCDC", "透明纸长短(≤4mm)", "透明纸", "C");
        add(list, "HTCDD", "透明纸长短(4-5mm)", "透明纸", "D");
        add(list, "HTPJC", "透明纸拼接", "透明纸", "C");
        // 框架纸
        add(list, "HKWWB", "框架纸无", "框架纸", "B");
        add(list, "HKCQB", "框架纸残缺(≥100mm²)", "框架纸", "B");
        add(list, "HKCQC", "框架纸残缺(25-100mm²)", "框架纸", "C");
        add(list, "HKPSC", "框架纸破(≥5mm)", "框架纸", "C");
        add(list, "HKPSD", "框架纸破(1-5mm)", "框架纸", "D");
        add(list, "HKLCC", "框架纸露", "框架纸", "C");
        add(list, "HKCYC", "框架纸错用", "框架纸", "C");
        add(list, "HKZZC", "框架纸皱(≥10mm/≥1/2面积)", "框架纸", "C");
        add(list, "HKZZD", "框架纸皱(<10mm/≥1/4面积)", "框架纸", "D");
        add(list, "HKWZC", "框架纸污(≥5mm≥2处)", "框架纸", "C");
        add(list, "HKWZD", "框架纸污(<2处或<5mm≥2处)", "框架纸", "D");
        add(list, "HKPJB", "框架纸拼接", "框架纸", "B");
        add(list, "HKMCD", "框架纸毛刺", "框架纸", "D");
        add(list, "HKKKC", "框架纸卡口(≤52mm)", "框架纸", "C");
        add(list, "HKKKD", "框架纸卡口(53mm)", "框架纸", "D");
        add(list, "HKKBD", "框架纸卡边", "框架纸", "D");
        add(list, "HKWPC", "框架纸偏位(≥2mm)", "框架纸", "C");
        add(list, "HKWPD", "框架纸偏位(>1mm)", "框架纸", "D");
        add(list, "HFKSC", "框架纸式样不符", "框架纸", "C");
        // 商标纸
        add(list, "HSWWA", "商标纸无", "商标纸", "A");
        add(list, "HSCQB", "商标纸残缺(≥25mm²)", "商标纸", "B");
        add(list, "HSCQC", "商标纸残缺(5-25mm²)", "商标纸", "C");
        add(list, "HSPSB", "商标纸破(≥10mm)", "商标纸", "B");
        add(list, "HSPSC", "商标纸破(1-10mm)", "商标纸", "C");
        add(list, "HSCYA", "商标纸错用", "商标纸", "A");
        add(list, "HSFBA", "商标纸反包", "商标纸", "A");
        add(list, "HSZZC", "商标纸皱(≥10mm/≥1/2面积)", "商标纸", "C");
        add(list, "HSZZD", "商标纸皱(5-10mm/≥1/4面积)", "商标纸", "D");
        add(list, "HSYHC", "商标纸压痕(深≥0.2mm)", "商标纸", "C");
        add(list, "HSYHD", "商标纸压痕(深<0.2mm)", "商标纸", "D");
        add(list, "HSCSC", "商标纸擦伤(≥6mm)", "商标纸", "C");
        add(list, "HSCSD", "商标纸擦伤(3-6mm或<3mm≥2点)", "商标纸", "D");
        add(list, "HSWZC", "商标纸污(C区)", "商标纸", "C");
        add(list, "HSWZD", "商标纸污(D区)", "商标纸", "D");
        add(list, "HSDYC", "商标纸多(>1张)", "商标纸", "C");
        add(list, "HSBMC", "商标纸爆墨(≥5mm≥3点)", "商标纸", "C");
        add(list, "HSBMD", "商标纸爆墨(轻)", "商标纸", "D");
        add(list, "HSBKB", "商标纸爆壳(爆开)", "商标纸", "B");
        add(list, "HSBKC", "商标纸爆壳(>1/3)", "商标纸", "C");
        add(list, "HSXLC", "商标纸斜角露白(≥2mm)", "商标纸", "C");
        add(list, "HSXLD", "商标纸斜角露白(1-2mm)", "商标纸", "D");
        add(list, "HSQBB", "商标纸翘边(≥15mm)", "商标纸", "B");
        add(list, "HSQBC", "商标纸翘边(<15mm)", "商标纸", "C");
        add(list, "HSZDB", "商标纸折叠不到位(B)", "商标纸", "B");
        add(list, "HSZDC", "商标纸折叠不到位(C)", "商标纸", "C");
        add(list, "HSZDD", "商标纸长短边弯折", "商标纸", "D");
        add(list, "HSGNB", "盒盖粘连(破损)", "商标纸", "B");
        add(list, "HSGNC", "盒盖粘连(胶迹)", "商标纸", "C");
        add(list, "HFSSA", "商标纸式样不符", "商标纸", "A");
        // 内衬纸
        add(list, "HCWWB", "内衬纸无", "内衬纸", "B");
        add(list, "HCCQB", "内衬纸残缺(≥100mm²)", "内衬纸", "B");
        add(list, "HCCQC", "内衬纸残缺(25-100mm²)", "内衬纸", "C");
        add(list, "HCPSB", "内衬纸破(≥5mm)", "内衬纸", "B");
        add(list, "HCPSC", "内衬纸破(1-5mm)", "内衬纸", "C");
        add(list, "HCCYB", "内衬纸错用", "内衬纸", "B");
        add(list, "HCZZC", "内衬纸皱(C区)", "内衬纸", "C");
        add(list, "HCZZD", "内衬纸皱(D区)", "内衬纸", "D");
        add(list, "HCWZC", "内衬纸污(≥5mm≥1处)", "内衬纸", "C");
        add(list, "HCWZD", "内衬纸污(<5mm≥2处)", "内衬纸", "D");
        add(list, "HCPJB", "内衬纸拼接", "内衬纸", "B");
        add(list, "HCCDC", "内衬纸长短(≥21/≤10mm)", "内衬纸", "C");
        add(list, "HCCDD", "内衬纸长短(18-21/10-13mm)", "内衬纸", "D");
        add(list, "HCZJB", "内衬纸折叠不到位(露烟)", "内衬纸", "B");
        add(list, "HCZJC", "内衬纸折叠不到位(未露烟)", "内衬纸", "C");
        add(list, "HCDJB", "内衬纸搭接无重叠", "内衬纸", "B");
        add(list, "HCLQD", "内衬纸印字利群切割", "内衬纸", "D");
        // 烟支填装
        add(list, "HJQYA", "缺支(<20支)", "烟支填装", "A");
        add(list, "HJDZB", "倒支", "烟支填装", "B");
        add(list, "HADYA", "多支(>20支)", "烟支填装", "A");
        add(list, "HJPLD", "烟支排列不齐", "烟支填装", "D");
        add(list, "HJCPA", "错支", "烟支填装", "A");
        add(list, "HADZA", "短支(≥5mm)", "烟支填装", "A");
        add(list, "HACZA", "残支(破裂≥5mm)", "烟支填装", "A");
        add(list, "HAGDB", "轧坏烟", "烟支填装", "B");
        add(list, "HANLB", "小盒烟支粘连", "烟支填装", "B");
        add(list, "HALTA", "滤嘴脱落", "烟支填装", "A");
        add(list, "HASTB", "烟支缩头(≥1mm)", "烟支填装", "B");
        add(list, "HANMD", "烟支粘末(≥10点)", "烟支填装", "D");
        add(list, "HACYA", "虫烟", "烟支填装", "A");
        // 钢印
        add(list, "HGWWC", "钢印错无", "钢印", "C");
        add(list, "HGCQC", "钢印残缺(无法辨识)", "钢印", "C");
        add(list, "HGCQD", "钢印残缺(可辨识)", "钢印", "D");
        add(list, "HGHHC", "钢印糊(无法辨识)", "钢印", "C");
        add(list, "HGHHD", "钢印糊(可辨识)", "钢印", "D");
        add(list, "HGKPC", "钢印刻破(无法辨识)", "钢印", "C");
        add(list, "HGKPD", "钢印刻破(可辨识)", "钢印", "D");
        add(list, "HGWZC", "钢印位置(C)", "钢印", "C");
        add(list, "HGWZD", "钢印位置(D)", "钢印", "D");

        CATALOG.put("boxSmall", new ModuleDefects(module, parts, list));
    }

    // ==================== 烟支 ====================
    private static void initCigarette() {
        String module = "烟支外观";
        List<String> parts = Arrays.asList("卷烟端面","卷烟搭口","卷烟表面","钢印","内部/其他");
        List<DefectEntry> list = new ArrayList<>();

        // 端面
        add(list, "JKKTB", "空头(深≥5mm且≥2/3截面)", "卷烟端面", "B");
        add(list, "JKKTC", "空头(深1-5mm且≥2/3截面)", "卷烟端面", "C");
        add(list, "JACTC", "触头(挤压≥1/3圆周深≥2mm)", "卷烟端面", "C");
        add(list, "JATSC", "吐丝(≥4mm≥1条或2-4mm≥2条)", "卷烟端面", "C");
        add(list, "JATSD", "吐丝(2-4mm有1条)", "卷烟端面", "D");
        add(list, "JZSTC", "滤嘴缩头(深≥1mm)", "卷烟端面", "C");
        add(list, "JZSTD", "滤嘴缩头(深0.5-1mm)", "卷烟端面", "D");
        add(list, "JQBQD", "切口不齐(锯齿/毛渣)", "卷烟端面", "D");
        add(list, "JQXXC", "切口斜(高低≥2mm)", "卷烟端面", "C");
        add(list, "JQXXD", "切口斜(高低0.5-2mm)", "卷烟端面", "D");
        add(list, "JQPSC", "切口破(3-5mm)", "卷烟端面", "C");
        add(list, "JQPSD", "切口破(<3mm)", "卷烟端面", "D");
        add(list, "JZMLC", "棉线露出(≥2mm)", "卷烟端面", "C");
        add(list, "JZMLD", "棉线露出(1-2mm)", "卷烟端面", "D");
        add(list, "JZJKB", "胶孔(≥2mm²)", "卷烟端面", "B");
        add(list, "JZJKC", "胶孔(<2mm²)", "卷烟端面", "C");
        add(list, "JZGCD", "沟槽不均匀", "卷烟端面", "D");
        add(list, "JZWZB", "滤嘴污(≥1mm²)", "卷烟端面", "B");
        add(list, "JZWZC", "滤嘴污(<1mm²)", "卷烟端面", "C");
        add(list, "JQJZC", "端面夹杂(非烟草)", "卷烟端面", "C");
        add(list, "JQJZD", "端面夹杂(烟草类)", "卷烟端面", "D");
        add(list, "JZSSC", "滤嘴生丝(≥3点)", "卷烟端面", "C");
        add(list, "JZSSD", "滤嘴生丝(<3点)", "卷烟端面", "D");
        add(list, "JFXZB", "中空滤嘴形状不符(断层)", "卷烟端面", "B");
        add(list, "JFXZC", "中空滤嘴形状不符(钝角)", "卷烟端面", "C");
        add(list, "JFXZD", "中空滤嘴形状不符(毛刺)", "卷烟端面", "D");
        add(list, "JZKDB", "孔洞(≥1mm)", "卷烟端面", "B");
        add(list, "JZKDC", "孔洞(0.7-1mm)", "卷烟端面", "C");
        // 搭口
        add(list, "JDJZC", "卷烟搭口夹杂(非烟末/≥4mm)", "卷烟搭口", "C");
        add(list, "JDJZD", "卷烟搭口夹杂(烟末<4mm)", "卷烟搭口", "D");
        add(list, "JDKZC", "搭口宽窄不一(≥2mm)", "卷烟搭口", "C");
        add(list, "JDKZD", "搭口宽窄不一(0.5-2mm)", "卷烟搭口", "D");
        add(list, "JDBPB", "搭口翘褶(露≥1/4圆周)", "卷烟搭口", "B");
        add(list, "JDBPC", "搭口翘褶(露<1/4圆周)", "卷烟搭口", "C");
        add(list, "JDBPD", "搭口翘褶(未露纸)", "卷烟搭口", "D");
        add(list, "JDBKA", "爆口(≥1/4长度)", "卷烟搭口", "A");
        add(list, "JDHKB", "豁口(脱胶≥5mm)", "卷烟搭口", "B");
        add(list, "JDHKC", "豁口(脱胶2-5mm)", "卷烟搭口", "C");
        add(list, "JDTJC", "搭口焦黄(≥10mm)", "卷烟搭口", "C");
        add(list, "JDTJD", "搭口焦黄(<10mm)", "卷烟搭口", "D");
        add(list, "JDZZC", "搭口皱(C区)", "卷烟搭口", "C");
        add(list, "JDZZD", "搭口皱(D区)", "卷烟搭口", "D");
        add(list, "JDWZC", "搭口污(≥6mm²)", "卷烟搭口", "C");
        add(list, "JDWZD", "搭口污(1-6mm²)", "卷烟搭口", "D");
        add(list, "JDPSC", "搭口破(3-5mm)", "卷烟搭口", "C");
        add(list, "JDPSD", "搭口破(<3mm)", "卷烟搭口", "D");
        add(list, "JALQB", "漏气(光滑无胶)", "卷烟搭口", "B");
        add(list, "JALQC", "漏气(有毛渣/胶)", "卷烟搭口", "C");
        add(list, "JSBQC", "水松纸粘贴不齐(≥2mm)", "卷烟搭口", "C");
        add(list, "JSBQD", "水松纸粘贴不齐(0.5-2mm)", "卷烟搭口", "D");
        // 表面
        add(list, "JPPSC", "破烟(2-5mm)", "卷烟表面", "C");
        add(list, "JPPSD", "破烟(<2mm)", "卷烟表面", "D");
        add(list, "JPZYC", "卷烟纸皱(C区)", "卷烟表面", "C");
        add(list, "JPZYD", "卷烟纸皱(D区)", "卷烟表面", "D");
        add(list, "JSZTC", "水松纸皱(C区)", "卷烟表面", "C");
        add(list, "JSZTD", "水松纸皱(D区)", "卷烟表面", "D");
        add(list, "JAWZC", "卷烟表面污(≥6mm²)", "卷烟表面", "C");
        add(list, "JAWZD", "卷烟表面污(1-6mm²)", "卷烟表面", "D");
        // 钢印
        add(list, "JGKPB", "钢印刻破(3-5mm)", "钢印", "B");
        add(list, "JGKPC", "钢印刻破(<3mm)", "钢印", "C");
        add(list, "JGYCB", "钢印错无(牌号)", "钢印", "B");
        add(list, "JGYCC", "钢印错无(编码)", "钢印", "C");
        add(list, "JGCQC", "钢印残缺(无法识别)", "钢印", "C");
        add(list, "JGCQD", "钢印残缺(可识别)", "钢印", "D");
        add(list, "JGMHC", "钢印模糊(无法识别)", "钢印", "C");
        add(list, "JGMHD", "钢印模糊(可识别)", "钢印", "D");
        add(list, "JGWDC", "钢印污点(≥1mm)", "钢印", "C");
        add(list, "JGWDD", "钢印污点(0.5-1mm/≤2点)", "钢印", "D");
        add(list, "JGYSC", "钢印颜色不符(用错)", "钢印", "C");
        add(list, "JGYSD", "钢印颜色不符(浓淡)", "钢印", "D");
        add(list, "JGWZC", "钢印位置不对(C)", "钢印", "C");
        add(list, "JGWZD", "钢印位置不对(D)", "钢印", "D");
        // 内部/其他
        add(list, "JAZWB", "杂物(塑料/铁器)", "内部/其他", "B");
        add(list, "JAZWC", "杂物(纸屑/梗签)", "内部/其他", "C");
        add(list, "JKAXD", "烟支凹陷(软点)", "内部/其他", "D");
        add(list, "JAZJD", "竹节烟", "内部/其他", "D");
        add(list, "JZSRC", "滤嘴软", "内部/其他", "C");
        add(list, "JZJMD", "滤嘴夹烟末", "内部/其他", "D");
        add(list, "JFBZB", "滤嘴内无爆珠", "内部/其他", "B");
        add(list, "JZBZB", "滤嘴内爆珠破损", "内部/其他", "B");
        add(list, "JZPHC", "装接间隙(≥3mm)", "内部/其他", "C");
        add(list, "JZPHD", "装接间隙(1-3mm)", "内部/其他", "D");
        add(list, "JACHB", "错牌混牌", "内部/其他", "B");

        CATALOG.put("cigarette", new ModuleDefects(module, parts, list));
    }

    // ==================== 辅助方法 ====================

    private static void add(List<DefectEntry> list, String code, String name, String bodyPart, String grade) {
        list.add(new DefectEntry(code, name, bodyPart, grade));
    }

    /** 获取缺陷目录JSON供前端使用 */
    public static Map<String, Object> getCatalogForFrontend() {
        Map<String, Object> result = new LinkedHashMap<>();
        for (Map.Entry<String, ModuleDefects> entry : CATALOG.entrySet()) {
            String key = entry.getKey();
            ModuleDefects md = entry.getValue();
            Map<String, Object> moduleData = new LinkedHashMap<>();
            moduleData.put("module", md.module);
            moduleData.put("bodyParts", md.bodyParts);

            // 按部位组织缺陷
            Map<String, List<Map<String, String>>> partsMap = new LinkedHashMap<>();
            for (String bp : md.bodyParts) {
                List<Map<String, String>> defects = new ArrayList<>();
                for (DefectEntry d : md.defects) {
                    if (d.bodyPart.equals(bp)) {
                        Map<String, String> item = new LinkedHashMap<>();
                        item.put("code", d.code);
                        item.put("name", d.name);
                        item.put("grade", d.grade);
                        defects.add(item);
                    }
                }
                partsMap.put(bp, defects);
            }
            moduleData.put("defectsByPart", partsMap);
            result.put(key, moduleData);
        }
        return result;
    }
}
