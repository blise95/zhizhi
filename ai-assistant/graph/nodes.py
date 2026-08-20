"""
智合 LangGraph 节点实现

核心原则：
1. 系统真实数据优先于 AI 通用知识；
2. 系统正式标准优先于 AI 推测；
3. 数据不足时明确告知，禁止编造；
4. 前台回答自然、专业，不暴露技术来源。
"""
import json
import re
from typing import Dict, Any, List, Optional

from langchain_core.messages import HumanMessage, SystemMessage, AIMessage
from langchain_openai import ChatOpenAI

import config
from core.business_data import BusinessDataProvider
from core import quality_analytics as qa


class MockLLM:
    """本地演示 LLM：无需外部模型，直接基于检索结果与系统数据生成结构化回答"""

    def invoke(self, messages: List[Any]) -> AIMessage:
        user_content = ""
        for m in messages:
            if isinstance(m, HumanMessage):
                user_content = m.content
                break

        question = self._extract_field(user_content, "用户问题：", "\n问题类型：")
        qtype = self._extract_field(user_content, "问题类型：", "\n问题场景：")
        scenario = self._extract_field(user_content, "问题场景：", "\n\n=== 知识库检索结果 ===")
        knowledge_block = self._extract_field(user_content, "=== 知识库检索结果 ===", "\n\n=== 系统业务数据 ===")
        business_block = self._extract_field(user_content, "=== 系统业务数据 ===", "\n\n请根据以上信息生成专业回答。")

        answer = self._compose_answer(question, qtype, scenario, knowledge_block, business_block)
        return AIMessage(content=answer)

    def _extract_field(self, text: str, start: str, end: str) -> str:
        if start not in text:
            return ""
        s = text.find(start) + len(start)
        e = text.find(end, s)
        return text[s:e if e > s else len(text)].strip()

    def _compose_answer(self, question: str, qtype: str, scenario: str, knowledge_block: str, business_block: str) -> str:
        business = {}
        try:
            if business_block and business_block not in ["无业务数据。", "", "null"]:
                business = json.loads(business_block)
        except Exception:
            business = {}

        # 有明确场景的，优先按场景回答
        if scenario and scenario != "combined":
            answer = business.get("scenario_answer", "")
            if answer:
                return answer

        # 按问题类型回答
        if qtype == "knowledge":
            return self._knowledge_answer(question, knowledge_block)
        if qtype == "business":
            return self._business_answer(question, business)
        if qtype == "physical_standard":
            return business.get("scenario_answer", qa.answer_physical_standard_question(question))
        if qtype == "rating_standard":
            return business.get("scenario_answer", qa.answer_rating_standard_question(question))
        if qtype == "defect_standard":
            from core.defect_standard import answer_defect_question
            return business.get("scenario_answer", answer_defect_question(question))
        if qtype == "combined":
            k = self._knowledge_answer(question, knowledge_block)
            b = self._business_answer(question, business)
            if k.startswith("根据当前知识库") and not k.startswith("根据当前知识库中的两个质量文档，暂未找到"):
                return f"{k}\n\n{b}"
            return b or k
        return "该问题不在智合的回答范围内。智合只回答与卷烟质量管理、质量评级、缺陷判定及当前系统质量数据相关的问题。"

    def _knowledge_answer(self, question: str, knowledge_block: str) -> str:
        if not knowledge_block or knowledge_block == "无相关知识片段。":
            return "根据当前质量文档资料，暂未找到该问题的充分依据，暂时无法基于现有资料给出专业结论。"

        pattern = r'\n?\[知识片段\d+\]\s*来源：《[^》]+》第[^\n]+\n'
        segments = re.split(pattern, knowledge_block)
        contents = []
        for seg in segments:
            seg = seg.strip()
            if seg and seg not in contents:
                contents.append(seg)

        if not contents:
            return "根据当前质量文档资料，暂未找到该问题的充分依据，暂时无法基于现有资料给出专业结论。"

        summary = "\n\n".join(f"{i + 1}. {c[:400]}" for i, c in enumerate(contents[:5]))
        return (
            "根据质量文档的检索结果，分析如下：\n\n"
            f"{summary}\n\n"
            "以上内容依据文档中的缺陷判定与评级规则整理。"
        )

    def _business_answer(self, question: str, business: Dict[str, Any]) -> str:
        answer = business.get("scenario_answer", "")
        if answer:
            return answer

        total = business.get("total_batches", 0)
        if total == 0:
            return "当前筛选条件下没有找到业务记录，暂时无法基于系统数据进行判断。"

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
        from langchain_ollama import ChatOllama
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
        timeout=60,
        max_retries=2,
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
    q = question.lower()

    # 先通过关键词判断是否为烟支物测标准/偏离问题
    physical_keywords = [
        "烟支", "物测", "长度", "圆周", "吸阻", "重量", "通风度",
        "physical", "cigarette", "ventilation", "circumference", "draw resistance"
    ]
    standard_keywords = ["标准", "规格", "范围", "上限", "下限", "合格", "超标", "偏差", "多少"]
    deviation_keywords = ["偏离", "超标", "不合格", "合格吗", "偏离标准", "哪个物测指标"]

    has_physical = any(k in q for k in physical_keywords)
    has_standard = any(k in q for k in standard_keywords)
    has_deviation = any(k in q for k in deviation_keywords)

    if has_physical:
        # 偏离/合格判定优先于单纯标准查询（需要结合实际检测数据）
        if has_deviation:
            return {"question_type": "combined", "scenario": "physical_deviation"}
        if has_standard:
            return {"question_type": "physical_standard", "scenario": "physical_standard"}

    # 缺陷判定标准：名称、代码、A/B/C/D 等级定义
    from core.defect_standard import looks_like_defect_question
    if looks_like_defect_question(question):
        return {"question_type": "defect_standard", "scenario": "defect_standard"}

    # 5.3.1 外在质量评级：不依赖向量库，直接走结构化规则
    from core.rating_standard import looks_like_batch_rating_question, looks_like_rating_question
    if looks_like_batch_rating_question(question):
        return {"question_type": "combined", "scenario": "batch_rating"}
    if looks_like_rating_question(question):
        rate_only = any(k in q for k in ["优质率", "优等品率", "一等品率", "二等品率", "合格率"])
        if not rate_only:
            return {"question_type": "rating_standard", "scenario": "rating_standard"}

    # 具体场景识别
    scenario = qa.detect_scenario(question)

    # 系统提示分类
    system_prompt = """你是智合AI助手的问题分类器。请判断用户问题属于以下哪一类，只输出 JSON：
{
    "type": "knowledge" | "business" | "combined" | "physical_standard" | "rating_standard" | "defect_standard" | "out_of_scope",
  "reason": "简短理由"
}
分类说明：
- knowledge：只涉及质量知识、标准定义、缺陷判定规则、评级规定等专业文档内容。例如"烟支吸阻是什么"。
- business：涉及当前系统中的真实质量数据，例如"今天质量怎么样""哪个机台需要关注""最近哪个牌号质量下降"。
- combined：需要结合文档知识和系统数据才能回答，例如"本月优质率为什么下降""为什么质量变差"。
- physical_standard：询问烟支物测指标的标准值、范围、合格判定，例如"某牌号重量标准是多少"。
- rating_standard：询问外在质量评级分值线，例如"累计扣分50分属于什么等级""优等品是多少分"。
- defect_standard：询问缺陷判定、缺陷代码、A/B/C/D等级定义，例如"缺支属于什么等级""透明纸皱怎么判定"。
- out_of_scope：与质量管控系统、质量标准、烟支物测完全无关。
"""
    messages = [
        SystemMessage(content=system_prompt),
        HumanMessage(content=f"用户问题：{question}"),
    ]
    try:
        resp = get_llm().invoke(messages)
        content = resp.content.strip()
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0].strip()
        elif "```" in content:
            content = content.split("```")[1].split("```")[0].strip()
        result = json.loads(content)
        qtype = result.get("type", "combined")
        return {"question_type": qtype, "scenario": scenario}
    except Exception:
        # 兜底：根据关键词判断
        data_keywords = ["率", "多少", "哪个机台", "哪个品牌", "哪个牌号", "趋势", "排名", "批次", "本月", "本周", "今天", "最近", "重点关注", "下降"]
        knowledge_keywords = ["是什么", "属于", "等级", "扣分", "判定", "规则", "依据", "定义"]
        has_data = any(k in q for k in data_keywords)
        has_knowledge = any(k in q for k in knowledge_keywords)
        if has_data and has_knowledge:
            return {"question_type": "combined", "scenario": scenario}
        elif has_data:
            return {"question_type": "business", "scenario": scenario}
        elif has_knowledge:
            return {"question_type": "knowledge", "scenario": "knowledge"}
        return {"question_type": "out_of_scope", "scenario": "out_of_scope"}


def retrieve_knowledge(state: Dict[str, Any], retriever: Any) -> Dict[str, Any]:
    """知识库检索节点"""
    question = state["question"]
    results = retriever.retrieve(question, top_k=config.TOP_K_RERANK)
    return {"knowledge_results": results}


def _extract_brand_from_question(question: str) -> Optional[str]:
    """从问题中提取牌号"""
    for b in qa.get_all_brands():
        if b in question:
            return b
    # 内部 value 别名
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


def query_business_data(state: Dict[str, Any], provider: BusinessDataProvider) -> Dict[str, Any]:
    """业务数据查询节点：使用系统真实数据与标准库进行分析"""
    question = state["question"]
    scenario = state.get("scenario", "combined")

    # 优先使用前端传入的系统真实数据
    process_records = state.get("process_records", []) or []
    physical_records = state.get("physical_records", []) or []

    # 如果没有传入，回退到 provider 加载
    if not process_records:
        process_records = provider.get_records()

    date_from, date_to = qa.extract_date_range(question)
    filtered_process = qa.filter_by_date_range(process_records, date_from, date_to)

    # 提取牌号过滤（用于牌号趋势、物测分析）
    brand = _extract_brand_from_question(question)
    if brand:
        filtered_process = [r for r in filtered_process if brand in str(r.get("brand", ""))]

    # 基础汇总
    summary = qa.summarize_process_quality(filtered_process)
    top_defs = qa.top_defects(filtered_process, 5)
    machine_cmp = qa.machine_comparison(filtered_process)
    brand_cmp = qa.brand_comparison(filtered_process)

    # 按场景生成分析结果（使用智能答案引擎）
    scenario_answer = ""
    try:
        # 优先使用 smart_answer（基于结构化解析的智能答案）
        scenario_answer = qa.smart_answer(question, filtered_process, physical_records)
    except Exception:
        # 回退到旧版按场景分发
        if scenario == "today_quality":
            scenario_answer = qa.answer_today_quality(filtered_process)
        elif scenario == "machine_focus":
            scenario_answer = qa.answer_machine_focus(filtered_process)
        elif scenario == "machine_best":
            scenario_answer = qa.answer_machine_ranking(filtered_process, best=True)
        elif scenario == "machine_worst":
            scenario_answer = qa.answer_machine_ranking(filtered_process, best=False)
        elif scenario == "brand_trend":
            scenario_answer = qa.answer_brand_trend(filtered_process, brand)
        elif scenario == "physical_deviation":
            scenario_answer = qa.answer_physical_deviation(physical_records, brand)
        elif scenario == "physical_standard":
            scenario_answer = qa.answer_physical_standard_question(question)
        elif scenario == "rating_standard":
            scenario_answer = qa.answer_rating_standard_question(question)
        elif scenario == "defect_standard":
            from core.defect_standard import answer_defect_question
            scenario_answer = answer_defect_question(question)
        elif scenario == "batch_rating":
            scenario_answer = qa.answer_batch_rating(filtered_process, question)
        elif scenario == "quality_decline":
            scenario_answer = qa.answer_quality_decline(filtered_process, physical_records)

    return {
        "business_results": {
            "date_from": date_from,
            "date_to": date_to,
            "total_batches": summary["total_batches"],
            "total_defects": summary["total_defects"],
            "defect_batches": summary["defect_batches"],
            "defect_rate": summary["defect_rate"],
            "machines": summary["machines"],
            "brands": summary["brands"],
            "production_points": summary.get("production_points", []),
            "top_defects": top_defs,
            "machine_comparison": machine_cmp,
            "brand_comparison": brand_cmp,
            "scenario": scenario,
            "scenario_answer": scenario_answer,
            "extracted_brand": brand,
            "physical_summary": qa.summarize_physical_test(physical_records),
        },
        "business_query_params": {"date_from": date_from, "date_to": date_to},
    }


def check_sufficiency(state: Dict[str, Any]) -> Dict[str, Any]:
    """判断检索/数据是否充分"""
    qtype = state.get("question_type", "combined")
    scenario = state.get("scenario", "combined")
    knowledge = state.get("knowledge_results", [])
    business = state.get("business_results", {})

    # 物测标准问题不需要业务数据
    if qtype == "physical_standard" or scenario == "physical_standard":
        return {"is_sufficient": True}

    # 5.3.1 评级规则本身即可回答
    if qtype == "rating_standard" or scenario == "rating_standard":
        return {"is_sufficient": True}

    if qtype == "defect_standard" or scenario == "defect_standard":
        return {"is_sufficient": True}

    # 知识问题只看知识库
    if qtype == "knowledge":
        return {"is_sufficient": len(knowledge) > 0}

    # 业务问题必须有数据
    has_data = business.get("total_batches", 0) > 0 or business.get("physical_summary", {}).get("total_records", 0) > 0

    if qtype == "business":
        return {"is_sufficient": has_data}

    if qtype == "combined":
        return {"is_sufficient": has_data or len(knowledge) > 0}

    return {"is_sufficient": False}


def generate_answer(state: Dict[str, Any]) -> Dict[str, Any]:
    """生成答案节点"""
    question = state["question"]
    qtype = state.get("question_type", "combined")
    scenario = state.get("scenario", "combined")
    business = state.get("business_results", {})
    knowledge = state.get("knowledge_results", [])

    # 如果有按场景生成的答案，优先使用
    scenario_answer = business.get("scenario_answer", "")
    if scenario_answer:
        return {
            "answer": scenario_answer,
            "sources": [],
            "reasoning": f"问题类型：{qtype}，场景：{scenario}；基于系统真实质量数据与标准库生成回答。",
            "analysis_log": {
                "question": question,
                "question_type": qtype,
                "scenario": scenario,
                "used_data": business,
                "knowledge_count": len(knowledge),
            },
        }

    from core.defect_standard import answer_defect_question, looks_like_defect_question, search_defects
    if looks_like_defect_question(question) or search_defects(question, 1):
        return {
            "answer": answer_defect_question(question),
            "sources": knowledge,
            "reasoning": f"问题类型：{qtype}，场景：defect_standard；依据缺陷判定标准库回答。",
            "analysis_log": {
                "question": question,
                "question_type": qtype,
                "scenario": "defect_standard",
                "used_data": business,
                "knowledge_count": len(knowledge),
            },
        }

    # 构建知识上下文（仅用于 LLM，不展示给用户）
    knowledge_text = "\n\n".join(
        f"[知识片段{i+1}] 来源：《{r['metadata'].get('doc_name', '未知文档')}》第{r['metadata'].get('page_number', '?')}页\n{r['text']}"
        for i, r in enumerate(knowledge)
    ) if knowledge else "无相关知识片段。"

    business_text = json.dumps(business, ensure_ascii=False, indent=2) if business else "无业务数据。"

    system_prompt = """你是智合，质量管控系统中的专业质量助手。
请严格遵循以下原则：
1. 优先使用系统中的真实质量数据和正式质量标准；
2. 数据不足时明确告知，禁止编造数据或标准；
3. 回答自然、专业，不要在答案中显示"知识来源""数据来源""RAG检索"等技术信息；
4. 可引用具体数字，但不要暴露内部处理过程。
"""

    prompt = f"""用户问题：{question}
问题类型：{qtype}
问题场景：{scenario}

=== 知识库检索结果 ===
{knowledge_text}

=== 系统业务数据 ===
{business_text}

请根据以上信息生成专业、自然的回答。如果数据不足，请明确说明。"""

    try:
        resp = get_llm().invoke([
            SystemMessage(content=system_prompt),
            HumanMessage(content=prompt),
        ])
        answer = resp.content
    except Exception as e:
        answer = f"调用模型生成回答时出错：{e}"

    # 清理可能暴露来源的文本（兜底）
    answer = _sanitize_answer(answer)

    return {
        "answer": answer,
        "sources": [],
        "reasoning": f"问题类型：{qtype}，场景：{scenario}；检索到{len(knowledge)}条知识，{business.get('total_batches', 0)}条业务记录。",
        "analysis_log": {
            "question": question,
            "question_type": qtype,
            "scenario": scenario,
            "used_data": business,
            "knowledge_count": len(knowledge),
        },
    }


def _sanitize_answer(answer: str) -> str:
    """移除答案中可能暴露技术来源的文本"""
    forbidden_phrases = [
        "基于知识库", "根据知识库", "来源：", "数据来源：", "参考文档", "RAG检索",
        "调用标准库", "数据库查询结果", "知识库匹配结果", "【知识来源】",
        "【数据来源】", "【引用】", "引用：", "知识来源：", "来自：", "检索结果：",
    ]
    lines = []
    for line in answer.split("\n"):
        skip = any(p in line for p in forbidden_phrases)
        if not skip:
            lines.append(line)
    return "\n".join(lines).strip()


def fallback_answer(state: Dict[str, Any]) -> Dict[str, Any]:
    """无法回答时的兜底节点"""
    qtype = state.get("question_type", "combined")
    scenario = state.get("scenario", "combined")

    if qtype == "out_of_scope" or scenario == "out_of_scope":
        answer = "该问题不在智合的回答范围内。智合只回答与卷烟质量管理、质量评级、缺陷判定及当前系统质量数据相关的问题。"
    elif scenario in ["today_quality", "machine_focus", "machine_best", "machine_worst", "brand_trend", "quality_decline"]:
        answer = "当前系统中暂无相关质量记录，暂时无法基于系统数据进行判断。请在系统中录入过程质量或烟支物测数据后再提问。"
    elif scenario in ["physical_deviation", "physical_standard"]:
        answer = "当前系统暂未配置该牌号的对应标准或没有相关检测数据，暂时无法进行标准符合性判断。"
    elif scenario == "rating_standard":
        answer = qa.answer_rating_standard_question(state.get("question", ""))
    elif scenario == "defect_standard":
        from core.defect_standard import answer_defect_question
        answer = answer_defect_question(state.get("question", ""))
    elif scenario == "batch_rating":
        answer = "当前系统中暂无检验批次，暂时无法对照具体批次说明评级原因。" + "\n\n" + qa.answer_rating_standard_question(state.get("question", ""))
    else:
        answer = "根据当前质量文档及系统数据，暂未找到该问题的充分依据，暂时无法给出准确结论。"

    return {
        "answer": answer,
        "sources": [],
        "reasoning": "知识库检索或系统数据不足，触发兜底回答。",
        "analysis_log": {
            "question": state.get("question", ""),
            "question_type": qtype,
            "scenario": scenario,
            "fallback": True,
        },
    }
