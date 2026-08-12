"""
构建质量知识向量库

用法：
    python scripts/index_documents.py
"""
import sys
from pathlib import Path

# 将项目根目录加入路径
ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from config import DOC_RATING, DOC_DEFECT, VECTOR_STORE_PATH
from core.document_loader import load_documents
from core.chunking import create_chunks
from core.vectorstore import QualityVectorStore


def main():
    print("=" * 60)
    print("智质通：正在构建质量知识向量库...")
    print("=" * 60)

    docs = load_documents({
        "卷烟外在质量分级及评级规定": DOC_RATING,
        "卷烟外在质量缺陷判定": DOC_DEFECT,
    })
    print(f"✅ 已加载 {len(docs)} 页文档")

    chunks = create_chunks(docs, chunk_size=800, chunk_overlap=150)
    print(f"✅ 已切分为 {len(chunks)} 个知识片段")

    # 如果目录已存在，先删除旧索引
    import shutil
    if VECTOR_STORE_PATH.exists():
        shutil.rmtree(VECTOR_STORE_PATH)
        print("🗑️  已清理旧向量库")

    vs = QualityVectorStore(VECTOR_STORE_PATH)
    vs.build(chunks)
    print(f"✅ 向量库构建完成，保存至：{VECTOR_STORE_PATH}")
    print("=" * 60)


if __name__ == "__main__":
    main()
