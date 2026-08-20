"""
检索器：扩展查询、多路召回、重排
"""
import re
from typing import List, Dict, Any


def expand_query(query: str) -> List[str]:
    """
    对查询进行简单扩展，提高召回率。
    例如用户问 "缺支"，同时检索 "缺支"、"烟支填装" 等。
    """
    expanded = [query]
    # 提取可能的缺陷代码或关键词
    codes = re.findall(r"[A-Z]{2,5}[A-D]", query.upper())
    for code in codes:
        if code not in query:
            expanded.append(code)
    return expanded


def reciprocal_rank_fusion(
    results_lists: List[List[Dict[str, Any]]],
    k: int = 60,
    top_n: int = 5,
) -> List[Dict[str, Any]]:
    """
    RRF 重排：融合多路召回结果。
    相同文档在不同召回列表中排名越靠前，最终得分越高。
    """
    scores: Dict[str, float] = {}
    docs: Dict[str, Dict[str, Any]] = {}

    for results in results_lists:
        for rank, doc in enumerate(results):
            key = doc["text"]
            scores[key] = scores.get(key, 0.0) + 1.0 / (k + rank + 1)
            docs[key] = doc

    sorted_keys = sorted(scores.keys(), key=lambda x: scores[x], reverse=True)
    return [
        {
            **docs[key],
            "rrf_score": scores[key],
        }
        for key in sorted_keys[:top_n]
    ]


class EmptyRetriever:
    """无向量库时的空检索，不影响业务数据问答"""

    def retrieve(self, query: str, top_k: int = 5) -> List[Dict[str, Any]]:
        return []


class DefectKeywordRetriever:
    """基于缺陷标准库的关键词检索，不依赖 Embedding。"""

    def retrieve(self, query: str, top_k: int = 5) -> List[Dict[str, Any]]:
        from core.defect_standard import defects_as_knowledge_chunks
        return defects_as_knowledge_chunks(query, limit=top_k)


class DocumentChunkRetriever:
    """基于 PDF 切分结果的关键词检索（data/knowledge_chunks.json）。"""

    def __init__(self, chunks_path: Any = None):
        from pathlib import Path
        import config
        default_path = getattr(config, "KNOWLEDGE_CHUNKS_PATH", config.BASE_DIR / "data" / "knowledge_chunks.json")
        self.chunks_path = Path(chunks_path or default_path)
        self._chunks: List[Dict[str, Any]] = []
        if self.chunks_path.exists():
            import json
            with open(self.chunks_path, "r", encoding="utf-8") as f:
                self._chunks = json.load(f) or []

    def retrieve(self, query: str, top_k: int = 5) -> List[Dict[str, Any]]:
        if not self._chunks or not query:
            return []
        q = query.strip()
        tokens = [q] + re.findall(r"[\u4e00-\u9fa5]{2,}|[A-Za-z]{2,5}[A-Da-d]", q)
        scored = []
        for chunk in self._chunks:
            text = chunk.get("text") or ""
            score = sum(text.count(tok) * max(len(tok), 1) for tok in tokens if tok and tok in text)
            if score > 0:
                scored.append((score, chunk))
        scored.sort(key=lambda x: x[0], reverse=True)
        return [
            {"text": c.get("text", ""), "metadata": c.get("metadata", {})}
            for _, c in scored[:top_k]
        ]


class HybridRetriever:
    """结构化缺陷库 + 向量检索。缺陷库命中优先。"""

    def __init__(self, *retrievers: Any):
        self.retrievers = [r for r in retrievers if r is not None]

    def retrieve(self, query: str, top_k: int = 5) -> List[Dict[str, Any]]:
        merged: List[Dict[str, Any]] = []
        seen = set()
        for retriever in self.retrievers:
            try:
                docs = retriever.retrieve(query, top_k=top_k) or []
            except Exception:
                continue
            for doc in docs:
                key = (doc.get("text") or "")[:180]
                if key in seen:
                    continue
                seen.add(key)
                merged.append(doc)
                if len(merged) >= top_k:
                    return merged
        return merged


class QualityRetriever:
    """质量知识检索器"""

    def __init__(self, vector_store):
        self.vector_store = vector_store

    def retrieve(
        self,
        query: str,
        top_k: int = 5,
    ) -> List[Dict[str, Any]]:
        """
        检索流程：
        1. 扩展查询
        2. 多路向量召回
        3. RRF 融合重排
        """
        queries = expand_query(query)
        results_lists = []
        for q in queries:
            docs = self.vector_store.similarity_search(q, k=top_k + 3)
            results_lists.append(docs)

        # 如果只有一个查询，直接返回
        if len(results_lists) == 1:
            return results_lists[0][:top_k]

        return reciprocal_rank_fusion(results_lists, top_n=top_k)


if __name__ == "__main__":
    import config
    from core.vectorstore import QualityVectorStore

    vs = QualityVectorStore(config.VECTOR_STORE_PATH)
    retriever = QualityRetriever(vs)
    results = retriever.retrieve("缺支属于什么等级缺陷？", top_k=5)
    for r in results:
        print(f"\n--- {r['metadata']} ---")
        print(r["text"][:400])
