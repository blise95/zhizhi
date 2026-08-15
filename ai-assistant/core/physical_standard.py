"""
烟支物测标准库

统一读取并解析 public/data/cigarette_physical_standards.json，
为后端 AI 分析、合格判定、趋势预测等提供标准数据。
"""
import json
import re
from pathlib import Path
from typing import Dict, Any, Optional, List

import config


_PHYSICAL_STANDARDS_PATH = Path(config.BASE_DIR).parent / "public" / "data" / "cigarette_physical_standards.json"

_library: Optional[Dict[str, Any]] = None


_INDICATOR_KEY_MAP = {
    "length": ["length", "长度"],
    "circumference": ["circumference", "烟支圆周", "圆周"],
    "drawResistance": ["drawresistance", "吸阻"],
    "weight": ["weight", "重量"],
    "ventilation": ["ventilation", "通风度"],
}


def _load_library() -> Dict[str, Any]:
    global _library
    if _library is not None:
        return _library

    if not _PHYSICAL_STANDARDS_PATH.exists():
        raise RuntimeError(f"烟支物测标准库未找到: {_PHYSICAL_STANDARDS_PATH}")

    with open(_PHYSICAL_STANDARDS_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)

    _library = data
    return _library


def reload_library() -> None:
    """强制重新加载标准库"""
    global _library
    _library = None
    _load_library()


def get_metadata() -> Dict[str, Any]:
    return _load_library().get("metadata", {})


def get_all_brands() -> List[str]:
    return list(_load_library().get("standards", {}).keys())


def normalize_indicator_key(name: str) -> Optional[str]:
    s = str(name).strip().lower()
    for key, aliases in _INDICATOR_KEY_MAP.items():
        if s in [a.lower() for a in aliases]:
            return key
    return None


def get_brand_standards(brand: str) -> Optional[Dict[str, Any]]:
    lib = _load_library()
    return lib.get("standards", {}).get(brand)


def get_indicator_standard(brand: str, indicator: str) -> Optional[Dict[str, Any]]:
    """获取某牌号某指标的标准，indicator 支持 key 或中文名"""
    key = normalize_indicator_key(indicator)
    if not key:
        return None
    brand_std = get_brand_standards(brand)
    if not brand_std:
        return None
    return brand_std.get("indicators", {}).get(key)


def check_value(brand: str, indicator: str, value: float) -> str:
    """判定单个检测值是否合格：合格 / 不合格 / 无标准"""
    std = get_indicator_standard(brand, indicator)
    if not std:
        return "无标准"
    s = std.get("standard", {})
    min_v = s.get("min")
    max_v = s.get("max")
    if min_v is None or max_v is None:
        return "无标准"
    return "合格" if min_v <= value <= max_v else "不合格"


def calc_deviation(brand: str, indicator: str, value: float) -> Optional[float]:
    """计算检测值相对标准中心值的偏差"""
    std = get_indicator_standard(brand, indicator)
    if not std:
        return None
    center = std.get("standard", {}).get("value")
    if center is None:
        return None
    return round(value - center, 6)


def format_standard(std: Optional[Dict[str, Any]]) -> str:
    if not std:
        return "无标准"
    s = std.get("standard", {})
    raw = s.get("raw")
    if raw:
        return raw
    value = s.get("value")
    tolerance = s.get("tolerance")
    unit = std.get("unit", "")
    if value is not None and tolerance is not None:
        return f"{value}±{tolerance}{unit}"
    return "无标准"


def format_range(std: Optional[Dict[str, Any]]) -> str:
    if not std:
        return "无标准"
    s = std.get("standard", {})
    min_v = s.get("min")
    max_v = s.get("max")
    unit = std.get("unit", "")
    if min_v is not None and max_v is not None:
        return f"{min_v} ~ {max_v} {unit}"
    return format_standard(std)
