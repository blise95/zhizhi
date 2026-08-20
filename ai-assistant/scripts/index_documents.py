"""
构建质量知识向量库

用法（服务器）：
    python scripts/index_documents.py --require-vector

流程：
1. 解析两份企业标准 PDF
2. 切分为知识片段，保存 knowledge_chunks.json
3. 用智谱/OpenAI 兼容 Embedding 写入 VECTOR_STORE_PATH/index.json.gz
"""
import argparse
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from config import DOC_DEFECT, DOC_RATING, KNOWLEDGE_CHUNKS_PATH, VECTOR_STORE_PATH
from core.chunking import create_chunks
from core.document_loader import load_documents
from core.vectorstore import QualityVectorStore


def structured_fallback_chunks():
    from core.defect_standard import format_defect, format_grade, get_all_defects
    from core.rating_standard import format_rating_rules

    chunks = [{
        "text": "【5.3.1 外在质量评级】\n" + format_rating_rules(),
        "metadata": {
            "doc_name": "卷烟外在质量分级及评级规定",
            "page_number": 4,
            "section_title": "5.3.1 外在质量产品分级评定",
            "source": "rating_standard",
            "chunk_type": "rating",
        },
    }]
    for cat in "ABCD":
        chunks.append({
            "text": f"【表1 {cat}类缺陷】\n" + format_grade(cat),
            "metadata": {
                "doc_name": "卷烟外在质量分级及评级规定",
                "page_number": 3,
                "section_title": "表1 缺陷分级和单位扣分值",
                "source": "rating_standard",
                "chunk_type": "grade",
            },
        })
    for item in get_all_defects():
        chunks.append({
            "text": f"【{item.get('location')} / {item.get('name')}】\n" + format_defect(item),
            "metadata": {
                "doc_name": "卷烟外在质量缺陷判定",
                "page_number": item.get("source_page") or "",
                "section_title": f"{item.get('location')} / {item.get('name')}",
                "source": "defect_library.json",
                "chunk_type": "defect",
                "code": item.get("code"),
            },
        })
    return chunks


def load_pdf_chunks():
    missing = [p for p in [DOC_RATING, DOC_DEFECT] if not Path(p).exists()]
    if missing:
        return [], missing
    docs = load_documents({
        "卷烟外在质量分级及评级规定": DOC_RATING,
        "卷烟外在质量缺陷判定": DOC_DEFECT,
    })
    return create_chunks(docs, chunk_size=800, chunk_overlap=150), []


def index_is_fresh(chunks_path: Path, index_path: Path) -> bool:
    if not index_path.exists() or index_path.stat().st_size <= 0:
        return False
    newest = index_path.stat().st_mtime
    for p in [DOC_RATING, DOC_DEFECT]:
        path = Path(p)
        if path.exists() and path.stat().st_mtime > newest:
            return False
    return True


def main():
    parser = argparse.ArgumentParser(description="构建智合质量知识向量库")
    parser.add_argument("--require-vector", action="store_true", help="向量库构建失败则退出码非 0")
    parser.add_argument("--force", action="store_true", help="忽略已有索引，强制重建")
    args = parser.parse_args()

    print("=" * 60)
    print("智质通：正在构建质量知识库...")
    print("=" * 60)

    chunks, missing = load_pdf_chunks()
    if missing:
        print("未找到以下 PDF：")
        for p in missing:
            print(f"  - {p}")
        if args.require_vector:
            print("服务器构建向量库必须包含两份企业标准 PDF（ai-assistant/docs/）。")
            sys.exit(1)
        print("改用结构化缺陷库生成语料")
        chunks = structured_fallback_chunks()
    else:
        print(f"✅ 已加载 PDF 并切分为 {len(chunks)} 个知识片段")
        extra = structured_fallback_chunks()
        chunks = extra + chunks
        print(f"✅ 合并结构化标准后共 {len(chunks)} 个片段")

    chunks_path = Path(KNOWLEDGE_CHUNKS_PATH)
    chunks_path.parent.mkdir(parents=True, exist_ok=True)
    serializable = []
    for c in chunks:
        meta = {}
        for k, v in (c.get("metadata") or {}).items():
            if isinstance(v, (str, int, float, bool)) or v is None:
                meta[k] = v
            else:
                meta[k] = str(v)
        serializable.append({"text": c.get("text") or "", "metadata": meta})
    with open(chunks_path, "w", encoding="utf-8") as f:
        json.dump(serializable, f, ensure_ascii=False, indent=2)
    print(f"✅ 已保存关键词检索语料：{chunks_path}")

    vs = QualityVectorStore(VECTOR_STORE_PATH)
    if not args.force and index_is_fresh(chunks_path, vs.index_path):
        print(f"✅ 向量库已是最新，跳过 Embedding：{vs.index_path}")
        print("=" * 60)
        return

    try:
        vs.build(serializable)
        print(f"✅ 向量库构建完成：{vs.index_path}")
    except Exception as exc:
        print(f"⚠️  向量库未构建：{exc}")
        err = str(exc)
        if "401" in err or "令牌" in err:
            print("   原因：智谱 API Key 无效或过期，不是 PDF 解析失败。")
            print("   请到 https://open.bigmodel.cn/usercenter/apikeys 重新创建 Key，")
            print("   写入 /opt/zhizhi/conf/zhihe.env 的 ZHIPU_API_KEY（不要加引号、不要有空格），")
            print("   然后执行：FORCE_REINDEX=1 zhizhi-zhihe")
        if args.require_vector:
            sys.exit(1)
        print("   结构化缺陷问答仍可用。")

    print("=" * 60)


if __name__ == "__main__":
    main()
