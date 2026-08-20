"""
卷烟外在质量分级及评级规定（QJ/ZY-GY.02-027-2023）5.3.1

正式分值线（累计扣分）：
- 合格产品：≤ 200 分
- 不合格产品：＞ 200 分
- 优等品：≤ 18 分
- 一等品：＞ 18 分且 ≤ 100 分
- 二等品：＞ 100 分且 ≤ 200 分

扣分表对齐前端 src/lib/qualityEngine.ts，保证智合与驾驶舱评级一致。
"""
import re
from typing import Any, Dict, List, Optional

ScoreCategory = str  # box / carton / pack / physical / appearance / misc

SCORE_CATEGORY_LABELS: Dict[str, str] = {
    "box": "箱",
    "carton": "条",
    "pack": "盒",
    "physical": "物测",
    "appearance": "外观",
    "misc": "杂项",
}

RATING_RULE_TEXT = (
    "评定分为合格产品（≤200分）与不合格产品（＞200分），"
    "其中合格产品分为三级，分别为优等品（≤18分）、"
    "一等品（＞18分且≤100分）、二等品（＞100分且≤200分）。"
)

RATING_THRESHOLDS = [
    {"max": 18, "key": "excellent", "label": "优等品", "short_label": "优等", "pass": True},
    {"max": 100, "key": "first", "label": "一等品", "short_label": "一等", "pass": True},
    {"max": 200, "key": "second", "label": "二等品", "short_label": "二等", "pass": True},
    {"max": float("inf"), "key": "unqualified", "label": "不合格品", "short_label": "不合格", "pass": False},
]

DEFECT_SCORE_TABLE: Dict[str, Dict[str, int]] = {
    "A": {"box": 100, "carton": 100, "pack": 200, "physical": 0, "appearance": 120, "misc": 200},
    "B": {"box": 30, "carton": 30, "pack": 50, "physical": 0, "appearance": 20, "misc": 30},
    "C": {"box": 10, "carton": 10, "pack": 10, "physical": 12, "appearance": 8, "misc": 10},
    "D": {"box": 5, "carton": 5, "pack": 5, "physical": 2, "appearance": 2, "misc": 2},
}

CIGARETTE_SCORE_CATEGORY_BY_NAME: Dict[str, ScoreCategory] = {
    "错牌混牌": "misc",
    "含水率": "misc",
    "含末率": "misc",
    "端部落丝量": "misc",
    "熄火": "misc",
    "引燃强度": "misc",
    "重量": "physical",
    "圆周": "physical",
    "吸阻": "physical",
    "长度": "physical",
    "总通风度": "physical",
    "嘴通风度": "physical",
    "硬度": "physical",
    "压实端位置": "appearance",
}

RATING_KEYWORDS = (
    "优等品", "一等品", "二等品", "不合格品", "分值线", "评级规定",
    "累计扣分", "产品评级", "几等品", "质量评级", "合格产品",
)


def rate_by_score(score: float) -> Dict[str, Any]:
    """按 5.3.1 分值线判定产品等级。"""
    try:
        value = float(score)
    except (TypeError, ValueError):
        value = 0.0

    if value <= 18:
        band = RATING_THRESHOLDS[0]
    elif value <= 100:
        band = RATING_THRESHOLDS[1]
    elif value <= 200:
        band = RATING_THRESHOLDS[2]
    else:
        band = RATING_THRESHOLDS[3]

    return {
        "score": value,
        "key": band["key"],
        "label": band["label"],
        "short_label": band["short_label"],
        "pass": band["pass"],
        "pass_status": "pass" if band["pass"] else "fail",
        "qualified": band["pass"],
        "rule": RATING_RULE_TEXT,
    }


def get_defect_score(category: str, score_category: Optional[str] = None) -> int:
    cat = (category or "D").upper()
    sc = score_category or "appearance"
    table = DEFECT_SCORE_TABLE.get(cat) or DEFECT_SCORE_TABLE["D"]
    return int(table.get(sc, table.get("appearance", 2)))


def _resolve_score_category(defect: Dict[str, Any], default: str) -> str:
    if defect.get("scoreCategory"):
        return str(defect["scoreCategory"])
    name = defect.get("defectName") or defect.get("name") or ""
    return CIGARETTE_SCORE_CATEGORY_BY_NAME.get(name, default)


def calculate_batch_rating(record: Dict[str, Any]) -> Dict[str, Any]:
    """与前端 calculateBatchRating 对齐。"""
    groups = [
        ("boxDefects", "box"),
        ("cartonDefects", "carton"),
        ("packDefects", "pack"),
        ("cigaretteDefects", "appearance"),
    ]

    total_score = 0
    defect_count = 0
    defects_by_category = {"A": 0, "B": 0, "C": 0, "D": 0}
    score_by_category = {"A": 0, "B": 0, "C": 0, "D": 0}
    all_defects: List[Dict[str, Any]] = []

    for field, default_sc in groups:
        for defect in record.get(field, []) or []:
            sc = _resolve_score_category(defect, default_sc) if field == "cigaretteDefects" else default_sc
            qty = defect.get("quantity", 1) or 1
            cat = (defect.get("category") or "D").upper()
            score = get_defect_score(cat, sc) * qty
            total_score += score
            defect_count += qty
            defects_by_category[cat] = defects_by_category.get(cat, 0) + qty
            score_by_category[cat] = score_by_category.get(cat, 0) + score
            all_defects.append(defect)

    rated = rate_by_score(total_score)
    issue_status = (
        "withIssue"
        if rated["pass"] and (defects_by_category.get("A", 0) > 0 or total_score > 18)
        else "normal"
    )

    return {
        "record_id": record.get("id", ""),
        "inspection_date": record.get("inspectionDate", ""),
        "machine": record.get("machine", ""),
        "brand": record.get("brand", ""),
        "shift_group": record.get("shiftGroup", ""),
        "shift": record.get("shift", ""),
        "production_point": record.get("productionPoint", ""),
        "total_score": total_score,
        "rating": rated["key"],
        "rating_label": rated["label"],
        "pass_status": rated["pass_status"],
        "issue_status": issue_status,
        "defect_count": defect_count,
        "defects_by_category": defects_by_category,
        "score_by_category": score_by_category,
        "defects": all_defects,
    }


def rate_records(records: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    return [calculate_batch_rating(r) for r in records]


def summarize_ratings(records: List[Dict[str, Any]]) -> Dict[str, Any]:
    ratings = rate_records(records)
    total = len(ratings)
    if total == 0:
        return {
            "total_batches": 0,
            "pass_count": 0,
            "pass_rate": 0.0,
            "excellent_count": 0,
            "excellent_rate": 0.0,
            "first_count": 0,
            "second_count": 0,
            "unqualified_count": 0,
            "with_issue_count": 0,
            "avg_score": 0.0,
            "total_score": 0,
        }

    def count_key(key: str) -> int:
        return sum(1 for r in ratings if r["rating"] == key)

    pass_count = sum(1 for r in ratings if r["pass_status"] == "pass")
    excellent_count = count_key("excellent")
    first_count = count_key("first")
    second_count = count_key("second")
    unqualified_count = count_key("unqualified")
    total_score = sum(r["total_score"] for r in ratings)

    return {
        "total_batches": total,
        "pass_count": pass_count,
        "pass_rate": round(pass_count / total * 100, 2),
        "excellent_count": excellent_count,
        "excellent_rate": round(excellent_count / total * 100, 2),
        "first_count": first_count,
        "first_rate": round(first_count / total * 100, 2),
        "second_count": second_count,
        "second_rate": round(second_count / total * 100, 2),
        "unqualified_count": unqualified_count,
        "unqualified_rate": round(unqualified_count / total * 100, 2),
        "with_issue_count": sum(1 for r in ratings if r["issue_status"] == "withIssue"),
        "avg_score": round(total_score / total, 2),
        "total_score": total_score,
        "ratings": ratings,
    }


def extract_score_from_question(question: str) -> Optional[float]:
    """从「累计扣分 50 分」「扣 18 分」等问法中提取分数。"""
    patterns = [
        r"累计(?:扣分)?\s*([0-9]+(?:\.[0-9]+)?)\s*分",
        r"扣\s*分?\s*([0-9]+(?:\.[0-9]+)?)\s*分",
        r"([0-9]+(?:\.[0-9]+)?)\s*分",
    ]
    for pattern in patterns:
        match = re.search(pattern, question)
        if match:
            try:
                return float(match.group(1))
            except ValueError:
                continue
    return None


def format_rating_rules() -> str:
    return (
        "依据《卷烟外在质量分级及评级规定》（QJ/ZY-GY.02-027-2023）5.3.1：\n"
        "产品外在质量按累计扣分评定。合格产品为累计扣分 ≤ 200 分，不合格产品为累计扣分 ＞ 200 分。\n"
        "合格产品再分为三级：\n"
        "- 优等品：累计扣分 ≤ 18 分\n"
        "- 一等品：累计扣分 ＞ 18 分且 ≤ 100 分\n"
        "- 二等品：累计扣分 ＞ 100 分且 ≤ 200 分"
    )


def explain_score(score: float) -> str:
    rated = rate_by_score(score)
    qualified_text = "合格产品" if rated["qualified"] else "不合格产品"
    return (
        f"{format_rating_rules()}\n\n"
        f"累计扣分 {rated['score']:g} 分，判定为{rated['label']}（{qualified_text}）。"
    )


def looks_like_rating_question(question: str) -> bool:
    q = question or ""
    # 具体缺陷名称/判定问法交给缺陷标准库，避免「缺支属于什么等级」被当成评级分值线
    try:
        from core.defect_standard import search_defects
        if search_defects(q, limit=1):
            return False
    except Exception:
        pass
    if any(k in q for k in RATING_KEYWORDS):
        return True
    if re.search(r"[0-9]+(?:\.[0-9]+)?\s*分", q) and any(
        k in q for k in ["优等", "一等", "二等", "不合格品", "评级", "分值线"]
    ):
        return True
    return False


def looks_like_batch_rating_question(question: str) -> bool:
    q = question or ""
    batch_hints = ["这个批次", "该批次", "本批次", "批次为什么", "为什么是优等", "为什么是一等", "为什么是二等", "为什么不合格"]
    return any(k in q for k in batch_hints)


def format_rating_distribution(summary: Dict[str, Any]) -> str:
    if not summary or summary.get("total_batches", 0) == 0:
        return "当前没有可评级的检验批次。"
    return (
        f"按 5.3.1 分值线：合格率 {summary['pass_rate']:.1f}%"
        f"（{summary['pass_count']}/{summary['total_batches']}），"
        f"优质率 {summary['excellent_rate']:.1f}%"
        f"（优等品 {summary['excellent_count']} 批）。\n"
        f"一等品 {summary['first_count']} 批，二等品 {summary['second_count']} 批，"
        f"不合格品 {summary['unqualified_count']} 批；"
        f"平均累计扣分 {summary['avg_score']:g} 分。"
    )
