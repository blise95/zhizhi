"""
多轮上下文：把「发散追问」补成可独立解析的问题。

例如：
  Q1 整个月质量怎么样
  Q2 优质率怎么样  → 整个月优质率怎么样
"""
from __future__ import annotations

import re
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional

from core.question_parser import parse_question


FOLLOWUP_PREFIX = re.compile(r"^(那|那么|另外|还有|再看|再问|继续)")
KNOWLEDGE_HINTS = (
    "属于什么等级", "怎么判定", "如何判定", "判定标准", "缺陷代码",
    "分值线", "扣分表", "是什么意思", "什么是",
)
DRILL_HINTS = (
    "优质率", "合格率", "缺陷率", "优等品率", "一等品率", "二等品率",
    "缺陷", "机台", "牌号", "样本", "优等", "一等", "二等", "不合格",
    "扣分", "怎么样", "如何", "呢", "具体", "详细", "分布", "对比",
)
TOPIC_MARKERS = (
    "物测", "标准", "规格", "质量", "优质率", "合格率", "缺陷率", "缺陷",
    "样本", "评级", "扣分", "偏离", "超标", "趋势", "对比", "判定",
)
TOPIC_BY_INTENT = {
    "physical_standard": "物测标准",
    "physical_deviation": "物测偏离",
    "today_quality": "质量怎么样",
    "machine_focus": "机台质量怎么样",
    "brand_trend": "质量趋势",
    "sample_count": "样本数",
    "brand_list": "生产了什么牌号",
    "defect_detail": "主要缺陷",
    "rate_query": "优质率",
}
BRAND_SHORTS = ("细支金", "细支", "超细白", "超细银", "超细", "中东-EU", "中东", "吉布提")
GREETING_HINTS = (
    "你好", "您好", "在吗", "在不在", "谢谢", "感谢", "你是谁",
)


@dataclass
class ResolvedQuestion:
    original: str
    resolved: str
    inherited: Dict[str, Any] = field(default_factory=dict)


def _compact(text: str) -> str:
    return re.sub(r"\s+", "", text or "")


def _is_greeting(text: str) -> bool:
    compact = re.sub(r"[，。！？,.!?～~]+", "", _compact(text))
    if not compact or len(compact) > 24:
        return False
    if any(k in compact for k in ("质量", "缺陷", "牌号", "机台", "样本", "评级", "优质率")):
        return False
    return any(k in compact.lower() for k in GREETING_HINTS)


def _is_knowledge(text: str) -> bool:
    return any(k in (text or "") for k in KNOWLEDGE_HINTS)


def _user_turns(history: Optional[List[Dict[str, Any]]]) -> List[str]:
    turns: List[str] = []
    for item in history or []:
        if not isinstance(item, dict):
            continue
        if (item.get("role") or "").strip() != "user":
            continue
        content = (item.get("content") or "").strip()
        if content:
            turns.append(content)
    return turns


def _has_explicit_time(parsed) -> bool:
    return bool(getattr(parsed, "time_expressions", None))


def _is_followup_form(text: str) -> bool:
    compact = _compact(text)
    return bool(FOLLOWUP_PREFIX.match(compact) or compact.endswith("呢"))


def _remainder_without_entities(raw: str, parsed) -> str:
    text = FOLLOWUP_PREFIX.sub("", (raw or "").strip(), count=1)
    text = re.sub(r"[呢吗啊呀？?！!。.]+$", "", text)
    for brand in getattr(parsed, "brands", []) or []:
        text = text.replace(brand, "")
    for machine in getattr(parsed, "machines", []) or []:
        text = text.replace(machine, "")
    for expr in getattr(parsed, "time_expressions", []) or []:
        text = text.replace(expr, "")
    for short in BRAND_SHORTS:
        text = text.replace(short, "")
    return re.sub(r"\s+", "", text).strip("的，, ")


def _has_topic(raw: str, parsed) -> bool:
    rem = _remainder_without_entities(raw, parsed)
    return any(k in rem for k in TOPIC_MARKERS)


def _topic_from_question(raw: str, parsed) -> str:
    rem = _remainder_without_entities(raw, parsed)
    if 2 <= len(rem) <= 12:
        return rem
    return TOPIC_BY_INTENT.get(getattr(parsed, "primary_intent", "") or "", "")


def _collect_slots(user_questions: List[str]) -> Dict[str, Any]:
    """牌号/机台/主题只继承上一问；时间可继续往前回看。"""
    last_raw = user_questions[-1]
    last = parse_question(last_raw)
    slots: Dict[str, Any] = {
        "time_expression": last.time_expressions[0] if last.time_expressions else "",
        "brands": list(last.brands),
        "machines": list(last.machines),
        "shifts": list(last.shifts),
        "topic": _topic_from_question(last_raw, last),
        "intent": last.primary_intent,
    }
    if slots["time_expression"]:
        return slots
    for question in reversed(user_questions[:-1]):
        parsed = parse_question(question)
        if parsed.time_expressions:
            slots["time_expression"] = parsed.time_expressions[0]
            break
    return slots


def _should_inherit(current_raw: str, current, slots: Dict[str, Any]) -> bool:
    if _is_greeting(current_raw):
        return False
    compact = _compact(current_raw)
    if _is_followup_form(current_raw):
        return True
    if _is_knowledge(current_raw):
        return False
    if not any(slots.get(k) for k in ("time_expression", "brands", "machines", "topic")):
        return False
    if _has_explicit_time(current):
        return False
    if any(k in compact for k in DRILL_HINTS):
        return True
    return len(compact) <= 16


def resolve_question(
    question: str,
    history: Optional[List[Dict[str, Any]]] = None,
) -> ResolvedQuestion:
    original = (question or "").strip()
    if not original:
        return ResolvedQuestion(original=original, resolved=original)

    prior_users = _user_turns(history)
    if not prior_users:
        return ResolvedQuestion(original=original, resolved=original)

    current = parse_question(original)
    slots = _collect_slots(prior_users)
    if not _should_inherit(original, current, slots):
        return ResolvedQuestion(original=original, resolved=original)

    prefixes: List[str] = []
    inherited: Dict[str, Any] = {}
    compact = _compact(original)

    if not _has_explicit_time(current) and slots.get("time_expression"):
        expr = slots["time_expression"]
        if expr not in compact:
            prefixes.append(expr)
            inherited["time"] = expr

    if not current.brands and slots.get("brands"):
        brand = slots["brands"][0]
        if brand not in original:
            prefixes.append(brand)
            inherited["brand"] = brand

    if not current.machines and slots.get("machines"):
        machine = slots["machines"][0]
        if machine not in original:
            prefixes.append(machine)
            inherited["machine"] = machine

    rest = FOLLOWUP_PREFIX.sub("", original, count=1).strip() or original
    rest = re.sub(r"[呢吗啊呀]+$", "", rest).strip() or rest

    suffixes: List[str] = []
    topic = slots.get("topic") or ""
    if topic and not _has_topic(original, current) and topic not in _compact(rest):
        suffixes.append(topic)
        inherited["topic"] = topic

    if not prefixes and not suffixes:
        return ResolvedQuestion(original=original, resolved=original)

    resolved = "".join(prefixes) + rest + "".join(suffixes)
    return ResolvedQuestion(original=original, resolved=resolved, inherited=inherited)
