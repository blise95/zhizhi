"""
智合 AI 智能问题解析引擎

核心能力：
1. 同义词/同义表达识别 —— 用户不同表达方式都能理解
2. 关键词位置/语序无关匹配 —— 不管关键词在哪里都能识别
3. 语义理解与意图识别 —— 自动判断用户想查什么
4. 实体提取 —— 牌号、机台、班别、指标名称等
5. 结构化输出 —— 将自然语言转为可执行的查询条件

设计原则：
- 宽进严出：宁可多匹配（后续数据不足时明确告知），不可漏匹配
- 数据驱动：所有识别必须关联系统真实数据字段
- 不编造：无法识别的明确告知，不猜测用户意图
"""
import re
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional, Tuple, Set
from dataclasses import dataclass, field

from core.physical_standard import get_all_brands, normalize_indicator_key


# ==================== 同义词词典 ====================

# 时间范围同义词 → 标准化 key
TIME_SYNONYMS: Dict[str, List[str]] = {
    "today":      ["今天", "今日", "当天", "本日"],
    "yesterday":  ["昨天", "昨日"],
    "this_week":  ["本周", "这周", "这一周"],
    "last_week":  ["上周", "上一周"],
    "this_month": ["本月", "这个月", "本月度"],
    "last_month": ["上月", "上个月", "上月度"],
    "recent":     ["最近", "近期", "近来", "近期以来"],
    "today_quality_status": [],  # 特殊：单独处理"今天质量"类表达
}

# 「过去七天」类相对天数（须在「最近」之前匹配，避免被当成 30 天）
_CN_DAY_NUM = {
    "一": 1, "二": 2, "两": 2, "三": 3, "四": 4, "五": 5,
    "六": 6, "七": 7, "八": 8, "九": 9, "十": 10,
    "十五": 15, "二十": 20, "三十": 30,
}


def _cn_to_int(token: str) -> Optional[int]:
    if token.isdigit():
        n = int(token)
        return n if 1 <= n <= 90 else None
    return _CN_DAY_NUM.get(token)


def match_relative_days(text: str) -> Optional[Tuple[int, str]]:
    """识别「过去七天 / 近7天 / 最近一周」等，返回 (天数, 原文片段)。"""
    if not text:
        return None
    compact = re.sub(r"\s+", "", text.lower())
    week = re.search(r"(过去|近|最近)一?周", compact)
    if week:
        return 7, week.group(0)
    days = re.search(r"(过去|近|最近|前)(\d+|[一二两三四五六七八九十]+)天", compact)
    if days:
        n = _cn_to_int(days.group(2))
        if n:
            return n, days.group(0)
    return None

# 质量状态/指标同义词 → 系统字段映射
INDICATOR_SYNONYMS: Dict[str, List[str]] = {
    # 过程质量指标
    "defect_rate":       ["缺陷率", "不合格率", "次品率"],
    "defect_count":      ["缺陷数量", "缺陷数", "缺陷个数", "缺陷总数", "缺陷数目"],
    "qualified_rate":    ["优质率", "合格率", "一次合格率", "一次通过率", "合格比例", "优质品率"],
    "batch_count":       ["批次", "批次数", "检验批数", "生产批次"],
    "quality_status":    ["质量情况", "质量状况", "质量状态", "质量表现", "质量水平",
                          "整体质量", "整体情况", "整体状况", "整体表现", "总体质量",
                          "总体情况", "总体状况", "总体表现", "质量怎么样", "质量如何",
                          "质量好不好", "质量行不行", "质量咋样", "质量怎样"],

    # 烟支物测指标（中文）
    "length":            ["烟支长度", "支长", "长度", "烟支长短"],
    "circumference":     ["圆周", "周长", "烟支圆周", "圆周长", "圆周值"],
    "draw_resistance":   ["吸阻", "吸阻值", "抽吸阻力", "阻力值", "吸气阻力"],
    "weight":            ["重量", "单支重量", "重量值", "单重", "烟支重量"],
    "ventilation":       ["通风度", "通风率", "通风", "透气度", "透气率"],

    # 统计聚合词
    "ranking":           ["排名", "排行", "排序", "第几", "哪个好", "哪个差", "最好", "最差",
                          "最高", "最低", "前三", "后三", "top", "TOP"],
    "trend":             ["趋势", "变化", "走势", "升降", "上升", "下降", "波动",
                          "有没有下降", "是不是下降了", "是否下降", "变好了", "变差了",
                          "变好", "变差", "越来越", "改善", "恶化"],
    "focus":             ["关注", "注意", "重点", "警惕", "需要看", "需要盯", "有问题",
                          "异常", "不稳定", "波动大"],
    "reason":            ["原因", "为什么", "为啥", "怎么回事", "什么原因", "为什么变",
                          "为何", "怎么会", "因素", "根源", "根因"],
    "comparison":        ["对比", "比较", "差别", "差异", "区别", "相差"],
}

# 意图分类关键词（用于意图权重计算）
INTENT_KEYWORDS: Dict[str, List[str]] = {
    # 查询类
    "query_today": [
        "今天", "今日", "当天", "本日",
        # 注意："怎么样"/"如何"/"咋样"/"怎样" 不单独作为机台/牌号查询冲突词
        # 它们通过 quality_status 间接关联
        "质量情况", "质量状况", "质量表现",
        "整体质量", "总体质量",
        "质量怎么样", "质量如何", "质量咋样", "质量怎样",
    ],
    "query_machine_focus": [
        "重点关注", "需要关注", "关注", "注意", "重点机台",
        "哪个机台", "哪台机", "哪台机器", "哪台设备",
        "机台质量", "机台情况", "机台状况",
        "有问题", "异常", "不稳定",
        # 机台编号+查询词模式：通过 _extract_machines 提取后由规则7处理
        # 同时在这里增加通用匹配
        "机台",  # 单独"机台"词也匹配，配合数字/编号可识别
    ],
    "query_machine_best": [
        "最好", "最佳", "最优", "第一", "冠军", "榜首",
        "质量最好", "最好的机台", "最佳机台", "排名靠前",
    ],
    "query_machine_worst": [
        "最差", "最坏", "倒数", "最后", "垫底",
        "质量最差", "最差的机台", "排名靠后", "问题最多",
    ],
    "query_brand_trend": [
        "牌号", "品牌", "趋势", "变化", "走势",
        "下降", "上升", "波动", "有没有下降", "质量趋势",
        "摩登", "细支", "超细", "中东", "吉布提", "国际",
    ],
    "query_quality_decline": [
        "为什么下降", "下降原因", "为什么变差", "质量下降",
        "变差了", "恶化", "越来越差", "质量问题", "质量不好",
        "怎么下降了", "为何下降", "什么原因导致下降",
    ],
    "query_physical_deviation": [
        "偏离", "超标", "不合格", "合格吗", "偏离标准",
        "哪个物测指标", "物测情况", "物测结果", "检测结果",
        "合不合格", "达不达标", "符合标准", "标准符合性",
        "偏大", "偏小", "偏高", "偏低", "超出范围",
    ],
    "query_physical_standard": [
        "标准", "规格", "范围", "上限", "下限", "多少",
        "标准值", "标准是多少", "标准范围", "允差", "公差",
        "要求", "规定", "技术要求", "技术条件",
    ],
    "query_defect_detail": [
        "缺陷", "缺陷数量", "什么缺陷", "哪些缺陷",
        "主要缺陷", "缺陷类型", "缺陷分布",
        "有什么问题", "出了什么问题", "问题在哪",
    ],
    "query_rate": [
        "率", "比例", "百分比", "%", "占比",
        "优质率", "合格率", "缺陷率", "不合格率",
        "优等品率", "一等品率", "二等品率",
    ],
    "query_rating_standard": [
        "优等品", "一等品", "二等品", "不合格品",
        "分值线", "评级规定", "累计扣分", "产品评级",
        "几等品", "质量评级", "扣多少分",
        "合格产品", "评级办法",
    ],
    "query_batch_rating": [
        "这个批次", "该批次", "本批次", "批次为什么",
        "为什么是优等", "为什么是一等", "为什么是二等",
        "为什么不合格", "批次评级", "批次等级",
    ],
    "query_defect_standard": [
        "怎么判定", "如何判定", "判定标准", "缺陷判定",
        "缺陷代码", "属于什么等级", "A类缺陷", "B类缺陷",
        "C类缺陷", "D类缺陷", "严重缺陷", "较重缺陷",
        "一般缺陷", "轻微缺陷",
    ],
}


# ==================== 数据结构 ====================

@dataclass
class ParsedQuestion:
    """解析后的结构化问题"""
    raw: str                              # 原始问题
    normalized: str                       # 标准化后的问题（小写+去空格）

    # 时间信息
    time_intent: str = ""                 # today / yesterday / this_week / ...
    date_from: Optional[str] = None
    date_to: Optional[str] = None

    # 实体信息
    brands: List[str] = field(default_factory=list)      # 提取的牌号
    machines: List[str] = field(default_factory=list)    # 提取的机台
    shifts: List[str] = field(default_factory=list)      # 提取的班别
    indicators: List[str] = field(default_factory=list)  # 提取的指标（标准化key）

    # 指标原始名（保留用户原始用词，用于答案生成）
    indicator_names: List[str] = field(default_factory=list)

    # 意图信息
    primary_intent: str = ""              # 主意图
    intent_confidence: float = 0.0        # 置信度 0~1
    secondary_intents: List[str] = field(default_factory=list)  # 次要意图

    # 质量方向
    quality_direction: str = ""           # best / worst / focus / trend_up / trend_down / neutral

    # 原始匹配详情（调试用）
    matched_keywords: List[str] = field(default_factory=list)
    time_expressions: List[str] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "raw": self.raw,
            "normalized": self.normalized,
            "time_intent": self.time_intent,
            "date_from": self.date_from,
            "date_to": self.date_to,
            "brands": self.brands,
            "machines": self.machines,
            "shifts": self.shifts,
            "indicators": self.indicators,
            "indicator_names": self.indicator_names,
            "primary_intent": self.primary_intent,
            "intent_confidence": round(self.intent_confidence, 3),
            "secondary_intents": self.secondary_intents,
            "quality_direction": self.quality_direction,
            "matched_keywords": self.matched_keywords,
            "time_expressions": self.time_expressions,
        }


# ==================== 解析器核心 ====================

class QuestionParser:
    """
    智能问题解析器

    使用方法：
        parser = QuestionParser()
        parsed = parser.parse("今天质量怎么样？")
        print(parsed.primary_intent)      # "today_quality"
        print(parsed.date_from)           # "2026-08-16"
        print(parsed.indicators)          # ["quality_status"]
    """

    def __init__(self):
        # 构建反向索引：每个同义词 → 标准key
        self._synonym_to_key: Dict[str, str] = {}
        self._build_synonym_index()

        # 加载已知牌号列表
        self._known_brands = get_all_brands()

        # 已知机台模式（数字+号 或 PT+数字 等）
        self._machine_patterns = [
            r'(\d+)\s*#?\s*(号|机)',
            r'(PT|pt)\s*(\d+)',
            r'(\d{1,3})\s*机',
            r'[A-Za-z]?\s*\d+\s*机',
        ]

        # 班别词
        self._shift_keywords = ["早班", "中班", "晚班", "白班", "夜班", "甲班", "乙班", "丙班"]

    def _build_synonym_index(self):
        """构建同义词 → 标准key 的反向索引"""
        for std_key, synonyms in INDICATOR_SYNONYMS.items():
            for syn in synonyms:
                self._synonym_to_key[syn.lower()] = std_key
            # 自身也加入
            self._synonym_to_key[std_key.lower()] = std_key

    def parse(self, question: str) -> ParsedQuestion:
        """解析用户问题，返回结构化结果"""
        parsed = ParsedQuestion(
            raw=question,
            normalized=re.sub(r'\s+', '', question.lower()),
        )

        # 1. 时间范围解析
        self._parse_time(parsed)

        # 2. 实体提取（牌号 > 机台 > 班别 > 指标）
        self._extract_brands(parsed)
        self._extract_machines(parsed)
        self._extract_shifts(parsed)
        self._extract_indicators(parsed)

        # 3. 意图识别
        self._detect_intent(parsed)

        # 4. 质量方向判断
        self._detect_direction(parsed)

        return parsed

    # -------------------- 时间解析 --------------------

    def _parse_time(self, p: ParsedQuestion):
        """从问题中解析时间范围"""
        q = p.normalized
        today = datetime.now().date()

        relative = match_relative_days(p.raw) or match_relative_days(q)
        if relative:
            n_days, expr = relative
            p.time_intent = "last_n_days"
            p.time_expressions.append(expr)
            start = (today - timedelta(days=n_days - 1)).isoformat()
            p.date_from, p.date_to = start, today.isoformat()
            return

        # 精确时间词匹配
        for time_key, synonyms in TIME_SYNONYMS.items():
            for syn in synonyms:
                if syn in q:
                    p.time_intent = time_key
                    p.time_expressions.append(syn)
                    break
            if p.time_intent:
                break

        # 计算日期范围
        if p.time_intent == "today":
            d = today.isoformat()
            p.date_from, p.date_to = d, d
        elif p.time_intent == "yesterday":
            d = (today - timedelta(days=1)).isoformat()
            p.date_from, p.date_to = d, d
        elif p.time_intent == "this_week":
            start = today - timedelta(days=today.weekday())
            end = start + timedelta(days=6)
            p.date_from, p.date_to = start.isoformat(), end.isoformat()
        elif p.time_intent == "last_week":
            start = today - timedelta(days=today.weekday() + 7)
            end = start + timedelta(days=6)
            p.date_from, p.date_to = start.isoformat(), end.isoformat()
        elif p.time_intent == "this_month":
            start = today.replace(day=1)
            if start.month < 12:
                end = (start.replace(month=start.month + 1, day=1) - timedelta(days=1))
            else:
                end = today.replace(month=12, day=31)
            p.date_from, p.date_to = start.isoformat(), end.isoformat()
        elif p.time_intent == "last_month":
            first_this = today.replace(day=1)
            last_month_end = first_this - timedelta(days=1)
            last_month_start = last_month_end.replace(day=1)
            p.date_from, p.date_to = last_month_start.isoformat(), last_month_end.isoformat()
        elif p.time_intent == "recent":
            start = (today - timedelta(days=30)).isoformat()
            p.date_from, p.date_to = start, today.isoformat()

        # 如果没有明确时间词，但包含"今天"+"质量相关"，强制设为今天
        if not p.time_intent and any(t in q for t in ["今天", "今日", "当天", "本日"]):
            p.time_intent = "today"
            d = today.isoformat()
            p.date_from, p.date_to = d, d
            p.time_expressions.append("今天" if "今天" in q else ("今日" if "今日" in q else "当天"))

        # 尝试匹配 "X月份"
        if not p.time_intent:
            month_match = re.search(r'(\d{1,2})\s*月份?', p.raw)
            if month_match:
                month = int(month_match.group(1))
                if 1 <= month <= 12:
                    year = today.year
                    start = datetime(year, month, 1).date()
                    if month < 12:
                        end = (datetime(year, month + 1, 1) - timedelta(days=1)).date()
                    else:
                        end = datetime(year, 12, 31).date()
                    p.date_from, p.date_to = start.isoformat(), end.isoformat()
                    p.time_intent = "specific_month"

        # 默认：最近30天
        if not p.date_from:
            start = (today - timedelta(days=30)).isoformat()
            p.date_from, p.date_to = start, today.isoformat()
            p.time_intent = "recent"

    # -------------------- 实体提取 --------------------

    def _extract_brands(self, p: ParsedQuestion):
        """提取牌号"""
        q = p.raw  # 用原始文本，保留完整牌号名
        for brand in sorted(self._known_brands, key=len, reverse=True):
            if brand in q:
                p.brands.append(brand)
                p.matched_keywords.append(f"牌号:{brand}")

        # 别名匹配
        value_aliases = {
            "modern-eu": "摩登（中东-EU）",
            "normal-red-djibouti": "摩登（普通红吉布提）",
            "normal-red-intl": "摩登（普通红国际）",
            "normal-silver-intl": "摩登（普通银国际）",
            "slim": "摩登（细支）",
            "slim-gold": "摩登（细支金）",
            "ultra-slim": "摩登（超细支）",
            "ultra-gold": "摩登（超细金）",
            "ultra-silver": "摩登（超细银）",
            "ultra-black": "摩登（超细黑）",
            "ultra-white-97": "摩登（97超细白）",
            "ultra-white": "摩登（超细白）",
        }
        for alias, full_name in sorted(value_aliases.items(), key=lambda x: len(x[0]), reverse=True):
            if alias.lower() in p.normalized or alias in p.raw:
                if alias == "ultra-white" and "ultra-white-97" in p.normalized:
                    continue
                if full_name not in p.brands:
                    p.brands.append(full_name)
                    p.matched_keywords.append(f"牌号别名:{alias}")

        # 简称匹配："细支"、"超细"、"中东"等
        short_names = {
            "细支": "摩登（细支）",
            "超细": "摩登（超细支）",
            "中东": "摩登（中东-EU）",
            "吉布提": "摩登（普通红吉布提）",
            "国际红": "摩登（普通红国际）",
            "国际银": "摩登（普通银国际）",
            "97超细白": "摩登（97超细白）",
            "超细白": "摩登（超细白）",
        }
        for short, full in sorted(short_names.items(), key=lambda x: len(x[0]), reverse=True):
            if short in q and full not in p.brands:
                if short == "超细白" and "97超细白" in q:
                    continue
                if short == "超细" and "超细白" in q:
                    continue
                p.brands.append(full)
                p.matched_keywords.append(f"牌号简称:{short}")

    def _extract_machines(self, p: ParsedQuestion):
        """提取机台编号"""
        q = p.raw
        for pattern in self._machine_patterns:
            match = re.search(pattern, q)
            if match:
                # 提取完整的机台标识
                machine_str = match.group(0).strip()
                if machine_str not in p.machines:
                    p.machines.append(machine_str)
                    p.matched_keywords.append(f"机台:{machine_str}")

    def _extract_shifts(self, p: ParsedQuestion):
        """提取班别"""
        q = p.normalized
        for shift in self._shift_keywords:
            if shift in q:
                p.shifts.append(shift)
                p.matched_keywords.append(f"班别:{shift}")

    def _extract_indicators(self, p: ParsedQuestion):
        """提取质量指标（使用同义词匹配）"""
        q = p.normalized
        found_keys: Set[str] = set()
        found_names: List[str] = []

        # 遍历所有同义词，找出问题中出现的
        for syn, std_key in self._synonym_to_key.items():
            if syn in q and std_key not in found_keys:
                found_keys.add(std_key)
                found_names.append(syn)
                p.matched_keywords.append(f"指标:{syn}")

        p.indicators = list(found_keys)
        p.indicator_names = found_names

    # -------------------- 意图识别 --------------------

    def _detect_intent(self, p: ParsedQuestion):
        """
        基于关键词权重进行意图识别

        算法：
        1. 对每种意图计算匹配得分（命中关键词数 × 权重）
        2. 取最高分为主意图
        3. 得分超过阈值一半的为次要意图
        """
        q = p.normalized
        scores: Dict[str, float] = {}

        for intent, keywords in INTENT_KEYWORDS.items():
            score = 0.0
            matched = []
            for kw in keywords:
                if kw in q:
                    # 长词权重更高（更精确的匹配）
                    weight = len(kw) / 2.0
                    score += weight
                    matched.append(kw)
            if score > 0:
                scores[intent] = score
                p.matched_keywords.extend(matched)

        if not scores:
            p.primary_intent = "combined"
            p.intent_confidence = 0.1
            self._apply_intent_rules(p, q)
            return

        # 排序得分
        sorted_intents = sorted(scores.items(), key=lambda x: x[1], reverse=True)
        best_intent, best_score = sorted_intents[0]

        # 归一化置信度
        total_score = sum(s for _, s in sorted_intents)
        p.intent_confidence = best_score / total_score if total_score > 0 else 0

        # 映射内部意图到场景名
        intent_to_scenario = {
            "query_today": "today_quality",
            "query_machine_focus": "machine_focus",
            "query_machine_best": "machine_best",
            "query_machine_worst": "machine_worst",
            "query_brand_trend": "brand_trend",
            "query_quality_decline": "quality_decline",
            "query_physical_deviation": "physical_deviation",
            "query_physical_standard": "physical_standard",
            "query_defect_detail": "defect_detail",
            "query_rate": "rate_query",
            "query_rating_standard": "rating_standard",
            "query_batch_rating": "batch_rating",
            "query_defect_standard": "defect_standard",
        }

        p.primary_intent = intent_to_scenario.get(best_intent, "combined")

        # 收集次要意图（得分 > 最高分50%的）
        threshold = best_score * 0.5
        for intent, score in sorted_intents[1:]:
            if score >= threshold:
                scenario = intent_to_scenario.get(intent, "combined")
                if scenario != p.primary_intent:
                    p.secondary_intents.append(scenario)

        # 特殊规则覆盖
        self._apply_intent_rules(p, q)

    def _apply_intent_rules(self, p: ParsedQuestion, q: str):
        """应用特殊意图规则（处理边界情况和优先级）"""

        # 规则1：如果同时有"为什么"+质量下降相关词，优先为 quality_decline
        has_reason = any(k in q for k in ["为什么", "为啥", "原因", "怎么回事", "为何"])
        has_decline = any(k in q for k in ["下降", "变差", "恶化", "不好", "差", "问题"])
        if has_reason and has_decline:
            if p.primary_intent != "quality_decline":
                p.secondary_intents.append(p.primary_intent)
            p.primary_intent = "quality_decline"
            p.intent_confidence = 0.9

        # 规则2：如果有物测指标 + 标准/合格/偏离词，优先为物测场景
        has_physical_ind = any(ind in p.indicators for ind in ["length", "circumference", "draw_resistance", "weight", "ventilation"])
        has_physical_kw = any(k in q for k in ["物测", "烟支", "长度", "圆周", "吸阻", "重量", "通风度"])
        if has_physical_ind or has_physical_kw:
            if any(k in q for k in ["偏离", "超标", "不合格", "合格吗", "合不合格", "达不达标"]):
                if p.primary_intent != "physical_deviation":
                    p.secondary_intents.append(p.primary_intent)
                p.primary_intent = "physical_deviation"
                p.intent_confidence = 0.85
            elif any(k in q for k in ["标准", "规格", "范围", "上限", "下限", "多少", "要求"]):
                if p.primary_intent != "physical_standard":
                    p.secondary_intents.append(p.primary_intent)
                p.primary_intent = "physical_standard"
                p.intent_confidence = 0.85

        # 规则3：如果问的是具体指标数值（如"今天的合格率是多少"），保持原意图但标记为 rate_query
        if "rate_query" in p.secondary_intents and p.primary_intent == "today_quality":
            p.secondary_intents.remove("rate_query")
            # rate_query 作为附加信息保留在 indicators 中即可

        # 规则4：时间词 + 质量状态词（无其他特定意图），统一为 today_quality
        # 答案函数会按 date_from/date_to 描述「今日 / 过去七天」等，不限于当天
        quality_status_kws = ["质量情况", "质量状况", "质量状态", "质量表现", "质量水平",
                               "整体质量", "整体情况", "整体状况", "整体表现", "总体质量",
                               "总体情况", "总体状况", "总体表现",
                               "质量怎么样", "质量如何", "质量咋样", "质量怎样"]
        has_entity = bool(p.machines or p.brands or p.shifts)
        has_quality_ask = any(k in q for k in quality_status_kws) or (
            "质量" in q and any(w in q for w in ["怎么样", "如何", "咋样", "怎样"])
        )
        if (p.time_intent and has_quality_ask and
            p.primary_intent in ["combined", "rate_query", "today_quality"] and
            not has_entity):
            p.primary_intent = "today_quality"
            p.intent_confidence = 0.88

        # 规则5：如果有"最差"/"最坏"+ 机台相关词，优先为 machine_worst
        if any(k in q for k in ["最差", "最坏", "倒数", "垫底"]):
            if any(k in q for k in ["机台", "机器", "设备", "哪台", "哪个"]) and p.primary_intent != "machine_worst":
                p.secondary_intents.append(p.primary_intent)
                p.primary_intent = "machine_worst"
                p.intent_confidence = 0.87

        # 规则6：如果有时间词 + 指标查询（如"今天的合格率"），保持 time+indicator 组合意图
        if p.time_intent in [
            "today", "yesterday", "this_week", "last_week",
            "this_month", "last_month", "last_n_days", "recent",
        ]:
            if p.indicators and p.primary_intent in ["rate_query", "combined"]:
                # 有时间+具体指标，升级为 today_quality（答案函数会根据 indicators 调整内容）
                if not has_entity:
                    p.secondary_intents.append(p.primary_intent)
                    p.primary_intent = "today_quality"
                    p.intent_confidence = 0.86

        # 规则7：如果提取到机台实体 + 查询词（怎么样/如何/情况），优先为 machine_focus
        query_words = ["怎么样", "如何", "咋样", "怎样", "情况", "状况", "表现"]
        if p.machines and any(w in q for w in query_words):
            if p.primary_intent not in ["machine_focus", "machine_best", "machine_worst"]:
                p.secondary_intents.append(p.primary_intent)
                p.primary_intent = "machine_focus"
                p.intent_confidence = 0.85

        # 规则8：如果有时间词（今天/今日等）+ 怎么样/如何 + 牌号 → today_quality（答案会带上牌号过滤）
        if p.time_intent in ["today", "yesterday"] and any(w in q for w in query_words):
            if p.brands and p.primary_intent in ["brand_trend", "combined"]:
                p.secondary_intents.append(p.primary_intent)
                p.primary_intent = "today_quality"
                p.intent_confidence = 0.84

        # 规则8.5：具体缺陷名称/代码/判定标准，优先于评级分值线
        try:
            from core.defect_standard import looks_like_defect_question
            if looks_like_defect_question(p.raw):
                if p.primary_intent != "defect_standard":
                    p.secondary_intents.append(p.primary_intent)
                p.primary_intent = "defect_standard"
                p.intent_confidence = 0.93
                return
        except Exception:
            pass

        # 规则9：外在质量评级分值线（5.3.1），优先于泛知识问答
        from core.rating_standard import looks_like_batch_rating_question, looks_like_rating_question
        has_physical_kw_for_rating = any(
            k in q for k in ["物测", "烟支", "长度", "圆周", "吸阻", "重量", "通风度"]
        )
        if looks_like_batch_rating_question(p.raw) and not has_physical_kw_for_rating:
            if p.primary_intent != "batch_rating":
                p.secondary_intents.append(p.primary_intent)
            p.primary_intent = "batch_rating"
            p.intent_confidence = 0.9
        elif looks_like_rating_question(p.raw) and not has_physical_kw_for_rating:
            # 「优质率/优等品率」走比率查询，不覆盖成纯规则问答
            rate_only = any(k in q for k in ["优质率", "优等品率", "一等品率", "二等品率", "合格率"])
            if rate_only and p.primary_intent in ["rate_query", "today_quality"]:
                pass
            else:
                if p.primary_intent != "rating_standard":
                    p.secondary_intents.append(p.primary_intent)
                p.primary_intent = "rating_standard"
                p.intent_confidence = 0.92

    # -------------------- 方向判断 --------------------

    def _detect_direction(self, p: ParsedQuestion):
        """判断质量相关的方向性（最好/最差/关注/上升/下降/中性）"""
        q = p.normalized

        if any(k in q for k in ["最好", "最佳", "最优", "最高", "第一", "榜首"]):
            p.quality_direction = "best"
        elif any(k in q for k in ["最差", "最坏", "最低", "倒数", "垫底", "最后"]):
            p.quality_direction = "worst"
        elif any(k in q for k in ["关注", "注意", "重点", "警惕", "异常", "不稳定", "问题"]):
            p.quality_direction = "focus"
        elif any(k in q for k in ["上升", "增长", "提高", "变好", "改善", "好转"]):
            p.quality_direction = "trend_up"
        elif any(k in q for k in ["下降", "降低", "减少", "变差", "恶化", "下滑"]):
            p.quality_direction = "trend_down"
        else:
            p.quality_direction = "neutral"


# ==================== 便捷函数 ====================

# 全局解析器实例
_parser_instance: Optional[QuestionParser] = None


def get_parser() -> QuestionParser:
    """获取全局解析器实例（单例）"""
    global _parser_instance
    if _parser_instance is None:
        _parser_instance = QuestionParser()
    return _parser_instance


def parse_question(question: str) -> ParsedQuestion:
    """便捷函数：解析问题并返回结构化结果"""
    return get_parser().parse(question)


def extract_date_range(question: str) -> Tuple[Optional[str], Optional[str]]:
    """兼容旧接口：从问题中提取日期范围"""
    parsed = parse_question(question)
    return parsed.date_from, parsed.date_to


def extract_scenario(question: str) -> str:
    """兼容旧接口：从问题中识别场景"""
    parsed = parse_question(question)
    return parsed.primary_intent


def extract_all_entities(question: str) -> Dict[str, Any]:
    """提取问题中的所有实体信息"""
    parsed = parse_question(question)
    return parsed.to_dict()


# ==================== 测试入口 ====================

if __name__ == "__main__":
    # 测试各种表达方式
    test_questions = [
        "今天的质量怎么样？",
        "今天质量怎么样？",
        "今天质量如何？",
        "今天整体质量情况如何？",
        "今天质量表现怎么样？",
        "今天质量好吗？",
        "今日质量状况",
        "过去七天的质量怎么样",
        "近7天质量如何",
        "哪个机台需要重点关注？",
        "哪台机器质量最差？",
        "质量最好的机台是哪个？",
        "最近质量为什么下降？",
        "摩登细支的物测指标偏离了吗？",
        "烟支长度的标准是多少？",
        "今天的合格率是多少？",
        "昨天有哪些缺陷？",
        "本周各机台排名",
        "摩登超细支的趋势怎么样？",
        "为什么质量变差了？",
        "吸阻合格吗？",
        "重量有没有超标？",
        "累计扣分 50 分属于什么等级？",
        "优等品的分值线是多少？",
        "这个批次为什么是二等品？",
        "整体情况如何",
        "最近缺陷数量多不多",
        "各牌号对比一下",
        "3号机怎么样",
        "早班的质量",
    ]

    parser = QuestionParser()
    print("=" * 80)
    print("智合 AI 问题解析引擎测试")
    print("=" * 80)

    for q in test_questions:
        parsed = parser.parse(q)
        print(f"\n📝 问题: {q}")
        print(f"   场景: {parsed.primary_intent} (置信度: {parsed.intent_confidence:.2f})")
        print(f"   时间: {parsed.time_intent} ({parsed.date_from} ~ {parsed.date_to})")
        if parsed.brands:
            print(f"   牌号: {parsed.brands}")
        if parsed.machines:
            print(f"   机台: {parsed.machines}")
        if parsed.shifts:
            print(f"   班别: {parsed.shifts}")
        if parsed.indicators:
            print(f"   指标: {list(zip(parsed.indicators, parsed.indicator_names))}")
        if parsed.secondary_intents:
            print(f"   次要意图: {parsed.secondary_intents}")
        print(f"   方向: {parsed.quality_direction}")
