"""
智质通 LangGraph 状态定义
"""
from typing import List, Dict, Any, Optional, TypedDict


class ZhiZhiState(TypedDict, total=False):
    # 用户输入
    question: str

    # 问题分类
    question_type: str  # knowledge / business / combined / out_of_scope

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
