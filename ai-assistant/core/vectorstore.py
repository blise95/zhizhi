"""
质量知识向量库（文件存储）

生产不使用 Chroma / fastembed / Ollama：
- Embedding 走智谱或 OpenAI 兼容远程接口
- 向量落在 VECTOR_STORE_PATH/index.json.gz，适配 CentOS 7
"""
import gzip
import json
import math
from pathlib import Path
from typing import Any, Dict, List, Optional

from langchain_core.embeddings import Embeddings
from langchain_openai import OpenAIEmbeddings

import config

INDEX_NAME = "index.json.gz"


def create_embeddings() -> Embeddings:
    """根据配置创建 Embedding 模型（禁止默认拉本地 7B）。"""
    cfg = config.get_embedding_config()
    provider = cfg["provider"]

    if provider == "fastembed":
        try:
            from langchain_community.embeddings import FastEmbedEmbeddings
        except ImportError:
            raise ImportError("使用本地 Embedding 需要安装 fastembed：pip install fastembed")
        return FastEmbedEmbeddings(
            model_name=cfg["model"],
            max_length=512,
            doc_embed_type="default",
        )

    if provider == "ollama":
        from langchain_ollama import OllamaEmbeddings
        return OllamaEmbeddings(model=cfg["model"], base_url=cfg["base_url"])

    return OpenAIEmbeddings(
        model=cfg["model"],
        api_key=cfg["api_key"],
        base_url=cfg["base_url"],
        check_embedding_ctx_length=False,
        chunk_size=config.EMBEDDING_BATCH_SIZE,
    )


def _prepare_embed_text(text: str, max_chars: int) -> str:
    """去掉空字节，截到 embedding-2 单条 512 tokens 以内。"""
    cleaned = (text or "").replace("\x00", " ").strip()
    if not cleaned:
        return "空白"
    if len(cleaned) <= max_chars:
        return cleaned
    return cleaned[:max_chars]


def _pack_embed_batches(texts: List[str], batch_size: int, max_batch_chars: int) -> List[List[str]]:
    """按条数和总字符数打包，避免数组总 tokens 超过 8K。"""
    batches: List[List[str]] = []
    current: List[str] = []
    current_chars = 0
    for text in texts:
        item_len = len(text)
        too_many = len(current) >= batch_size
        too_long = current and current_chars + item_len > max_batch_chars
        if current and (too_many or too_long):
            batches.append(current)
            current = []
            current_chars = 0
        current.append(text)
        current_chars += item_len
    if current:
        batches.append(current)
    return batches


def _embed_batch(embeddings: Embeddings, batch: List[str]) -> List[List[float]]:
    try:
        return embeddings.embed_documents(batch)
    except Exception as batch_err:
        if len(batch) == 1:
            text = batch[0]
            for limit in (240, 120, 60):
                try:
                    return embeddings.embed_documents([text[:limit]])
                except Exception:
                    continue
            print(f"  跳过无法向量化的片段（{len(text)} 字）：{text[:40]!r}…")
            return embeddings.embed_documents(["（跳过）"])
        print(f"  本批失败（{batch_err}），改为逐条重试")
        vectors: List[List[float]] = []
        for item in batch:
            vectors.extend(_embed_batch(embeddings, [item]))
        return vectors


def _cosine(a: List[float], b: List[float]) -> float:
    if not a or not b or len(a) != len(b):
        return 0.0
    dot = 0.0
    na = 0.0
    nb = 0.0
    for x, y in zip(a, b):
        dot += x * y
        na += x * x
        nb += y * y
    if na <= 0 or nb <= 0:
        return 0.0
    return dot / (math.sqrt(na) * math.sqrt(nb))


class QualityVectorStore:
    """质量知识向量库（gzip JSON）"""

    def __init__(self, persist_dir: Path, embeddings: Optional[Embeddings] = None):
        self.persist_dir = Path(persist_dir)
        self.persist_dir.mkdir(parents=True, exist_ok=True)
        self.index_path = self.persist_dir / INDEX_NAME
        self.embeddings = embeddings
        self._items: List[Dict[str, Any]] = []
        self._meta: Dict[str, Any] = {}

    def _ensure_embeddings(self) -> Embeddings:
        if self.embeddings is None:
            self.embeddings = create_embeddings()
        return self.embeddings

    def exists(self) -> bool:
        return self.index_path.exists() and self.index_path.stat().st_size > 0

    def build(self, chunks: List[Dict[str, Any]]) -> "QualityVectorStore":
        texts = [c.get("text") or "" for c in chunks]
        metadatas = [c.get("metadata") or {} for c in chunks]
        prepared = [_prepare_embed_text(t, config.EMBEDDING_MAX_CHARS) for t in texts]
        batches = _pack_embed_batches(
            prepared, config.EMBEDDING_BATCH_SIZE, config.EMBEDDING_MAX_BATCH_CHARS
        )
        print(
            f"正在生成 {len(texts)} 条 Embedding"
            f"（单条≤{config.EMBEDDING_MAX_CHARS}字，每批总长≤{config.EMBEDDING_MAX_BATCH_CHARS}字）…"
        )
        embeddings = self._ensure_embeddings()
        vectors: List[List[float]] = []
        done = 0
        for batch in batches:
            done += len(batch)
            print(f"  {done - len(batch) + 1}-{done}/{len(texts)}")
            vectors.extend(_embed_batch(embeddings, batch))
        if len(vectors) != len(texts):
            raise RuntimeError(f"Embedding 条数不匹配：{len(vectors)} vs {len(texts)}")

        payload = {
            "provider": config.EMBEDDING_PROVIDER,
            "model": config.get_embedding_config().get("model"),
            "count": len(texts),
            "items": [
                {"text": text, "metadata": meta, "embedding": vec}
                for text, meta, vec in zip(texts, metadatas, vectors)
            ],
        }
        tmp = self.index_path.with_suffix(".tmp.gz")
        with gzip.open(tmp, "wt", encoding="utf-8") as f:
            json.dump(payload, f, ensure_ascii=False)
        tmp.replace(self.index_path)
        self._items = payload["items"]
        self._meta = {"provider": payload["provider"], "model": payload["model"], "count": payload["count"]}
        return self

    def load(self) -> "QualityVectorStore":
        if not self.exists():
            raise RuntimeError(f"向量库不存在：{self.index_path}，请先在服务器执行 zhizhi-zhihe")
        with gzip.open(self.index_path, "rt", encoding="utf-8") as f:
            payload = json.load(f)
        self._items = payload.get("items") or []
        self._meta = {
            "provider": payload.get("provider"),
            "model": payload.get("model"),
            "count": payload.get("count", len(self._items)),
        }
        return self

    def similarity_search(self, query: str, k: int = config.TOP_K_RETRIEVE) -> List[Dict[str, Any]]:
        if not self._items:
            if self.exists():
                self.load()
            else:
                raise RuntimeError("向量库未构建，请先执行 scripts/index_documents.py 或 zhizhi-zhihe")

        q_vec = self._ensure_embeddings().embed_query(query)
        ranked = sorted(
            ((_cosine(q_vec, item.get("embedding") or []), item) for item in self._items),
            key=lambda x: x[0],
            reverse=True,
        )
        results = []
        for score, item in ranked[:k]:
            results.append({
                "text": item.get("text") or "",
                "metadata": item.get("metadata") or {},
                "score": score,
            })
        return results
