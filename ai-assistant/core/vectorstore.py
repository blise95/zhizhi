"""
向量存储管理

支持基于 Chroma 的持久化向量库，适配多种 Embedding 后端。
"""
from pathlib import Path
from typing import List, Dict, Any, Optional

from langchain_community.vectorstores import Chroma
from langchain_core.embeddings import Embeddings
from langchain_openai import OpenAIEmbeddings
from langchain_ollama import OllamaEmbeddings

import config


def create_embeddings() -> Embeddings:
    """根据配置创建 Embedding 模型"""
    cfg = config.get_embedding_config()
    provider = cfg["provider"]
    model = cfg["model"]

    if provider == "fastembed":
        try:
            from langchain_community.embeddings import FastEmbedEmbeddings
        except ImportError:
            raise ImportError(
                "使用本地 Embedding 需要安装 fastembed，请运行：pip install fastembed"
            )
        return FastEmbedEmbeddings(
            model_name=model,
            max_length=512,
            doc_embed_type="default",
        )

    if provider == "ollama":
        return OllamaEmbeddings(
            model=model,
            base_url=cfg["base_url"],
        )

    # OpenAI 兼容接口（OpenAI、智谱、通义等）
    return OpenAIEmbeddings(
        model=model,
        api_key=cfg["api_key"],
        base_url=cfg["base_url"],
        check_embedding_ctx_length=False,
    )


class QualityVectorStore:
    """质量知识向量库"""

    def __init__(self, persist_dir: Path, embeddings: Optional[Embeddings] = None):
        self.persist_dir = Path(persist_dir)
        self.persist_dir.parent.mkdir(parents=True, exist_ok=True)
        self._embeddings_arg = embeddings
        self.embeddings: Optional[Embeddings] = embeddings
        self.db: Optional[Chroma] = None

    def _ensure_embeddings(self) -> Embeddings:
        if self.embeddings is None:
            self.embeddings = create_embeddings()
        return self.embeddings

    def exists(self) -> bool:
        """判断向量库是否已存在"""
        return self.persist_dir.exists() and any(self.persist_dir.iterdir())

    def build(
        self,
        chunks: List[Dict[str, Any]],
        collection_name: str = "quality_knowledge",
    ) -> Chroma:
        """从 chunks 构建向量库"""
        texts = [c["text"] for c in chunks]
        metadatas = [c.get("metadata", {}) for c in chunks]

        self.db = Chroma.from_texts(
            texts=texts,
            embedding=self._ensure_embeddings(),
            metadatas=metadatas,
            collection_name=collection_name,
            persist_directory=str(self.persist_dir),
        )
        return self.db

    def load(self, collection_name: str = "quality_knowledge") -> Chroma:
        """加载已有向量库"""
        self.db = Chroma(
            persist_directory=str(self.persist_dir),
            embedding_function=self._ensure_embeddings(),
            collection_name=collection_name,
        )
        return self.db

    def similarity_search(
        self,
        query: str,
        k: int = config.TOP_K_RETRIEVE,
    ) -> List[Dict[str, Any]]:
        """相似度检索"""
        if self.db is None:
            if self.exists():
                self.load()
            else:
                raise RuntimeError("向量库未构建，请先执行 index_documents.py")

        docs = self.db.similarity_search(query, k=k)
        return [
            {
                "text": doc.page_content,
                "metadata": doc.metadata,
                "score": getattr(doc, "score", None),
            }
            for doc in docs
        ]


if __name__ == "__main__":
    vs = QualityVectorStore(config.VECTOR_STORE_PATH)
    if vs.exists():
        vs.load()
        print("Vector store loaded")
        results = vs.similarity_search("什么是A类缺陷？", k=3)
        for r in results:
            print(f"\n--- {r['metadata']} ---")
            print(r["text"][:300])
    else:
        print("Vector store not found. Run scripts/index_documents.py first.")
