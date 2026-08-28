"""
智质通 LangGraph 状态定义
"""
from typing import List, Dict, Any, Optional, TypedDict


class ZhiZhiState(TypedDict, total=False):
    # 用户输入
    question: str
    original_question: str
    history: List[Dict[str, Any]]
    inherited_context: Dict[str, Any]

    # 问题分类
    question_type: str  # knowledge / business / combined / physical_standard / out_of_scope

    # 具体场景
    scenario: str  # today_quality / machine_focus / machine_best / machine_worst / brand_trend / physical_deviation / physical_standard / quality_decline / combined / knowledge

    # 前端传入的系统真实数据
    process_records: List[Dict[str, Any]]
    physical_records: List[Dict[str, Any]]

    # 知识库检索结果
    knowledge_results: List[Dict[str, Any]]

    # 业务数据查询结果
    business_results: Dict[str, Any]
    business_query_params: Dict[str, Any]

    # 检索/数据充分性判断
    is_sufficient: bool

    # 最终输出
    answer: str
    sources: List[Dict[str, Any]]
    reasoning: str

    # 后台分析日志用
    analysis_log: Dict[str, Any]
