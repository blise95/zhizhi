"""
智合 AI 问答模块 API 服务

提供 /ask 接口供前端调用。
"""
import sys
from pathlib import Path
from typing import Optional, List, Dict, Any

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

import config
from core.retriever import EmptyRetriever
from core.business_data import BusinessDataProvider
from core.ai_logger import log_ask
from core.physical_standard import (
    get_metadata as get_physical_metadata,
    get_all_brands as get_physical_brands,
    get_brand_standards,
    get_indicator_standard,
    check_value as check_physical_value,
    calc_deviation as calc_physical_deviation,
    format_standard as format_physical_standard,
    format_range as format_physical_range,
)
from graph.graph import ZhiZhiAssistant


app = FastAPI(
    title="智合 AI 问答模块",
    description="质量管控系统中的专业质量知识问答与质量数据分析助手",
    version="2.0.0",
)

# 允许前端跨域访问
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 全局助手实例
_assistant: Optional[ZhiZhiAssistant] = None


def get_assistant() -> ZhiZhiAssistant:
    global _assistant
    if _assistant is None:
        retriever: Any = EmptyRetriever()
        vs_path = config.VECTOR_STORE_PATH
        if vs_path.exists() and any(vs_path.iterdir()):
            try:
                from core.vectorstore import QualityVectorStore
                from core.retriever import QualityRetriever
                retriever = QualityRetriever(QualityVectorStore(vs_path))
            except Exception as exc:
                print(f"[zhihe] 向量库加载失败，仅使用业务数据问答: {exc}")
        provider = BusinessDataProvider()
        _assistant = ZhiZhiAssistant(retriever, provider)
    return _assistant


class AskContext(BaseModel):
    """前端传入的系统真实数据上下文"""
    process_records: List[Dict[str, Any]] = Field(default_factory=list)
    physical_records: List[Dict[str, Any]] = Field(default_factory=list)


class AskRequest(BaseModel):
    question: str
    context: AskContext = Field(default_factory=AskContext)


class AskResponse(BaseModel):
    question: str
    question_type: str
    scenario: str = ""
    answer: str
    sources: list = Field(default_factory=list)  # 前台不展示来源
    reasoning: str = ""
    business_results: Optional[dict] = None


class PhysicalCheckRequest(BaseModel):
    brand: str
    indicator: str
    value: float


@app.get("/")
def root():
    return {"message": "智合 AI 问答模块已启动", "version": "2.0.0"}


@app.get("/health")
def health():
    vector_store_exists = config.VECTOR_STORE_PATH.exists() and any(config.VECTOR_STORE_PATH.iterdir())
    llm_cfg = {"provider": config.LLM_PROVIDER}
    try:
        if config.LLM_PROVIDER == "zhipu":
            llm_cfg["model"] = config.ZHIPU_CHAT_MODEL
            llm_cfg["configured"] = bool(config.ZHIPU_API_KEY) and not config.ZHIPU_API_KEY.startswith("your-")
    except Exception:
        llm_cfg["configured"] = False
    return {
        "status": "ok",
        "vector_store_exists": vector_store_exists,
        "llm": llm_cfg,
    }


@app.post("/ask", response_model=AskResponse)
def ask(req: AskRequest):
    if not req.question or not req.question.strip():
        raise HTTPException(status_code=400, detail="问题不能为空")

    try:
        assistant = get_assistant()

        # 数据加载策略：前端传入 > 本地文件 > 空
        process_records = req.context.process_records
        physical_records = req.context.physical_records

        # 如果前端没有传数据，尝试从本地文件自动加载
        if not process_records:
            _data_dir = config.BASE_DIR / "data"
            _pq_file = _data_dir / "process_quality_records.json"
            if _pq_file.exists():
                import json
                with open(_pq_file, "r", encoding="utf-8") as f:
                    _raw = json.load(f)
                    process_records = _raw if isinstance(_raw, list) else _raw.get("records", [])

        if not physical_records:
            _data_dir = config.BASE_DIR / "data"
            _pt_file = _data_dir / "physical_test_records.json"
            if _pt_file.exists():
                import json
                with open(_pt_file, "r", encoding="utf-8") as f:
                    _raw = json.load(f)
                    physical_records = _raw if isinstance(_raw, list) else _raw.get("records", [])

        result = assistant.ask(
            req.question.strip(),
            process_records=process_records,
            physical_records=physical_records,
        )

        # 后台记录分析日志
        log_ask(
            question=req.question.strip(),
            question_type=result.get("question_type"),
            scenario=result.get("scenario"),
            answer=result.get("answer", ""),
            process_records_count=len(process_records),
            physical_records_count=len(physical_records),
            business_results=result.get("business_results"),
            analysis_log=result.get("analysis_log"),
        )

        return AskResponse(
            question=result["question"],
            question_type=result.get("question_type", ""),
            scenario=result.get("scenario", ""),
            answer=result["answer"],
            sources=[],  # 前台不展示来源
            reasoning=result.get("reasoning", ""),
            business_results=result.get("business_results"),
        )
    except Exception as e:
        log_ask(
            question=req.question.strip(),
            question_type=None,
            scenario=None,
            answer="",
            error=str(e),
        )
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/cigarette-physical-standards")
def list_physical_standards():
    """返回烟支物测标准库全部数据"""
    try:
        return {
            "metadata": get_physical_metadata(),
            "brands": get_physical_brands(),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/cigarette-physical-standards/{brand}")
def get_brand_physical_standards(brand: str):
    """返回某牌号的全部物测标准"""
    try:
        std = get_brand_standards(brand)
        if not std:
            raise HTTPException(status_code=404, detail=f"未找到牌号 {brand} 的物测标准")
        return std
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/cigarette-physical-standards/{brand}/{indicator}")
def get_indicator_physical_standard(brand: str, indicator: str):
    """返回某牌号某指标的标准"""
    try:
        std = get_indicator_standard(brand, indicator)
        if not std:
            raise HTTPException(status_code=404, detail=f"未找到该牌号/指标的标准")
        return {
            "brand": brand,
            "indicator": indicator,
            "standard": std,
            "display": format_physical_standard(std),
            "range": format_physical_range(std),
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/cigarette-physical-check")
def check_physical_standard(req: PhysicalCheckRequest):
    """判定某牌号某指标的实际检测值是否合格"""
    try:
        std = get_indicator_standard(req.brand, req.indicator)
        result = check_physical_value(req.brand, req.indicator, req.value)
        deviation = calc_physical_deviation(req.brand, req.indicator, req.value)
        return {
            "brand": req.brand,
            "indicator": req.indicator,
            "value": req.value,
            "result": result,
            "deviation": deviation,
            "standard": std,
            "standardDisplay": format_physical_standard(std),
            "standardRange": format_physical_range(std),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
