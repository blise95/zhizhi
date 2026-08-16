"""
智合 AI 质量综合分析服务

基于系统真实质量数据（过程质量、烟支物测）与烟支物测标准库，
为智合 AI 提供结构化分析能力：
- 今日/近期质量总结
- 机台质量排名与关注建议
- 牌号质量趋势
- 物测指标偏离与合格判定
- 质量下降原因线索

禁止编造数据；数据不足时明确告知。
"""
import json
import re
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple

import config
from core.physical_standard import (
    get_all_brands,
    get_brand_standards,
    get_indicator_standard,
    normalize_indicator_key,
    check_value,
    format_standard,
    format_range,
)


# -------------------- 数据加载 --------------------

def parse_date(date_str: str) -> Optional[datetime]:
    """解析多种日期格式"""
    if not date_str:
        return None
    formats = ["%Y-%m-%d", "%Y/%m/%d", "%Y-%m-%dT%H:%M:%S", "%Y-%m-%d %H:%M:%S"]
    for fmt in formats:
        try:
            return datetime.strptime(date_str[:len(fmt.replace("%", "")) + 4], fmt)
        except Exception:
            continue
    return None


def get_record_date(record: Dict[str, Any]) -> Optional[str]:
    """统一获取记录日期字段"""
    for key in ["inspectionDate", "date", "testDate", "createdAt"]:
        if key in record and record[key]:
            val = record[key]
            if isinstance(val, str):
                return val[:10]
    return None


def filter_by_date_range(
    records: List[Dict[str, Any]], date_from: Optional[str], date_to: Optional[str]
) -> List[Dict[str, Any]]:
    """按日期范围过滤记录"""
    result = records
    if date_from:
        result = [r for r in result if (get_record_date(r) or "") >= date_from]
    if date_to:
        result = [r for r in result if (get_record_date(r) or "") <= date_to]
    return result


def extract_date_range(question: str) -> Tuple[Optional[str], Optional[str]]:
    """从问题中提取日期范围"""
    today = datetime.now().date()
    q = question.lower()

    if any(k in q for k in ["今天", "今日", "当天"]):
        d = today.isoformat()
        return d, d

    if any(k in q for k in ["本周", "这周", "最近一周"]):
        start = today - timedelta(days=today.weekday())
        end = start + timedelta(days=6)
        return start.isoformat(), end.isoformat()

    if any(k in q for k in ["本月", "这个月", "最近一个月"]):
        start = today.replace(day=1)
        end = (start.replace(month=start.month + 1, day=1) - timedelta(days=1)) if start.month < 12 else today.replace(month=12, day=31)
        return start.isoformat(), end.isoformat()

    if any(k in q for k in ["上月", "上个月"]):
        first_this = today.replace(day=1)
        last_month_end = first_this - timedelta(days=1)
        last_month_start = last_month_end.replace(day=1)
        return last_month_start.isoformat(), last_month_end.isoformat()

    if any(k in q for k in ["最近", "近期"]):
        # 默认最近 30 天
        start = (today - timedelta(days=30)).isoformat()
        return start, today.isoformat()

    # 尝试匹配 "X月份"
    month_match = re.search(r"(\d{1,2})\s*月份?", question)
    if month_match:
        month = int(month_match.group(1))
        if 1 <= month <= 12:
            year = today.year
            start = datetime(year, month, 1).date()
            if month < 12:
                end = (datetime(year, month + 1, 1) - timedelta(days=1)).date()
            else:
                end = datetime(year, 12, 31).date()
            return start.isoformat(), end.isoformat()

    # 默认最近 30 天
    start = (today - timedelta(days=30)).isoformat()
    return start, today.isoformat()


# -------------------- 过程质量数据分析 --------------------

def collect_defects(record: Dict[str, Any]) -> List[Dict[str, Any]]:
    """汇总一条记录中的所有缺陷"""
    defects = []
    for field in ["boxDefects", "cartonDefects", "packDefects", "cigaretteDefects"]:
        for d in record.get(field, []) or []:
            defects.append(d)
    return defects


def summarize_process_quality(records: List[Dict[str, Any]]) -> Dict[str, Any]:
    """过程质量数据基础汇总"""
    total = len(records)
    if total == 0:
        return {
            "total_batches": 0,
            "total_defects": 0,
            "defect_batches": 0,
            "defect_rate": 0.0,
            "machines": [],
            "brands": [],
            "production_points": [],
        }

    total_defects = 0
    defect_batches = 0
    machines = set()
    brands = set()
    points = set()

    for r in records:
        machines.add(r.get("machine", "") or "")
        brands.add(r.get("brand", "") or "")
        points.add(r.get("productionPoint", "") or "")
        defects = collect_defects(r)
        qty = sum(d.get("quantity", 1) for d in defects)
        total_defects += qty
        if qty > 0:
            defect_batches += 1

    return {
        "total_batches": total,
        "total_defects": total_defects,
        "defect_batches": defect_batches,
        "defect_rate": round(defect_batches / total * 100, 2) if total else 0.0,
        "machines": sorted(m for m in machines if m),
        "brands": sorted(b for b in brands if b),
        "production_points": sorted(p for p in points if p),
    }


def top_defects(records: List[Dict[str, Any]], top_n: int = 5) -> List[Dict[str, Any]]:
    """缺陷数量 TOP N"""
    counter: Dict[str, Dict[str, Any]] = {}
    for r in records:
        for d in collect_defects(r):
            key = f"{d.get('location', '')}::{d.get('defectName', '')}"
            if key not in counter:
                counter[key] = {
                    "name": d.get("defectName", ""),
                    "location": d.get("location", ""),
                    "category": d.get("category", ""),
                    "count": 0,
                }
            counter[key]["count"] += d.get("quantity", 1)
    return sorted(counter.values(), key=lambda x: x["count"], reverse=True)[:top_n]


def machine_comparison(records: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """机台质量对比（按缺陷率升序）"""
    groups: Dict[str, List[Dict[str, Any]]] = {}
    for r in records:
        m = r.get("machine", "未知") or "未知"
        groups.setdefault(m, []).append(r)

    result = []
    for machine, rs in groups.items():
        agg = summarize_process_quality(rs)
        result.append({
            "machine": machine,
            "batch_count": agg["total_batches"],
            "defect_count": agg["total_defects"],
            "defect_rate": agg["defect_rate"],
        })
    return sorted(result, key=lambda x: x["defect_rate"])


def brand_comparison(records: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """牌号质量对比"""
    groups: Dict[str, List[Dict[str, Any]]] = {}
    for r in records:
        b = r.get("brand", "未知") or "未知"
        groups.setdefault(b, []).append(r)

    result = []
    for brand, rs in groups.items():
        agg = summarize_process_quality(rs)
        result.append({
            "brand": brand,
            "batch_count": agg["total_batches"],
            "defect_count": agg["total_defects"],
            "defect_rate": agg["defect_rate"],
        })
    return sorted(result, key=lambda x: x["defect_rate"])


def brand_trend(records: List[Dict[str, Any]], brand: Optional[str] = None) -> Dict[str, Any]:
    """牌号历史趋势（按日聚合缺陷率）"""
    filtered = records
    if brand:
        filtered = [r for r in records if brand in str(r.get("brand", ""))]

    daily: Dict[str, Dict[str, Any]] = {}
    for r in filtered:
        d = get_record_date(r)
        if not d:
            continue
        if d not in daily:
            daily[d] = {"date": d, "batches": 0, "defect_batches": 0, "defects": 0}
        daily[d]["batches"] += 1
        defects = collect_defects(r)
        qty = sum(d_.get("quantity", 1) for d_ in defects)
        daily[d]["defects"] += qty
        if qty > 0:
            daily[d]["defect_batches"] += 1

    trend = sorted(daily.values(), key=lambda x: x["date"])
    for t in trend:
        t["defect_rate"] = round(t["defect_batches"] / t["batches"] * 100, 2) if t["batches"] else 0.0

    return {
        "brand": brand or "全部",
        "trend": trend,
        "summary": summarize_process_quality(filtered),
    }


# -------------------- 烟支物测数据分析 --------------------

def parse_number(value: Any) -> Optional[float]:
    """安全解析数值"""
    if value is None or value == "" or value == "-":
        return None
    try:
        return float(value)
    except Exception:
        return None


def summarize_physical_test(records: List[Dict[str, Any]]) -> Dict[str, Any]:
    """烟支物测数据汇总"""
    total = len(records)
    brands = set()
    machines = set()
    for r in records:
        brands.add(r.get("brand", "") or "")
        machines.add(r.get("machine", "") or "")

    return {
        "total_records": total,
        "brands": sorted(b for b in brands if b),
        "machines": sorted(m for m in machines if m),
    }


def physical_indicator_stats(records: List[Dict[str, Any]], indicator: str) -> Dict[str, Any]:
    """某物测指标的统计信息"""
    key = normalize_indicator_key(indicator)
    if not key:
        return {"error": "未知指标"}

    values = []
    for r in records:
        ind_data = r.get(key)
        if not isinstance(ind_data, dict):
            continue
        v = parse_number(ind_data.get("x"))
        if v is not None:
            values.append(v)

    if not values:
        return {"indicator": key, "count": 0, "avg": None, "min": None, "max": None, "sd": None}

    avg = sum(values) / len(values)
    min_v = min(values)
    max_v = max(values)
    variance = sum((v - avg) ** 2 for v in values) / len(values)
    sd = variance ** 0.5

    return {
        "indicator": key,
        "count": len(values),
        "avg": round(avg, 3),
        "min": round(min_v, 3),
        "max": round(max_v, 3),
        "sd": round(sd, 3),
    }


def physical_deviation_analysis(
    records: List[Dict[str, Any]], brand: Optional[str] = None
) -> List[Dict[str, Any]]:
    """物测指标偏离标准分析"""
    filtered = records
    if brand:
        filtered = [r for r in records if brand in str(r.get("brand", ""))]

    # 推断最相关牌号
    if not brand and filtered:
        brand_counts: Dict[str, int] = {}
        for r in filtered:
            b = r.get("brand", "")
            if b:
                brand_counts[b] = brand_counts.get(b, 0) + 1
        if brand_counts:
            brand = max(brand_counts.items(), key=lambda x: x[1])[0]

    indicators = ["length", "circumference", "drawResistance", "weight", "ventilation"]
    results = []

    for ind_key in indicators:
        stats = physical_indicator_stats(filtered, ind_key)
        std = get_indicator_standard(brand, ind_key) if brand else None
        if std is None and brand:
            # 尝试任意牌号
            for b in get_all_brands():
                std = get_indicator_standard(b, ind_key)
                if std:
                    break

        item: Dict[str, Any] = {
            "indicator": ind_key,
            "name": std.get("name", ind_key) if std else ind_key,
            "unit": std.get("unit", "") if std else "",
            "avg": stats.get("avg"),
            "min": stats.get("min"),
            "max": stats.get("max"),
            "count": stats.get("count", 0),
        }

        if std:
            s = std.get("standard", {})
            center = s.get("value")
            min_v = s.get("min")
            max_v = s.get("max")
            item["standard_center"] = center
            item["standard_min"] = min_v
            item["standard_max"] = max_v
            item["standard_display"] = format_standard(std)
            item["standard_range"] = format_range(std)

            if item["avg"] is not None and center is not None:
                item["deviation"] = round(item["avg"] - center, 3)
                item["deviation_rate"] = round((item["avg"] - center) / center * 100, 2) if center else None

            if item["avg"] is not None and min_v is not None and max_v is not None:
                item["result"] = "合格" if min_v <= item["avg"] <= max_v else "不合格"
                # 计算距离边界百分比
                if item["avg"] >= center:
                    span = max_v - center if max_v != center else 1
                    item["distance_to_boundary"] = round((max_v - item["avg"]) / span * 100, 1)
                else:
                    span = center - min_v if center != min_v else 1
                    item["distance_to_boundary"] = round((item["avg"] - min_v) / span * 100, 1)
        else:
            item["result"] = "无标准"

        results.append(item)

    return results


# -------------------- 综合分析 --------------------

def find_focus_machines(records: List[Dict[str, Any]], top_n: int = 3) -> List[Dict[str, Any]]:
    """找出需要重点关注的机台（缺陷率最高）"""
    cmp = machine_comparison(records)
    # 过滤批次为 0 的
    cmp = [m for m in cmp if m["batch_count"] > 0]
    if not cmp:
        return []
    # 按缺陷率降序取 top
    return sorted(cmp, key=lambda x: x["defect_rate"], reverse=True)[:top_n]


def find_best_machines(records: List[Dict[str, Any]], top_n: int = 3) -> List[Dict[str, Any]]:
    """找出质量最好的机台（缺陷率最低）"""
    cmp = machine_comparison(records)
    cmp = [m for m in cmp if m["batch_count"] > 0]
    if not cmp:
        return []
    return cmp[:top_n]


def analyze_quality_decline(records: List[Dict[str, Any]]) -> Dict[str, Any]:
    """分析质量下降原因线索"""
    if len(records) < 6:
        return {"sufficient": False, "reason": "数据量不足，至少需要 6 条记录才能判断趋势。"}

    # 按日期分组
    daily: Dict[str, List[Dict[str, Any]]] = {}
    for r in records:
        d = get_record_date(r)
        if not d:
            continue
        daily.setdefault(d, []).append(r)

    dates = sorted(daily.keys())
    if len(dates) < 2:
        return {"sufficient": False, "reason": "有效日期不足，无法判断趋势。"}

    # 计算前半段与后半段缺陷率
    mid = len(dates) // 2
    early_dates = dates[:mid]
    late_dates = dates[mid:]

    def calc_rate(date_list):
        total = 0
        defect_batches = 0
        for d in date_list:
            for r in daily[d]:
                total += 1
                if sum(d_.get("quantity", 1) for d_ in collect_defects(r)) > 0:
                    defect_batches += 1
        return round(defect_batches / total * 100, 2) if total else 0.0

    early_rate = calc_rate(early_dates)
    late_rate = calc_rate(late_dates)
    change = round(late_rate - early_rate, 2)

    # 后半段主要缺陷
    late_records = []
    for d in late_dates:
        late_records.extend(daily[d])
    top_defs = top_defects(late_records, 5)

    # 后半段机台变化
    late_machines = machine_comparison(late_records)
    machine_clues = sorted(late_machines, key=lambda x: x["defect_rate"], reverse=True)[:3]

    # 后半段牌号变化
    late_brands = brand_comparison(late_records)
    brand_clues = sorted(late_brands, key=lambda x: x["defect_rate"], reverse=True)[:3]

    return {
        "sufficient": True,
        "early_defect_rate": early_rate,
        "late_defect_rate": late_rate,
        "change": change,
        "trend": "下降" if change > 1 else ("改善" if change < -1 else "稳定"),
        "top_defects_in_late_period": top_defs,
        "machine_clues": machine_clues,
        "brand_clues": brand_clues,
    }


# -------------------- 自然语言答案生成 --------------------

def answer_today_quality(process_records: List[Dict[str, Any]]) -> str:
    """回答今日质量"""
    summary = summarize_process_quality(process_records)
    if summary["total_batches"] == 0:
        return "今天系统暂未录入质量检验记录，无法评估今日质量状况。"

    top = top_defects(process_records, 3)
    top_text = "、".join(f"{d['name']}({d['count']}次)" for d in top) if top else "暂无"

    status = "正常"
    if summary["defect_rate"] > 20:
        status = "异常"
    elif summary["defect_rate"] > 10:
        status = "需关注"
    elif summary["defect_rate"] > 5:
        status = "稳定"
    else:
        status = "良好"

    return (
        f"今日系统共录入 {summary['total_batches']} 批过程质量检验记录，"
        f"涉及机台 {', '.join(summary['machines']) if summary['machines'] else '无'}，"
        f"牌号 {', '.join(summary['brands']) if summary['brands'] else '无'}。\n"
        f"缺陷批次 {summary['defect_batches']} 批，缺陷率 {summary['defect_rate']:.2f}%，整体状态：{status}。\n"
        f"主要缺陷：{top_text}。"
    )


def answer_machine_focus(process_records: List[Dict[str, Any]]) -> str:
    """回答哪个机台需要重点关注"""
    focus = find_focus_machines(process_records, 3)
    if not focus:
        return "当前系统中没有足够的过程质量记录，无法判断哪个机台需要重点关注。"

    lines = ["根据近期系统数据，以下机台需要重点关注："]
    for i, m in enumerate(focus, 1):
        lines.append(
            f"{i}. {m['machine']}机台：检验 {m['batch_count']} 批，缺陷 {m['defect_count']} 个，缺陷率 {m['defect_rate']:.2f}%。"
        )

    # 给第一台机台附加主要缺陷
    first = focus[0]
    first_records = [r for r in process_records if r.get("machine") == first["machine"]]
    top = top_defects(first_records, 3)
    if top:
        lines.append(
            f"其中 {first['machine']}机台的主要问题为：" + "、".join(f"{d['name']}({d['count']}次)" for d in top) + "。"
        )

    return "\n".join(lines)


def answer_machine_ranking(process_records: List[Dict[str, Any]], best: bool = True) -> str:
    """回答哪个机台质量最好/最差"""
    if best:
        ranked = find_best_machines(process_records, 3)
        prefix = "质量最好"
    else:
        ranked = find_focus_machines(process_records, 3)
        prefix = "质量最差"

    if not ranked:
        return f"当前系统中没有足够的过程质量记录，无法判断哪个机台{prefix}。"

    lines = [f"根据近期系统数据，{prefix}的机台为："]
    for i, m in enumerate(ranked, 1):
        lines.append(
            f"{i}. {m['machine']}机台：缺陷率 {m['defect_rate']:.2f}%（{m['batch_count']} 批，{m['defect_count']} 个缺陷）"
        )
    return "\n".join(lines)


def answer_brand_trend(process_records: List[Dict[str, Any]], brand: Optional[str]) -> str:
    """回答牌号趋势"""
    if brand:
        trend = brand_trend(process_records, brand)
        summary = trend["summary"]
        if summary["total_batches"] == 0:
            return f"系统中没有找到牌号 {brand} 的近期质量记录。"

        data_points = trend["trend"]
        if len(data_points) >= 2:
            first = data_points[0]["defect_rate"]
            last = data_points[-1]["defect_rate"]
            change = round(last - first, 2)
            direction = "上升" if change > 1 else ("下降" if change < -1 else "稳定")
            return (
                f"牌号 {brand} 近期共有 {summary['total_batches']} 批检验记录，"
                f"缺陷率 {summary['defect_rate']:.2f}%。\n"
                f"从 {data_points[0]['date']} 到 {data_points[-1]['date']}，"
                f"缺陷率由 {first:.2f}% 变为 {last:.2f}%（{direction} {abs(change):.2f}%）。"
            )
        return (
            f"牌号 {brand} 近期共有 {summary['total_batches']} 批检验记录，"
            f"缺陷率 {summary['defect_rate']:.2f}%。"
        )

    # 未指定牌号，给出所有牌号对比
    cmp = brand_comparison(process_records)
    if not cmp:
        return "当前系统中没有足够的过程质量记录。"

    lines = ["近期各牌号质量对比："]
    for c in cmp:
        lines.append(
            f"- {c['brand']}：缺陷率 {c['defect_rate']:.2f}%（{c['batch_count']} 批，{c['defect_count']} 个缺陷）"
        )
    return "\n".join(lines)


def answer_physical_standard_question(question: str) -> str:
    """回答物测标准问题（兼容旧逻辑）"""
    from core.physical_standard import (
        get_indicator_standard,
        get_brand_standards,
        check_value,
        calc_deviation,
        format_standard,
        format_range,
    )

    # 提取牌号
    brand = None
    for b in get_all_brands():
        if b in question:
            brand = b
            break

    # 提取指标
    indicator = None
    for ind in ["长度", "圆周", "烟支圆周", "吸阻", "重量", "通风度"]:
        if ind in question:
            indicator = normalize_indicator_key(ind)
            break

    if not brand:
        return (
            "请提供需要查询的牌号。当前标准库包含以下牌号：\n"
            + "、".join(get_all_brands())
            + "\n\n例如：\"摩登（细支）的重量标准是多少？\""
        )

    std = get_indicator_standard(brand, indicator) if indicator else None
    if indicator and std:
        value_match = re.search(r"([-+]?\d*\.?\d+)", question)
        if value_match:
            value = float(value_match.group(1))
            result = check_value(brand, indicator, value)
            dev = calc_deviation(brand, indicator, value)
            dev_text = f"，偏差 {dev}{std.get('unit', '')}" if dev is not None else ""
            return (
                f"牌号 {brand} 的 {std.get('name', indicator)} 标准为 {format_standard(std)}"
                f"（范围：{format_range(std)}）。\n"
                f"检测值 {value}{std.get('unit', '')} 判定结果：{result}{dev_text}。"
            )
        return (
            f"牌号 {brand} 的 {std.get('name', indicator)} 标准为 {format_standard(std)}，"
            f"标准范围：{format_range(std)}。"
        )

    # 未指定指标，返回全部
    brand_std = get_brand_standards(brand)
    if not brand_std:
        return f"未找到牌号 {brand} 的物测标准。"

    lines = [f"牌号 {brand} 的烟支物测标准如下："]
    for ind_key, ind_std in brand_std.get("indicators", {}).items():
        lines.append(
            f"- {ind_std.get('name', ind_key)}：{format_standard(ind_std)}（范围：{format_range(ind_std)}）"
        )
    return "\n".join(lines)


def answer_physical_deviation(
    physical_records: List[Dict[str, Any]], brand: Optional[str] = None
) -> str:
    """回答物测指标偏离问题"""
    if not physical_records:
        return "系统中暂无烟支物测检测记录，无法进行偏离分析。"

    analysis = physical_deviation_analysis(physical_records, brand)
    abnormal = [a for a in analysis if a.get("result") == "不合格"]
    near_boundary = [a for a in analysis if a.get("result") == "合格" and a.get("distance_to_boundary", 100) < 20]

    if not analysis:
        return "当前系统中没有有效的烟支物测记录。"

    lines = []
    if brand:
        lines.append(f"牌号 {brand} 的烟支物测指标分析如下：")
    else:
        lines.append("近期烟支物测指标分析如下：")

    for a in analysis:
        if a.get("avg") is None:
            lines.append(f"- {a.get('name', a['indicator'])}：暂无有效检测数据。")
            continue
        std_text = f"标准 {a.get('standard_display', '无标准')}"
        result_text = a.get("result", "无标准")
        if result_text == "合格":
            lines.append(
                f"- {a.get('name', a['indicator'])}：平均值 {a['avg']}{a.get('unit', '')}，"
                f"{std_text}，判定 {result_text}，距离边界约 {a.get('distance_to_boundary', 0)}%。"
            )
        elif result_text == "不合格":
            lines.append(
                f"- {a.get('name', a['indicator'])}：平均值 {a['avg']}{a.get('unit', '')}，"
                f"{std_text}，判定 {result_text}，偏差 {a.get('deviation', 0)}{a.get('unit', '')}。"
            )
        else:
            lines.append(
                f"- {a.get('name', a['indicator'])}：平均值 {a['avg']}{a.get('unit', '')}，{std_text}。"
            )

    if abnormal:
        names = "、".join(a.get("name", a["indicator"]) for a in abnormal)
        lines.append(f"\n需要重点关注：{names} 已超出标准范围。")
    elif near_boundary:
        names = "、".join(a.get("name", a["indicator"]) for a in near_boundary)
        lines.append(f"\n提示：{names} 接近标准边界，建议持续监控。")

    return "\n".join(lines)


def answer_quality_decline(
    process_records: List[Dict[str, Any]],
    physical_records: List[Dict[str, Any]],
) -> str:
    """回答质量下降原因"""
    analysis = analyze_quality_decline(process_records)
    if not analysis.get("sufficient"):
        return f"{analysis.get('reason')}无法准确判断质量下降原因。"

    lines = [
        f"近期质量整体呈{analysis['trend']}趋势。",
        f"前半段缺陷率 {analysis['early_defect_rate']:.2f}%，后半段缺陷率 {analysis['late_defect_rate']:.2f}%，"
        f"变化 {analysis['change']:.2f}%。",
    ]

    top = analysis.get("top_defects_in_late_period", [])
    if top:
        lines.append("\n后期主要缺陷：")
        for d in top:
            lines.append(f"- {d['name']}（{d['count']} 次，部位 {d['location']}）")

    machines = analysis.get("machine_clues", [])
    if machines:
        lines.append("\n机台线索：")
        for m in machines:
            lines.append(f"- {m['machine']}机台缺陷率 {m['defect_rate']:.2f}%")

    brands = analysis.get("brand_clues", [])
    if brands:
        lines.append("\n牌号线索：")
        for b in brands:
            lines.append(f"- {b['brand']}缺陷率 {b['defect_rate']:.2f}%")

    # 物测线索
    if physical_records:
        phys = physical_deviation_analysis(physical_records)
        phys_abnormal = [p for p in phys if p.get("result") == "不合格"]
        if phys_abnormal:
            lines.append("\n物测指标线索：")
            for p in phys_abnormal:
                lines.append(
                    f"- {p['name']} 平均值 {p['avg']}{p['unit']}，超出标准范围 {p['standard_range']}"
                )

    lines.append("\n以上是基于系统数据的线索汇总，具体根因建议结合现场工艺进一步排查。")
    return "\n".join(lines)


# -------------------- 问题场景映射 --------------------

def detect_scenario(question: str) -> str:
    """识别用户问题的具体场景"""
    q = question.lower()

    # 今日质量
    if any(k in q for k in ["今天质量", "今日质量", "今天怎么样", "今日怎么样", "今天质量怎么样"]):
        return "today_quality"

    # 哪个机台需要重点关注
    if any(k in q for k in ["重点关注", "需要关注", "哪个机台", "哪台机", "机台质量"]):
        return "machine_focus"

    # 哪个机台质量最好
    if any(k in q for k in ["质量最好", "最好的机台", "最佳机台"]):
        return "machine_best"

    # 哪个机台质量最差
    if any(k in q for k in ["质量最差", "最差的机台"]):
        return "machine_worst"

    # 质量下降原因（优先于牌号趋势）
    if any(k in q for k in ["为什么下降", "质量为什么", "下降原因", "为什么变差", "质量下降"]):
        return "quality_decline"

    # 牌号趋势 / 牌号质量
    if any(k in q for k in ["牌号", "品牌", "摩登", "质量有没有下降", "趋势", "下降"]):
        if any(k in q for k in ["下降", "趋势", "怎么样", "如何"]):
            return "brand_trend"

    # 物测偏离
    if any(k in q for k in ["偏离", "超标", "不合格", "合格吗", "偏离标准", "哪个物测指标"]):
        if any(k in q for k in ["物测", "烟支", "长度", "圆周", "吸阻", "重量", "通风度"]):
            return "physical_deviation"

    # 物测标准
    if any(k in q for k in ["标准", "规格", "范围", "上限", "下限", "多少"]):
        if any(k in q for k in ["物测", "烟支", "长度", "圆周", "吸阻", "重量", "通风度"]):
            return "physical_standard"

    # 综合分析（默认）
    return "combined"


if __name__ == "__main__":
    # 简单测试
    print("available brands:", get_all_brands())
