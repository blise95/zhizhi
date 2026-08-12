"""
智质通 LangGraph 节点实现
"""
import json
import re
from typing import Dict, Any, List

from langchain_core.messages import HumanMessage, SystemMessage
from langchain_openai import ChatOpenAI
from langchain_ollama import ChatOllama

import config
from core.retriever import QualityRetriever
from core.business_data import BusinessDataProvider


def create_llm():
    """根据配置创建 LLM"""
    cfg = config.get_llm_config()
    provider = cfg["provider"]
    if provider == "ollama":
        return ChatOllama(
            model=cfg["model"],
            base_url=cfg["base_url"],
            temperature=0.1,
        )
    return ChatOpenAI(
        model=cfg["model"],
        api_key=cfg["api_key"],
        base_url=cfg["base_url"],
        temperature=0.1,
    )


_llm = None


def get_llm():
    global _llm
    if _llm is None:
        _llm = create_llm()
    return _llm


# ==================== 节点函数 ====================

def classify_question(state: Dict[str, Any]) -> Dict[str, Any]:
    """问题分类节点"""
    question = state["question"]
    system_prompt = """你是智质通AI助手的问题分类器。请判断用户问题属于以下哪一类，只输出 JSON：
{
  "type": "knowledge" | "business" | "combined" | "out_of_scope",
  "reason": "简短理由"
}
分类说明：
- knowledge：问题只涉及质量知识、标准、缺陷判定、评级规则等专业文档内容。
- business：问题涉及当前系统中的检验批次、合格率、优质率、缺陷统计、机台/品牌对比等数据。
- combined：问题需要结合文档知识和系统数据才能回答，如“本月优质率为什么下降”。
- out_of_scope：问题与质量管控系统、两个质量文档完全无关。
"""
    messages = [
        SystemMessage(content=system_prompt),
        HumanMessage(content=f"用户问题：{question}"),
    ]
    try:
        resp = get_llm().invoke(messages)
        content = resp.content.strip()
        # 尝试提取 JSON
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0].strip()
        elif "```" in content:
            content = content.split("```")[1].split("```")[0].strip()
        result = json.loads(content)
        return {"question_type": result.get("type", "combined")}
    except Exception:
        # 兜底：根据关键词判断
        q = question.lower()
        data_keywords = ["率", "多少", "哪个机台", "哪个品牌", "趋势", "排名", "批次", "本月", "本周", "今天"]
        knowledge_keywords = ["什么", "属于", "等级", "扣分", "判定", "标准", "规则", "依据"]
        has_data = any(k in q for k in data_keywords)
        has_knowledge = any(k in q for k in knowledge_keywords)
        if has_data and has_knowledge:
            return {"question_type": "combined"}
        elif has_data:
            return {"question_type": "business"}
        elif has_knowledge:
            return {"question_type": "knowledge"}
        return {"question_type": "out_of_scope"}


def retrieve_knowledge(state: Dict[str, Any], retriever: QualityRetriever) -> Dict[str, Any]:
    """知识库检索节点"""
    question = state["question"]
    results = retriever.retrieve(question, top_k=config.TOP_K_RERANK)
    return {"knowledge_results": results}


def _extract_date_range(question: str) -> tuple:
    """从问题中提取日期范围，返回 (date_from, date_to) 或 (None, None)"""
    q = question
    today_match = re.search(r"今天|今日", q)
    week_match = re.search(r"本周|这周|最近一周", q)
    month_match = re.search(r"本月|这个月", q)
    last_month_match = re.search(r"上月|上个月", q)

    provider = BusinessDataProvider()
    if today_match:
        return provider.get_date_range("today")
    if week_match:
        return provider.get_date_range("week")
    if month_match:
        return provider.get_date_range("month")
    if last_month_match:
        return provider.get_date_range("last_month")

    # 默认本月
    return provider.get_date_range("month")


def query_business_data(state: Dict[str, Any], provider: BusinessDataProvider) -> Dict[str, Any]:
    """业务数据查询节点"""
    question = state["question"]
    date_from, date_to = _extract_date_range(question)

    records = provider.get_records()
    filtered = provider.filter_by_date(records, date_from, date_to)

    # 提取机台/品牌过滤
    machine_match = re.search(r"(\d+#?机|#[机台])", question)
    brand_match = re.search(r"([\u4e00-\u9fa5]{2,6})(?:牌|品牌)", question)

    if machine_match:
        machine = machine_match.group(1).replace("机", "").replace("台", "").replace("#", "")
        # 支持 1# 格式
        filtered = [r for r in filtered if machine in str(r.get("machine", ""))]

    if brand_match:
        brand = brand_match.group(1)
        filtered = [r for r in filtered if brand in str(r.get("brand", ""))]

    agg = provider.aggregate_basic(filtered)
    top_defects = provider.top_defects(filtered, top_n=5)
    machine_cmp = provider.machine_comparison(filtered)

    return {
        "business_results": {
            "date_from": date_from,
            "date_to": date_to,
            "total_batches": agg["total_batches"],
            "total_defects": agg["total_defects"],
            "defect_batches": agg["defect_batches"],
            "defect_rate": agg["defect_rate"],
            "machines": agg["machines"],
            "brands": agg["brands"],
            "top_defects": top_defects,
            "machine_comparison": machine_cmp,
        },
        "business_query_params": {"date_from": date_from, "date_to": date_to},
    }


def check_sufficiency(state: Dict[str, Any]) -> Dict[str, Any]:
    """判断检索/数据是否充分"""
    qtype = state.get("question_type", "combined")
    knowledge = state.get("knowledge_results", [])
    business = state.get("business_results", {})

    if qtype == "knowledge":
        sufficient = len(knowledge) > 0
    elif qtype == "business":
        sufficient = business.get("total_batches", 0) > 0
    elif qtype == "combined":
        sufficient = len(knowledge) > 0 and business.get("total_batches", 0) > 0
    else:
        sufficient = False

    return {"is_sufficient": sufficient}


def generate_answer(state: Dict[str, Any]) -> Dict[str, Any]:
    """生成答案节点"""
    question = state["question"]
    qtype = state.get("question_type", "combined")
    knowledge = state.get("knowledge_results", [])
    business = state.get("business_results", {})

    # 构建知识上下文
    knowledge_text = "\n\n".join(
        f"[知识片段{i+1}] 来源：《{r['metadata'].get('doc_name', '未知文档')}》第{r['metadata'].get('page_number', '?')}页\n{r['text']}"
        for i, r in enumerate(knowledge)
    ) if knowledge else "无相关知识片段。"

    # 构建业务数据上下文
    business_text = json.dumps(business, ensure_ascii=False, indent=2) if business else "无业务数据。"

    system_prompt = """你是智质通，质量管控系统中的专业质量助手。
你的回答必须严格基于以下两类来源：
1. 用户提供的两个质量文档（知识库）；
2. 当前质量管控系统中的真实业务数据。
如果依据不足，必须明确告知无法回答，禁止编造。

推荐回答结构：
【结论】直接回答
【数据分析】引用系统数据（如适用）
【专业依据】引用文档规则（如适用）
【分析结果】综合判断
【知识来源】列出文档名称、章节、页码
"""

    prompt = f"""用户问题：{question}
问题类型：{qtype}

=== 知识库检索结果 ===
{knowledge_text}

=== 系统业务数据 ===
{business_text}

请根据以上信息生成专业回答。"""

    try:
        resp = get_llm().invoke([
            SystemMessage(content=system_prompt),
            HumanMessage(content=prompt),
        ])
        answer = resp.content
    except Exception as e:
        answer = f"调用模型生成回答时出错：{e}"

    sources = [
        {
            "doc_name": r["metadata"].get("doc_name", "未知文档"),
            "page_number": r["metadata"].get("page_number"),
            "section_title": r["metadata"].get("section_title", ""),
            "text": r["text"][:300],
        }
        for r in knowledge
    ]

    return {
        "answer": answer,
        "sources": sources,
        "reasoning": f"问题类型：{qtype}；检索到{len(knowledge)}条知识，{business.get('total_batches', 0)}条业务记录。",
    }


def fallback_answer(state: Dict[str, Any]) -> Dict[str, Any]:
    """无法回答时的兜底节点"""
    qtype = state.get("question_type", "combined")
    if qtype == "out_of_scope":
        answer = "该问题不在智质通的回答范围内。智质通只回答与卷烟质量管理、质量评级、缺陷判定及当前系统质量数据相关的问题。"
    else:
        answer = "根据当前知识库中的两个质量文档及系统数据，暂未找到该问题的充分依据，因此无法基于现有资料给出专业结论。"
    return {
        "answer": answer,
        "sources": [],
        "reasoning": "知识库检索或系统数据不足，触发兜底回答。",
    }
