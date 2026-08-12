"""
智质通 AI 问答模块 API 服务

提供 /ask 接口供前端调用。
"""
import sys
from pathlib import Path
from typing import Optional

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

import config
from core.vectorstore import QualityVectorStore
from core.retriever import QualityRetriever
from core.business_data import BusinessDataProvider
from graph.graph import ZhiZhiAssistant


app = FastAPI(
    title="智质通 AI 问答模块",
    description="质量管控系统中的专业质量知识问答与质量数据分析助手",
    version="1.0.0",
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
        vs = QualityVectorStore(config.VECTOR_STORE_PATH)
        if not vs.exists():
            raise RuntimeError(
                "向量库未构建，请先运行：python scripts/index_documents.py"
            )
        retriever = QualityRetriever(vs)
        provider = BusinessDataProvider()
        _assistant = ZhiZhiAssistant(retriever, provider)
    return _assistant


class AskRequest(BaseModel):
    question: str


class AskResponse(BaseModel):
    question: str
    question_type: str
    answer: str
    sources: list
    reasoning: str
    business_results: Optional[dict] = None


@app.get("/")
def root():
    return {"message": "智质通 AI 问答模块已启动", "version": "1.0.0"}


@app.get("/health")
def health():
    return {"status": "ok", "vector_store_exists": QualityVectorStore(config.VECTOR_STORE_PATH).exists()}


@app.post("/ask", response_model=AskResponse)
def ask(req: AskRequest):
    if not req.question or not req.question.strip():
        raise HTTPException(status_code=400, detail="问题不能为空")
    try:
        assistant = get_assistant()
        result = assistant.ask(req.question.strip())
        return AskResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
