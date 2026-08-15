"""
智质通 LangGraph 节点实现
"""
import json
import re
from typing import Dict, Any, List, Optional

from langchain_core.messages import HumanMessage, SystemMessage, AIMessage
from langchain_openai import ChatOpenAI
from langchain_ollama import ChatOllama

import config
from core.retriever import QualityRetriever
from core.business_data import BusinessDataProvider


class MockLLM:
    """本地演示 LLM：无需外部模型，直接基于检索结果生成结构化回答"""

    def invoke(self, messages: List[Any]) -> AIMessage:
        # 提取系统提示和用户问题中的关键信息
        user_content = ""
        for m in messages:
            if isinstance(m, HumanMessage):
                user_content = m.content
                break

        # 解析提示中的知识片段、业务数据和问题
        question = self._extract_field(user_content, "用户问题：", "\n问题类型：")
        qtype = self._extract_field(user_content, "问题类型：", "\n\n=== 知识库检索结果 ===")
        knowledge_block = self._extract_field(user_content, "=== 知识库检索结果 ===", "\n\n=== 系统业务数据 ===")
        business_block = self._extract_field(user_content, "=== 系统业务数据 ===", "\n\n请根据以上信息生成专业回答。")

        answer = self._compose_answer(question, qtype, knowledge_block, business_block)
        return AIMessage(content=answer)

    def _extract_field(self, text: str, start: str, end: str) -> str:
        if start not in text:
            return ""
        s = text.find(start) + len(start)
        e = text.find(end, s)
        return text[s:e if e > s else len(text)].strip()

    def _compose_answer(self, question: str, qtype: str, knowledge_block: str, business_block: str) -> str:
        # 解析知识片段
        knowledge_items = []
        for line in knowledge_block.split("\n"):
            line = line.strip()
            if line.startswith("[知识片段"):
                knowledge_items.append(line)

        # 解析业务数据
        business = {}
        try:
            if business_block and business_block not in ["无业务数据。", "", "null"]:
                business = json.loads(business_block)
        except Exception:
            business = {}

        # 按问题类型生成回答
        if qtype == "knowledge":
            return self._knowledge_answer(question, knowledge_block)
        if qtype == "business":
            return self._business_answer(question, business)
        if qtype == "combined":
            k = self._knowledge_answer(question, knowledge_block)
            b = self._business_answer(question, business)
            return f"【结论】\n{k}\n\n【数据分析】\n{b}\n\n【分析结果】\n以上是基于当前知识库与系统数据的综合分析。"
        return "该问题不在智合的回答范围内。智合只回答与卷烟质量管理、质量评级、缺陷判定及当前系统质量数据相关的问题。"

    def _knowledge_answer(self, question: str, knowledge_block: str) -> str:
        if not knowledge_block or knowledge_block == "无相关知识片段。":
            return "根据当前知识库中的两个质量文档，暂未找到该问题的充分依据，因此无法基于现有资料给出专业结论。"

        # 按 [知识片段] 分割，提取每个片段的文本内容
        pattern = r'\n?\[知识片段\d+\]\s*来源：《[^》]+》第[^\n]+\n'
        segments = re.split(pattern, knowledge_block)
        contents = []
        for seg in segments:
            seg = seg.strip()
            if seg and seg not in contents:
                contents.append(seg)

        if not contents:
            return "根据当前知识库中的两个质量文档，暂未找到该问题的充分依据，因此无法基于现有资料给出专业结论。"

        # 取前 5 个片段去重摘要
        summary = "\n\n".join(f"{i + 1}. {c[:400]}" for i, c in enumerate(contents[:5]))
        return (
            "【结论】\n"
            "根据《卷烟外在质量分级及评级规定》和《卷烟外在质量缺陷判定》两个文档的检索结果，分析如下：\n\n"
            f"{summary}\n\n"
            "【专业依据】\n"
            "以上内容来自质量文档中的缺陷判定与评级规则，回答严格依据文档原文。"
        )

    def _business_answer(self, question: str, business: Dict[str, Any]) -> str:
        total = business.get("total_batches", 0)
        if total == 0:
            return "当前筛选条件下没有找到业务记录。"
        defects = business.get("total_defects", 0)
        rate = business.get("defect_rate", 0)
        machines = business.get("machines", [])
        brands = business.get("brands", [])
        top = business.get("top_defects", [])
        top_text = "、".join(f"{d['name']}({d['count']}次)" for d in top[:3]) if top else "暂无"
        return (
            f"当前统计周期内共有 {total} 批检验记录，累计缺陷 {defects} 个，缺陷率 {rate:.2f}%。\n"
            f"涉及机台：{', '.join(machines) if machines else '无'}；涉及牌号：{', '.join(brands) if brands else '无'}。\n"
            f"主要缺陷：{top_text}。"
        )


def create_llm():
    """根据配置创建 LLM"""
    cfg = config.get_llm_config()
    provider = cfg["provider"]
    if provider == "mock":
        return MockLLM()
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

    # 先通过关键词判断是否为烟支物测标准问题
    q = question.lower()
    physical_keywords = [
        "烟支", "物测", "长度", "圆周", "吸阻", "重量", "通风度",
        "physical", "cigarette", "ventilation", "circumference", "draw resistance"
    ]
    standard_keywords = ["标准", "规格", "范围", "上限", "下限", "合格", "超标", "偏差", "多少"]
    has_physical = any(k in q for k in physical_keywords)
    has_standard = any(k in q for k in standard_keywords)
    if has_physical and has_standard:
        return {"question_type": "physical_standard"}

    system_prompt = """你是智合AI助手的问题分类器。请判断用户问题属于以下哪一类，只输出 JSON：
{
  "type": "knowledge" | "business" | "combined" | "physical_standard" | "out_of_scope",
  "reason": "简短理由"
}
分类说明：
- knowledge：问题只涉及质量知识、标准、缺陷判定、评级规则等专业文档内容。
- business：问题涉及当前系统中的检验批次、合格率、优质率、缺陷统计、机台/品牌对比等数据。
- combined：问题需要结合文档知识和系统数据才能回答，如“本月优质率为什么下降”。
- physical_standard：问题涉及烟支物测指标标准（长度、圆周、吸阻、重量、通风度）、标准范围、合格判定等。
- out_of_scope：问题与质量管控系统、两个质量文档、烟支物测标准完全无关。
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
    elif qtype == "physical_standard":
        sufficient = True
    else:
        sufficient = False

    return {"is_sufficient": sufficient}


def _extract_brand(question: str) -> Optional[str]:
    """从问题中提取牌号（中文名或内部 value）"""
    from core.physical_standard import get_all_brands
    brands = get_all_brands()
    # 优先匹配完整中文名
    for b in brands:
        if b in question:
            return b
    # 再匹配内部 value 关键字
    value_map = {
        "modern-eu": "摩登（中东-EU）",
        "normal-red-djibouti": "摩登（普通红吉布提）",
        "normal-red-intl": "摩登（普通红国际）",
        "normal-silver-intl": "摩登（普通银国际）",
        "slim": "摩登（细支）",
        "slim-gold": "摩登（细支金）",
        "ultra-slim": "摩登（超细支）",
        "ultra-gold": "摩登（超细金）",
        "ultra-silver": "摩登（超细银）",
        "ultra-black": "摩登（超细黑）",
        "ultra-white-97": "摩登（97超细白）",
    }
    for val, name in value_map.items():
        if val.lower() in question.lower() or name.replace("摩登（", "").replace("）", "") in question:
            return name
    return None


def _extract_physical_indicator(question: str) -> Optional[str]:
    """从问题中提取物测指标 key"""
    from core.physical_standard import normalize_indicator_key
    indicators = ["长度", "圆周", "烟支圆周", "吸阻", "重量", "通风度"]
    for ind in indicators:
        if ind in question:
            return normalize_indicator_key(ind)
    return None


def _answer_physical_standard(question: str) -> Dict[str, Any]:
    """回答烟支物测标准相关问题"""
    from core.physical_standard import (
        get_all_brands,
        get_brand_standards,
        get_indicator_standard,
        check_value,
        calc_deviation,
        format_standard,
        format_range,
    )

    brand = _extract_brand(question)
    indicator = _extract_physical_indicator(question)

    # 没有指定牌号，返回全部牌号列表
    if not brand:
        return {
            "answer": (
                "请提供需要查询的牌号。当前标准库包含以下牌号：\n"
                + "、".join(get_all_brands())
                + "\n\n您可以问：\"摩登（细支）的重量标准是多少？\""
            ),
            "sources": [],
            "reasoning": "用户未指定牌号，返回标准库牌号列表。",
        }

    brand_std = get_brand_standards(brand)
    if not brand_std:
        return {
            "answer": f"未找到牌号 {brand} 的物测标准。",
            "sources": [],
            "reasoning": "标准库中无该牌号。",
        }

    # 没有指定指标，返回该牌号全部标准
    if not indicator:
        lines = [f"牌号 {brand} 的烟支物测标准如下："]
        for ind_key, ind_std in brand_std.get("indicators", {}).items():
            lines.append(f"- {ind_std.get('name', ind_key)}：{format_standard(ind_std)}（范围：{format_range(ind_std)}）")
        return {
            "answer": "\n".join(lines),
            "sources": [{"doc_name": "烟支物测指标标准.xlsx"}],
            "reasoning": "返回指定牌号全部物测指标标准。",
        }

    std = get_indicator_standard(brand, indicator)
    if not std:
        return {
            "answer": f"未找到牌号 {brand} 的 {indicator} 标准。",
            "sources": [],
            "reasoning": "标准库中无该指标。",
        }

    # 尝试提取数值进行合格判定
    value_match = re.search(r"([-+]?\d*\.?\d+)", question)
    if value_match:
        value = float(value_match.group(1))
        result = check_value(brand, indicator, value)
        dev = calc_deviation(brand, indicator, value)
        dev_text = f"，偏差 {dev}{std.get('unit', '')}" if dev is not None else ""
        return {
            "answer": (
                f"牌号 {brand} 的 {std.get('name', indicator)} 标准为 {format_standard(std)}（范围：{format_range(std)}）。\n"
                f"检测值 {value}{std.get('unit', '')} 判定结果：{result}{dev_text}。"
            ),
            "sources": [{"doc_name": "烟支物测指标标准.xlsx"}],
            "reasoning": "根据标准库进行合格判定。",
        }

    return {
        "answer": (
            f"牌号 {brand} 的 {std.get('name', indicator)} 标准为 {format_standard(std)}，\n"
            f"标准范围：{format_range(std)}。"
        ),
        "sources": [{"doc_name": "烟支物测指标标准.xlsx"}],
        "reasoning": "返回指定牌号指定指标的标准。",
    }


def generate_answer(state: Dict[str, Any]) -> Dict[str, Any]:
    """生成答案节点"""
    question = state["question"]
    qtype = state.get("question_type", "combined")

    # 烟支物测标准问题直接调用标准库
    if qtype == "physical_standard":
        return _answer_physical_standard(question)

    knowledge = state.get("knowledge_results", [])
    business = state.get("business_results", {})

    # 构建知识上下文
    knowledge_text = "\n\n".join(
        f"[知识片段{i+1}] 来源：《{r['metadata'].get('doc_name', '未知文档')}》第{r['metadata'].get('page_number', '?')}页\n{r['text']}"
        for i, r in enumerate(knowledge)
    ) if knowledge else "无相关知识片段。"

    # 构建业务数据上下文
    business_text = json.dumps(business, ensure_ascii=False, indent=2) if business else "无业务数据。"

    system_prompt = """你是智合，质量管控系统中的专业质量助手。
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
        answer = "该问题不在智合的回答范围内。智合只回答与卷烟质量管理、质量评级、缺陷判定及当前系统质量数据相关的问题。"
    else:
        answer = "根据当前知识库中的两个质量文档及系统数据，暂未找到该问题的充分依据，因此无法基于现有资料给出专业结论。"
    return {
        "answer": answer,
        "sources": [],
        "reasoning": "知识库检索或系统数据不足，触发兜底回答。",
    }
