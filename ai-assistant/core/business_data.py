"""
业务数据查询层

负责读取并分析当前质量管控系统中的真实质量数据。
支持从 JSON 文件或前端 API 获取数据。
"""
import json
import os
from pathlib import Path
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta

import requests

import config


def load_from_file(path: Path) -> List[Dict[str, Any]]:
    """从 JSON 文件加载过程质量记录"""
    if not path.exists():
        return []
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
    if isinstance(data, dict):
        # 可能是 { records: [...] } 的包装
        return data.get("records", data.get("data", []))
    return data if isinstance(data, list) else []


def load_from_api(url: str) -> List[Dict[str, Any]]:
    """从前端业务 API 获取数据"""
    try:
        resp = requests.get(url, timeout=10)
        resp.raise_for_status()
        data = resp.json()
        if isinstance(data, dict):
            return data.get("records", data.get("data", []))
        return data if isinstance(data, list) else []
    except Exception as e:
        print(f"Failed to load business data from API: {e}")
        return []


class BusinessDataProvider:
    """业务数据提供者"""

    def __init__(self, data_source: Optional[Path] = None, api_url: Optional[str] = None):
        self.data_source = data_source
        self.api_url = api_url or config.BUSINESS_API_URL
        self._records: List[Dict[str, Any]] = []
        self._loaded = False

    def load(self) -> List[Dict[str, Any]]:
        """加载业务数据"""
        if self._loaded:
            return self._records

        if self.data_source and Path(self.data_source).exists():
            self._records = load_from_file(Path(self.data_source))
        elif self.api_url:
            self._records = load_from_api(self.api_url)
        else:
            # 尝试从常见位置自动发现
            candidates = [
                Path(config.BASE_DIR) / "data" / "process_quality_records.json",
                Path(config.BASE_DIR).parent / "data" / "process_quality_records.json",
            ]
            for c in candidates:
                if c.exists():
                    self._records = load_from_file(c)
                    break

        self._loaded = True
        return self._records

    def get_records(self) -> List[Dict[str, Any]]:
        return self.load()

    def filter_by_date(
        self,
        records: List[Dict[str, Any]],
        date_from: Optional[str] = None,
        date_to: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """按日期范围过滤记录"""
        result = records
        if date_from:
            result = [r for r in result if r.get("inspectionDate", "") >= date_from]
        if date_to:
            result = [r for r in result if r.get("inspectionDate", "") <= date_to]
        return result

    def filter_by_field(
        self,
        records: List[Dict[str, Any]],
        field: str,
        value: Any,
    ) -> List[Dict[str, Any]]:
        if not value or value == "全部":
            return records
        return [r for r in records if r.get(field) == value]

    def get_date_range(self, range_type: str) -> tuple:
        """根据范围类型返回起止日期"""
        today = datetime.now().date()
        if range_type == "today":
            d = today.isoformat()
            return d, d
        elif range_type == "week":
            start = today - timedelta(days=today.weekday())
            end = start + timedelta(days=6)
            return start.isoformat(), end.isoformat()
        elif range_type == "month":
            start = today.replace(day=1)
            end = (start.replace(month=start.month + 1, day=1) - timedelta(days=1)) if start.month < 12 else today.replace(month=12, day=31)
            return start.isoformat(), end.isoformat()
        elif range_type == "last_month":
            first_this = today.replace(day=1)
            last_month_end = first_this - timedelta(days=1)
            last_month_start = last_month_end.replace(day=1)
            return last_month_start.isoformat(), last_month_end.isoformat()
        else:
            d = today.isoformat()
            return d, d

    def aggregate_basic(self, records: List[Dict[str, Any]]) -> Dict[str, Any]:
        """基础统计"""
        total = len(records)
        if total == 0:
            return {
                "total_batches": 0,
                "total_defects": 0,
                "defect_batches": 0,
                "machines": [],
                "brands": [],
            }

        total_defects = 0
        defect_batches = 0
        machines = set()
        brands = set()

        for r in records:
            machines.add(r.get("machine", ""))
            brands.add(r.get("brand", ""))
            defects = (
                (r.get("boxDefects") or [])
                + (r.get("cartonDefects") or [])
                + (r.get("packDefects") or [])
                + (r.get("cigaretteDefects") or [])
            )
            qty = sum(d.get("quantity", 1) for d in defects)
            total_defects += qty
            if qty > 0:
                defect_batches += 1

        return {
            "total_batches": total,
            "total_defects": total_defects,
            "defect_batches": defect_batches,
            "defect_rate": round(defect_batches / total * 100, 2) if total else 0,
            "machines": sorted(m for m in machines if m),
            "brands": sorted(b for b in brands if b),
        }

    def top_defects(
        self,
        records: List[Dict[str, Any]],
        top_n: int = 5,
    ) -> List[Dict[str, Any]]:
        """缺陷数量 TOP N"""
        counter: Dict[str, Dict[str, Any]] = {}
        for r in records:
            defects = (
                (r.get("boxDefects") or [])
                + (r.get("cartonDefects") or [])
                + (r.get("packDefects") or [])
                + (r.get("cigaretteDefects") or [])
            )
            for d in defects:
                key = f"{d.get('location', '')}::{d.get('defectName', '')}"
                if key not in counter:
                    counter[key] = {
                        "name": d.get("defectName"),
                        "location": d.get("location"),
                        "category": d.get("category"),
                        "count": 0,
                    }
                counter[key]["count"] += d.get("quantity", 1)

        return sorted(counter.values(), key=lambda x: x["count"], reverse=True)[:top_n]

    def machine_comparison(
        self,
        records: List[Dict[str, Any]],
    ) -> List[Dict[str, Any]]:
        """机台质量对比"""
        groups: Dict[str, List[Dict[str, Any]]] = {}
        for r in records:
            m = r.get("machine", "未知")
            groups.setdefault(m, []).append(r)

        result = []
        for machine, rs in groups.items():
            agg = self.aggregate_basic(rs)
            result.append({
                "machine": machine,
                "batch_count": agg["total_batches"],
                "defect_count": agg["total_defects"],
                "defect_rate": agg["defect_rate"],
            })
        return sorted(result, key=lambda x: x["defect_rate"])


if __name__ == "__main__":
    provider = BusinessDataProvider()
    records = provider.get_records()
    print(f"Loaded {len(records)} records")
    if records:
        print(provider.aggregate_basic(records))
