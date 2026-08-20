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
            hits = boxed + [h for h in hits if h not in boxed]
    elif "条盒" in q or "条装" in q:
        cartons = [h for h in hits if (h.get("code") or "").startswith("T")]
        if cartons:
            hits = cartons + [h for h in hits if h not in cartons]

    return hits[:limit]


def looks_like_defect_question(question: str) -> bool:
    q = question or ""
    if any(k in q for k in ["主要缺陷", "哪些缺陷", "缺陷率", "缺陷数量", "缺陷总数", "有哪些质量异常"]):
        return False
    if _extract_codes(q) and any(c in _by_code for c in _extract_codes(q)):
        _load_items()
        return True
    if search_defects(q, limit=1):
        return True
    if _extract_grade(q) and any(k in q for k in ["缺陷", "等级", "是什么", "判定", "扣分"]):
        return True
    if any(k in q for k in ["怎么判定", "如何判定", "判定标准", "缺陷判定", "缺陷代码"]):
        return True
    return False


def answer_defect_question(question: str) -> str:
    """回答缺陷判定、等级、代码、扣分问题。"""
    q = question or ""
    hits = search_defects(q, limit=8)
    grade = _extract_grade(q)

    if hits:
        if len(hits) == 1:
            text = format_defect(hits[0])
        else:
            names = {h["name"] for h in hits}
            header = f"标准中与「{'、'.join(names)}」对应的缺陷如下：\n"
            text = header + "\n\n".join(format_defect(h) for h in hits)
        if grade and not any(h.get("category") == grade for h in hits):
            text += f"\n\n另：{format_grade(grade)}"
        return text

    if grade:
        return (
            f"依据《卷烟外在质量缺陷判定》与《卷烟外在质量分级及评级规定》表1：\n"
            f"{format_grade(grade)}"
        )

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
