"""
卷烟外在质量缺陷判定（QJ/ZY-GY.02-026-2023）结构化知识库

数据来源：defect_library.json（从判定标准抽取）。
用于精确回答缺陷名称、代码、等级、判定标准与单位扣分，不依赖向量库。
"""
import json
import re
from pathlib import Path
from typing import Any, Dict, List, Optional

import config
from core.rating_standard import (
    CIGARETTE_SCORE_CATEGORY_BY_NAME,
    DEFECT_SCORE_TABLE,
    SCORE_CATEGORY_LABELS,
    get_defect_score,
)

GRADE_DEFINITIONS = {
    "A": {
        "label": "严重缺陷",
        "principle": "对消费者利益有直接损害",
        "score_range": "X≥100",
    },
    "B": {
        "label": "较重缺陷",
        "principle": "很难被消费者接受",
        "score_range": "20≤X＜100",
    },
    "C": {
        "label": "一般缺陷",
        "principle": "会引起消费者不满意",
        "score_range": "5＜X＜20",
    },
    "D": {
        "label": "轻微缺陷",
        "principle": "消费者可能发现但不介意",
        "score_range": "X≤5",
    },
}

AREA_LABELS = {
    "X": "箱装",
    "T": "条装",
    "H": "盒装",
    "J": "烟支",
}

_LIBRARY_CANDIDATES = [
    Path(config.BASE_DIR) / "data" / "defect_library.json",
    Path(config.BASE_DIR).parent / "defect_library.json",
]

_items: Optional[List[Dict[str, Any]]] = None
_by_code: Dict[str, Dict[str, Any]] = {}
_by_name: Dict[str, List[Dict[str, Any]]] = {}


def _infer_score_category(item: Dict[str, Any]) -> str:
    name = item.get("name") or ""
    code = (item.get("code") or "").upper()
    if name in CIGARETTE_SCORE_CATEGORY_BY_NAME:
        return CIGARETTE_SCORE_CATEGORY_BY_NAME[name]
    prefix = code[:1]
    return {"X": "box", "T": "carton", "H": "pack", "J": "appearance"}.get(prefix, "appearance")


def _load_items() -> List[Dict[str, Any]]:
    global _items, _by_code, _by_name
    if _items is not None:
        return _items

    path = next((p for p in _LIBRARY_CANDIDATES if p.exists()), None)
    if path is None:
        _items = []
        return _items

    with open(path, "r", encoding="utf-8") as f:
        raw = json.load(f)

    items: List[Dict[str, Any]] = []
    for area_name, area in (raw or {}).items():
        locations = area.get("locations") or {}
        if isinstance(locations, list):
            loc_iter = [(loc.get("location", ""), loc.get("defects") or []) for loc in locations]
        else:
            loc_iter = [(loc_name, loc_items or []) for loc_name, loc_items in locations.items()]
        for loc_name, loc_items in loc_iter:
            for d in loc_items:
                item = {
                    "area": area_name,
                    "location": d.get("location") or loc_name,
                    "name": (d.get("name") or "").strip(),
                    "code": (d.get("code") or "").strip().upper(),
                    "standard": (d.get("standard") or "").strip(),
                    "category": (d.get("category") or "").strip().upper(),
                    "source_page": d.get("source_page"),
                }
                item["score_category"] = _infer_score_category(item)
                item["unit_score"] = get_defect_score(item["category"], item["score_category"])
                items.append(item)

    _items = items
    _by_code = {i["code"]: i for i in items if i.get("code")}
    _by_name = {}
    for i in items:
        _by_name.setdefault(i["name"], []).append(i)
    return _items


def reload_library() -> None:
    global _items, _by_code, _by_name
    _items = None
    _by_code = {}
    _by_name = {}
    _load_items()


def get_all_defects() -> List[Dict[str, Any]]:
    return list(_load_items())


def get_all_defect_names() -> List[str]:
    _load_items()
    return sorted(_by_name.keys(), key=len, reverse=True)


def format_defect(item: Dict[str, Any]) -> str:
    grade = GRADE_DEFINITIONS.get(item.get("category"), {})
    grade_text = f"{item.get('category')}类"
    if grade:
        grade_text += f"（{grade.get('label')}）"
    area = AREA_LABELS.get((item.get("code") or "")[:1], item.get("area") or "")
    loc = item.get("location") or ""
    score_label = SCORE_CATEGORY_LABELS.get(item.get("score_category"), item.get("score_category") or "")
    page = item.get("source_page")
    page_text = f"，判定标准约第 {page} 页" if page else ""
    return (
        f"{item.get('name')}（代码 {item.get('code')}）属于{grade_text}，部位：{area}/{loc}。\n"
        f"判定标准：{item.get('standard')}\n"
        f"单位扣分：{score_label}{item.get('category')}类 {item.get('unit_score')} 分{page_text}。"
    )


def format_grade(category: str) -> str:
    cat = (category or "").upper()
    info = GRADE_DEFINITIONS.get(cat)
    if not info:
        return ""
    table = DEFECT_SCORE_TABLE.get(cat, {})
    score_parts = [
        f"{SCORE_CATEGORY_LABELS[k]}{v}" for k, v in table.items() if v
    ]
    return (
        f"{cat}类为{info['label']}，判定原则：{info['principle']}。"
        f"单位扣分区间 {info['score_range']}。"
        f"表1扣分：{' / '.join(score_parts)}。"
    )


def _extract_codes(question: str) -> List[str]:
    return [c.upper() for c in re.findall(r"[A-Za-z]{2,5}[A-Da-d]", question or "")]


def _extract_grade(question: str) -> Optional[str]:
    q = question or ""
    for cat, info in GRADE_DEFINITIONS.items():
        if f"{cat}类" in q or info["label"] in q:
            return cat
    return None


def search_defects(question: str, limit: int = 8) -> List[Dict[str, Any]]:
    """按代码、缺陷名称从标准库检索。"""
    _load_items()
    q = (question or "").strip()
    if not q:
        return []

    hits: List[Dict[str, Any]] = []
    seen = set()

    def add(item: Dict[str, Any]):
        code = item.get("code")
        if not code or code in seen:
            return
        seen.add(code)
        hits.append(item)

    for code in _extract_codes(q):
        if code in _by_code:
            add(_by_code[code])

    names = get_all_defect_names()
    for name in names:
        if len(name) >= 2 and name in q:
            for item in _by_name.get(name, []):
                add(item)
            if hits:
                break

    if not hits:
        compact = re.sub(r"\s+", "", q)
        for name in names:
            if len(name) >= 2 and name.replace(" ", "") in compact:
                for item in _by_name.get(name, []):
                    add(item)
                if hits:
                    break

    if "小盒" in q or ("盒装" in q and "条" not in q):
        boxed = [h for h in hits if (h.get("code") or "").startswith("H")]
        if boxed:
            hits = boxed
    elif "条盒" in q or "条装" in q:
        cartons = [h for h in hits if (h.get("code") or "").startswith("T")]
        if cartons:
            hits = cartons

    return hits[:limit]


_AREA_PREFIX = (
    ("小盒", "H", "小盒"),
    ("盒装", "H", "小盒"),
    ("条盒", "T", "条盒"),
    ("条装", "T", "条盒"),
    ("纸箱", "X", "纸箱"),
    ("箱装", "X", "纸箱"),
    ("烟支", "J", "烟支"),
)

_DATA_DEFECT_HINTS = (
    "主要缺陷", "缺陷率", "缺陷数量", "缺陷总数", "有哪些质量异常",
    "当前主要缺陷",
)
_TIME_DATA_HINTS = ("今天", "今日", "昨天", "昨日", "近期", "最近", "本周", "本月", "过去")
_GRADE_COUNT_HINTS = (
    "不合格", "多少个", "数量以上", "几个以上", "几处以上",
    "判定不合格", "算不合格", "多少处",
)


def _area_from_question(q: str) -> Optional[tuple]:
    for hint, prefix, label in _AREA_PREFIX:
        if hint in q:
            return prefix, label
    return None


def search_by_location(question: str) -> List[Dict[str, Any]]:
    """按部位（如小盒透明纸）检索标准条目。"""
    items = _load_items()
    q = question or ""
    locations = sorted({i.get("location") or "" for i in items if i.get("location")}, key=len, reverse=True)
    loc = next((name for name in locations if name and name in q), "")
    if not loc:
        return []
    hits = [i for i in items if i.get("location") == loc]
    area = _area_from_question(q)
    if area:
        prefix, _ = area
        filtered = [i for i in hits if (i.get("code") or "").startswith(prefix)]
        if filtered:
            hits = filtered
    return hits


def _quantity_phrases(standard: str) -> List[str]:
    if not standard:
        return []
    patterns = [
        r"个数\s*[≥＞>]\s*\d+",
        r"[≥＞>]\s*\d+\s*(?:个|处|条|点|张|包|支|次)",
    ]
    found: List[str] = []
    for pattern in patterns:
        for m in re.findall(pattern, standard):
            if m not in found:
                found.append(re.sub(r"\s+", "", m))
    return found


def _unqualified_count(unit_score: Any) -> Optional[int]:
    try:
        score = int(unit_score)
    except (TypeError, ValueError):
        return None
    if score <= 0:
        return None
    return 200 // score + 1


def _location_label(question: str, items: List[Dict[str, Any]]) -> str:
    loc = items[0].get("location") if items else ""
    area = _area_from_question(question)
    area_label = area[1] if area else (AREA_LABELS.get((items[0].get("code") or "")[:1], "") if items else "")
    if area_label and loc:
        return f"{area_label}/{loc}"
    return loc or area_label or "该部位"


def format_location_catalog(question: str, items: List[Dict[str, Any]]) -> str:
    """查标准：列出该部位有哪些等级，以及每条缺陷的判定描述。"""
    label = _location_label(question, items)
    order = [g for g in "ABCD" if any(i.get("category") == g for i in items)]
    lines = [
        f"「{label}」在《卷烟外在质量缺陷判定》中共有 {len(order)} 个缺陷等级："
        + "、".join(f"{g}类（{GRADE_DEFINITIONS.get(g, {}).get('label', '')}）" for g in order)
        + "。",
        "以下按等级列出各缺陷及判定内容：",
    ]
    for grade in order:
        info = GRADE_DEFINITIONS.get(grade, {})
        lines.append(f"\n{grade}类（{info.get('label', '')}）：{info.get('principle', '')}")
        for item in items:
            if item.get("category") != grade:
                continue
            std = re.sub(r"\s+", " ", item.get("standard") or "").strip()
            lines.append(f"- {item.get('name')}（{item.get('code')}）：{std}")
    return "\n".join(lines)


def format_defect_grade(item: Dict[str, Any]) -> str:
    """查缺陷等级：等级含义 + 数量门槛 + 多少个以上批次不合格。"""
    lines = [format_defect(item)]
    qty = _quantity_phrases(item.get("standard") or "")
    if qty:
        lines.append(f"数量门槛：达到 {'、'.join(qty)} 即判定为该缺陷。")
    else:
        lines.append("数量门槛：该条标准以形态/尺寸判定，未单独给出个数门槛；符合上述判定标准即成立。")
    n = _unqualified_count(item.get("unit_score"))
    if n:
        lines.append(
            f"批次不合格按 5.3.1：累计扣分＞200 分。"
            f"该缺陷单位扣分 {item.get('unit_score')} 分，仅出现此类时超过 {n} 个即判定不合格。"
        )
    return "\n".join(lines)


def _named_defect_hits(question: str) -> List[Dict[str, Any]]:
    """仅当问题里出现具体缺陷名称/代码时返回，避免把部位名当成缺陷名。"""
    return search_defects(question, limit=8)


def _wants_catalog(question: str, named: List[Dict[str, Any]], located: List[Dict[str, Any]]) -> bool:
    q = question or ""
    explicit = any(k in q for k in (
        "哪几个等级", "有哪些等级", "哪些等级", "有哪几个", "分几类",
        "分几个等级", "缺陷标准", "有哪些缺陷",
    ))
    if explicit and located:
        return True
    if located and not named and any(k in q for k in ("缺陷", "等级", "标准", "判定")):
        return True
    return False


def _wants_grade_count(question: str) -> bool:
    q = question or ""
    return any(k in q for k in _GRADE_COUNT_HINTS) or ("等级" in q and "哪几个" not in q and "哪些" not in q)


def looks_like_defect_question(question: str) -> bool:
    q = question or ""
    if any(k in q for k in _DATA_DEFECT_HINTS):
        return False
    if any(k in q for k in _TIME_DATA_HINTS) and not any(
        k in q for k in ("判定", "标准", "缺陷代码", "属于什么等级", "缺陷等级")
    ):
        return False
    _load_items()
    if _extract_codes(q) and any(c in _by_code for c in _extract_codes(q)):
        return True
    if search_defects(q, limit=1):
        return True
    if search_by_location(q) and any(k in q for k in ("缺陷", "等级", "标准", "判定", "哪几个", "哪些")):
        return True
    if _extract_grade(q) and any(k in q for k in ["缺陷", "等级", "是什么", "判定", "扣分", "不合格", "多少"]):
        return True
    if any(k in q for k in [
        "怎么判定", "如何判定", "判定标准", "缺陷判定", "缺陷代码",
        "缺陷标准", "缺陷等级", "哪几个等级", "有哪些等级",
    ]):
        return True
    return False


def answer_defect_question(question: str) -> str:
    """回答缺陷判定标准（按部位列等级）或缺陷等级（数量门槛/不合格）。"""
    q = question or ""
    named = _named_defect_hits(q)
    located = search_by_location(q)
    grade = _extract_grade(q)

    if _wants_catalog(q, named, located) and located:
        return format_location_catalog(q, located)

    hits = named or (located if len(located) <= 3 else [])
    if hits:
        if _wants_grade_count(q) or len(hits) == 1:
            if len(hits) == 1:
                return format_defect_grade(hits[0])
            return "标准中对应多条缺陷，分别如下：\n\n" + "\n\n".join(format_defect_grade(h) for h in hits[:5])
        names = {h["name"] for h in hits}
        header = f"标准中与「{'、'.join(names)}」对应的缺陷如下：\n"
        text = header + "\n\n".join(format_defect(h) for h in hits)
        if grade and not any(h.get("category") == grade for h in hits):
            text += f"\n\n另：{format_grade(grade)}"
        return text

    if grade:
        info = format_grade(grade)
        table = DEFECT_SCORE_TABLE.get(grade, {})
        appearance = table.get("appearance") or table.get("pack") or 0
        extra = ""
        n = _unqualified_count(appearance)
        if n and appearance:
            extra = (
                f"\n批次不合格按 5.3.1 累计扣分＞200 分。"
                f"以外观{grade}类单位扣分 {appearance} 分为例，仅此类时超过 {n} 个即判定不合格。"
            )
        return (
            f"依据《卷烟外在质量缺陷判定》与《卷烟外在质量分级及评级规定》表1：\n"
            f"{info}{extra}"
        )

    if located:
        return format_location_catalog(q, located)

    return "根据当前质量文档资料，暂未找到该缺陷的判定依据，暂时无法给出专业结论。"


def defects_as_knowledge_chunks(question: str, limit: int = 5) -> List[Dict[str, Any]]:
    """把检索结果转成与向量检索相同的 knowledge_results 结构。"""
    chunks = []
    for item in search_defects(question, limit=limit):
        chunks.append({
            "text": format_defect(item),
            "metadata": {
                "doc_name": "卷烟外在质量缺陷判定",
                "page_number": item.get("source_page") or "",
                "section_title": f"{item.get('location')} / {item.get('name')}",
                "source": "defect_library.json",
                "chunk_type": "defect",
                "code": item.get("code"),
            },
        })
    grade = _extract_grade(question)
    if grade and not chunks:
        chunks.append({
            "text": format_grade(grade),
            "metadata": {
                "doc_name": "卷烟外在质量分级及评级规定",
                "page_number": 3,
                "section_title": "表1 缺陷分级和单位扣分值",
                "source": "rating_standard",
                "chunk_type": "grade",
            },
        })
    return chunks
