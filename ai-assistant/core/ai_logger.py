"""
智合 AI 分析日志记录

后台保留每次问答的完整处理记录，包括：
- 用户问题
- 问题类型与场景
- 查询的系统数据摘要
- 使用的标准信息
- 检索到的知识片段
- AI 最终回答

日志仅用于后台排查，不向前台暴露。
"""
import json
import os
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, List, Optional

import config


LOG_DIR = Path(config.BASE_DIR) / "data" / "ai_logs"
LOG_DIR.mkdir(parents=True, exist_ok=True)


def _now_str() -> str:
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")


def _sanitize_for_log(data: Any) -> Any:
    """对日志中的大数据进行截断，避免日志过大"""
    if isinstance(data, list):
        if len(data) > 200:
            return {
                "_truncated": True,
                "total": len(data),
                "sample": data[:10],
            }
        return data
    if isinstance(data, dict):
        return {k: _sanitize_for_log(v) for k, v in data.items()}
    return data


def log_ask(
    question: str,
    question_type: Optional[str],
    scenario: Optional[str],
    answer: str,
    process_records_count: int = 0,
    physical_records_count: int = 0,
    business_results: Optional[Dict[str, Any]] = None,
    knowledge_results: Optional[List[Dict[str, Any]]] = None,
    analysis_log: Optional[Dict[str, Any]] = None,
    error: Optional[str] = None,
) -> None:
    """记录一次问答日志"""
    try:
        entry = {
            "timestamp": _now_str(),
            "question": question,
            "question_type": question_type,
            "scenario": scenario,
            "answer": answer,
            "process_records_count": process_records_count,
            "physical_records_count": physical_records_count,
            "business_results": _sanitize_for_log(business_results or {}),
            "knowledge_results": _sanitize_for_log([
                {
                    "metadata": r.get("metadata", {}),
                    "text": r.get("text", "")[:500],
                }
                for r in (knowledge_results or [])
            ]),
            "analysis_log": _sanitize_for_log(analysis_log or {}),
        }
        if error:
            entry["error"] = error

        date_str = datetime.now().strftime("%Y-%m-%d")
        log_file = LOG_DIR / f"ask_log_{date_str}.jsonl"
        with open(log_file, "a", encoding="utf-8") as f:
            f.write(json.dumps(entry, ensure_ascii=False) + "\n")
    except Exception as e:
        # 日志记录失败不应影响主流程
        print(f"[ai_logger] failed to write log: {e}")
