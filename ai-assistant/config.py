"""
智合 AI 问答模块配置
"""
import os
from pathlib import Path
from dotenv import load_dotenv

# 加载 .env 文件（如果存在）
load_dotenv()

# 项目根目录
BASE_DIR = Path(__file__).resolve().parent

# 标准文档路径（可选；没有 PDF 时仍可回答系统数据问题）
DOC_RATING = Path(os.getenv("DOC_RATING", str(BASE_DIR / "docs" / "卷烟外在质量分级及评级规定.pdf")))
DOC_DEFECT = Path(os.getenv("DOC_DEFECT", str(BASE_DIR / "docs" / "卷烟外在质量缺陷判定.pdf")))

# 向量库存储目录
VECTOR_STORE_PATH = Path(os.getenv("VECTOR_STORE_PATH", str(BASE_DIR / "data" / "vector_store")))
KNOWLEDGE_CHUNKS_PATH = Path(
    os.getenv("KNOWLEDGE_CHUNKS_PATH", str(BASE_DIR / "data" / "knowledge_chunks.json"))
)

# 检索配置
TOP_K_RETRIEVE = int(os.getenv("TOP_K_RETRIEVE", "8"))
TOP_K_RERANK = int(os.getenv("TOP_K_RERANK", "5"))

# 业务数据 API（可选，留空则使用本地 JSON 或空数据）
BUSINESS_API_URL = os.getenv("BUSINESS_API_URL", "")

# Embedding 模型配置
# 可选：auto / zhipu / fastembed / ollama / openai
# 生产默认 auto：有智谱 Key 就走远程 embedding-2，避免本机拉模型
EMBEDDING_PROVIDER = os.getenv("EMBEDDING_PROVIDER", "auto").lower()
FASTEMBED_MODEL = os.getenv("FASTEMBED_MODEL", "BAAI/bge-small-zh-v1.5")
ZHIPU_EMBEDDING_MODEL = os.getenv("ZHIPU_EMBEDDING_MODEL", "embedding-2")
# 智谱 embedding-2 单次 input 最多 64 条
EMBEDDING_BATCH_SIZE = max(1, min(int(os.getenv("EMBEDDING_BATCH_SIZE", "64")), 64))

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_EMBEDDING_MODEL = os.getenv("OLLAMA_EMBEDDING_MODEL", "nomic-embed-text")

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
OPENAI_BASE_URL = os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1")
OPENAI_EMBEDDING_MODEL = os.getenv("OPENAI_EMBEDDING_MODEL", "text-embedding-3-small")

# LLM 配置
# 可选：openai / ollama / zhipu / mock
# mock 为本地演示模式，直接基于检索结果拼接回答，无需外部 LLM
LLM_PROVIDER = os.getenv("LLM_PROVIDER", "mock").lower()

OLLAMA_CHAT_MODEL = os.getenv("OLLAMA_CHAT_MODEL", "qwen2.5:7b")

OPENAI_CHAT_MODEL = os.getenv("OPENAI_CHAT_MODEL", "gpt-4o-mini")

def _clean_secret(value: str) -> str:
    """去掉首尾空白、CRLF 和包裹引号，避免 env 文件填错导致 401。"""
    if not value:
        return ""
    v = value.strip().strip("\r")
    if len(v) >= 2 and v[0] == v[-1] and v[0] in "\"'":
        v = v[1:-1].strip()
    return v


ZHIPU_API_KEY = _clean_secret(os.getenv("ZHIPU_API_KEY", ""))
ZHIPU_BASE_URL = os.getenv("ZHIPU_BASE_URL", "https://open.bigmodel.cn/api/paas/v4").rstrip("/")
ZHIPU_CHAT_MODEL = os.getenv("ZHIPU_CHAT_MODEL", "glm-4-flash")


def _zhipu_key_ready() -> bool:
    return bool(ZHIPU_API_KEY) and not ZHIPU_API_KEY.startswith("your-") and "在这里填" not in ZHIPU_API_KEY


def get_embedding_config():
    """返回当前启用的 embedding 配置"""
    provider = EMBEDDING_PROVIDER
    if provider == "auto":
        provider = "zhipu" if _zhipu_key_ready() else "fastembed"

    if provider == "zhipu":
        if not _zhipu_key_ready():
            raise RuntimeError("EMBEDDING_PROVIDER=zhipu 时必须配置真实的 ZHIPU_API_KEY")
        return {
            "provider": "openai",
            "api_key": ZHIPU_API_KEY,
            "base_url": ZHIPU_BASE_URL,
            "model": ZHIPU_EMBEDDING_MODEL,
        }
    if provider == "fastembed":
        return {
            "provider": "fastembed",
            "model": FASTEMBED_MODEL,
        }
    if provider == "ollama":
        return {
            "provider": "ollama",
            "base_url": OLLAMA_BASE_URL,
            "model": OLLAMA_EMBEDDING_MODEL,
        }
    return {
        "provider": "openai",
        "api_key": OPENAI_API_KEY,
        "base_url": OPENAI_BASE_URL,
        "model": OPENAI_EMBEDDING_MODEL,
    }


def get_llm_config():
    """返回当前启用的 LLM 配置"""
    if LLM_PROVIDER == "mock":
        return {"provider": "mock"}
    if LLM_PROVIDER == "ollama":
        return {
            "provider": "ollama",
            "base_url": OLLAMA_BASE_URL,
            "model": OLLAMA_CHAT_MODEL,
        }
    if LLM_PROVIDER == "zhipu":
        if not ZHIPU_API_KEY or ZHIPU_API_KEY.startswith("your-") or "在这里填" in ZHIPU_API_KEY:
            raise RuntimeError("LLM_PROVIDER=zhipu 时必须在环境变量中配置真实的 ZHIPU_API_KEY")
        return {
            "provider": "openai_compatible",
            "api_key": ZHIPU_API_KEY,
            "base_url": ZHIPU_BASE_URL,
            "model": ZHIPU_CHAT_MODEL,
        }
    return {
        "provider": "openai",
        "api_key": OPENAI_API_KEY,
        "base_url": OPENAI_BASE_URL,
        "model": OPENAI_CHAT_MODEL,
    }
