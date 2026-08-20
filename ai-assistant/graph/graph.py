"""
智合 LangGraph 工作流编排

工作流：
  classify_question
       |
       v
  ┌──┴──┬───────────┐
  v     v           v
retrieve query_data  fallback
  |       |
  v       v
  check_sufficiency
       |
       v
  generate / fallback

说明：
- 前端在调用 /ask 时传入 context（process_records / physical_records），
  query_data 节点优先使用这些系统真实数据；
- combined 类型先检索知识，再查数据，最后综合分析；
- 最终答案不暴露技术来源。
"""
from typing import Dict, Any, List, Optional

from langgraph.graph import StateGraph, END

from graph.state import ZhiZhiState
from graph.nodes import (
    classify_question,
    retrieve_knowledge,
    query_business_data,
    check_sufficiency,
    generate_answer,
    fallback_answer,
)
from core.business_data import BusinessDataProvider


class ZhiZhiAssistant:
    """智合助手封装"""

    def __init__(self, retriever: Any, data_provider: BusinessDataProvider):
        self.retriever = retriever
        self.data_provider = data_provider
        self.graph = build_zhizhi_graph(retriever, data_provider)

    def ask(
        self,
        question: str,
        process_records: Optional[List[Dict[str, Any]]] = None,
        physical_records: Optional[List[Dict[str, Any]]] = None,
    ) -> Dict[str, Any]:
        """提问入口

        Args:
            question: 用户问题
            process_records: 前端传入的过程质量记录（来自 localStorage）
            physical_records: 前端传入的烟支物测记录（来自 localStorage）
        """
        state: Dict[str, Any] = {
            "question": question,
            "process_records": process_records or [],
            "physical_records": physical_records or [],
        }
        final_state = self.graph.invoke(state)
        return {
            "question": question,
            "question_type": final_state.get("question_type"),
            "scenario": final_state.get("scenario"),
            "answer": final_state.get("answer", ""),
            "sources": [],  # 前台不展示来源
            "reasoning": final_state.get("reasoning", ""),
            "business_results": final_state.get("business_results", {}),
            "analysis_log": final_state.get("analysis_log", {}),
        }


def build_zhizhi_graph(
    retriever: Any,
    data_provider: BusinessDataProvider,
) -> StateGraph:
    """构建智合问答工作流"""

    workflow = StateGraph(ZhiZhiState)

    # 注册节点
    workflow.add_node("classify", classify_question)
    workflow.add_node("retrieve", lambda state: retrieve_knowledge(state, retriever))
    workflow.add_node("query_data", lambda state: query_business_data(state, data_provider))
    workflow.add_node("check", check_sufficiency)
    workflow.add_node("generate", generate_answer)
    workflow.add_node("fallback", fallback_answer)

    # 入口
    workflow.set_entry_point("classify")

    def route_after_classify(state: Dict[str, Any]):
        qtype = state.get("question_type", "combined")
        if qtype == "knowledge":
            return "retrieve"
        if qtype == "business":
            return "query_data"
        if qtype == "combined":
            return "retrieve"  # 先检索知识，再去查数据
        if qtype == "physical_standard":
            return "query_data"  # 通过标准库回答
        if qtype == "rating_standard":
            return "query_data"  # 通过 5.3.1 分值线回答
        if qtype == "defect_standard":
            return "query_data"  # 通过缺陷判定标准库回答
        return "fallback"  # out_of_scope

    workflow.add_conditional_edges(
        "classify",
        route_after_classify,
        {
            "retrieve": "retrieve",
            "query_data": "query_data",
            "fallback": "fallback",
        },
    )

    # combined 类型在 retrieve 后继续查数据
    def route_after_retrieve(state: Dict[str, Any]):
        qtype = state.get("question_type", "combined")
        return "query_data" if qtype == "combined" else "check"

    workflow.add_conditional_edges(
        "retrieve",
        route_after_retrieve,
        {
            "query_data": "query_data",
            "check": "check",
        },
    )

    # query_data 后统一进入 check
    workflow.add_edge("query_data", "check")

    # check 后根据充分性决定生成答案或兜底
    workflow.add_conditional_edges(
        "check",
        lambda state: "generate" if state.get("is_sufficient") else "fallback",
        {
            "generate": "generate",
            "fallback": "fallback",
        },
    )

    workflow.add_edge("generate", END)
    workflow.add_edge("fallback", END)

    return workflow.compile()


if __name__ == "__main__":
    import config
    from core.vectorstore import QualityVectorStore

    vs = QualityVectorStore(config.VECTOR_STORE_PATH)
    retriever = QualityRetriever(vs)
    provider = BusinessDataProvider()

    assistant = ZhiZhiAssistant(retriever, provider)
    result = assistant.ask("缺支属于什么等级的缺陷？")
    print("=" * 60)
    print(result["answer"])
    print("=" * 60)
    print(result["reasoning"])
