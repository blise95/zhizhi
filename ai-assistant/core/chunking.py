"""
智能文档切分

切分策略：
1. 识别章节标题，将章节正文按语义切分
2. 表格整体保留为一个 chunk，标题作为上下文
3. 缺陷名称、缺陷代码、等级、判定标准尽量保持在一起
4. 合并过短片段，避免过碎
"""
import re
from typing import List, Dict, Any


def is_section_header(line: str) -> bool:
    """识别章节/条款标题"""
    patterns = [
        r"^\d+\s+[\u4e00-\u9fa5]",           # 1 范围
        r"^\d+\.\d+\s+[\u4e00-\u9fa5]",      # 4.1 光源
        r"^\d+\.\d+\.\d+\s+[\u4e00-\u9fa5]",  # 4.1.1 光源
        r"^表\s*\d+",                        # 表1
        r"^附录[ABC](\.\d+)?",               # 附录A / 附录B.1
        r"^前\s*言",
        r"^范围$",
        r"^规范性引用文件$",
    ]
    return any(re.match(p, line.strip()) for p in patterns)


def extract_tables(text: str) -> tuple:
    """
    从文本中提取 Markdown 表格，返回 (非表格文本列表, 表格列表)。
    表格前面的标题行会作为表格的上下文标题。
    """
    lines = text.splitlines()
    non_table_parts = []
    tables = []
    current_non_table = []
    current_table = []
    last_title = ""

    for i, line in enumerate(lines):
        stripped = line.strip()
        if stripped.startswith("|") and "|" in stripped[1:]:
            # 表格行
            if current_non_table:
                # 取最后一段非空行作为表格标题候选
                for back_line in reversed(current_non_table):
                    b = back_line.strip()
                    if b:
                        last_title = b
                        break
                non_table_parts.append("\n".join(current_non_table).strip())
                current_non_table = []
            current_table.append(line)
        else:
            if current_table:
                tables.append({"title": last_title, "content": "\n".join(current_table)})
                current_table = []
                last_title = ""
            current_non_table.append(line)

    if current_table:
        tables.append({"title": last_title, "content": "\n".join(current_table)})
    if current_non_table:
        non_table_parts.append("\n".join(current_non_table).strip())

    return non_table_parts, tables


def split_text_by_sections(text: str) -> List[Dict[str, str]]:
    """按章节标题切分普通文本"""
    lines = text.splitlines()
    sections = []
    current = {"title": "", "content": []}

    for line in lines:
        if is_section_header(line):
            if current["content"]:
                sections.append({
                    "title": current["title"],
                    "content": "\n".join(current["content"]).strip(),
                })
            current = {"title": line.strip(), "content": [line]}
        else:
            current["content"].append(line)

    if current["content"]:
        sections.append({
            "title": current["title"],
            "content": "\n".join(current["content"]).strip(),
        })

    return sections


def split_long_text(content: str, title: str, max_length: int = 1200, overlap: int = 200) -> List[Dict[str, str]]:
    """对长文本按段落/句子边界切分"""
    if len(content) <= max_length:
        return [{"title": title, "content": content}]

    chunks = []
    start = 0
    while start < len(content):
        end = min(start + max_length, len(content))
        if end >= len(content):
            chunks.append({"title": title, "content": content[start:].strip()})
            break

        # 优先在段落边界切分
        split_pos = content.rfind("\n\n", start, end)
        if split_pos == -1 or split_pos <= start:
            split_pos = content.rfind("。", start, end)
        if split_pos == -1 or split_pos <= start:
            split_pos = end

        chunks.append({"title": title, "content": content[start:split_pos].strip()})
        start = max(split_pos - overlap, start + 1)

    return chunks


def create_chunks(
    pages: List[Dict[str, Any]],
    chunk_size: int = 1000,
    chunk_overlap: int = 200,
) -> List[Dict[str, Any]]:
    """
    将文档页面切分为知识块。
    每个 chunk 包含：text, metadata(doc_name, page, section_title, source, chunk_type)
    """
    chunks = []
    for page in pages:
        base_meta = {
            "doc_name": page["doc_name"],
            "page_number": page["page_number"],
            "source": page["source"],
        }

        # 合并正文与表格文本
        full_text = page["text"]
        if page["tables_text"]:
            full_text += "\n\n" + page["tables_text"]

        # 分离表格和普通文本
        non_table_parts, tables = extract_tables(full_text)

        # 处理普通文本
        for part in non_table_parts:
            if not part.strip():
                continue
            sections = split_text_by_sections(part)
            for sec in sections:
                if not sec["content"]:
                    continue
                for sub in split_long_text(sec["content"], sec["title"], max_length=chunk_size, overlap=chunk_overlap):
                    if not sub["content"]:
                        continue
                    chunks.append({
                        "text": f"【{sub['title'] or '正文'}】\n{sub['content']}",
                        "metadata": {
                            **base_meta,
                            "section_title": sub["title"],
                            "chunk_type": "text",
                        },
                    })

        # 处理表格：整体作为一个 chunk
        for table in tables:
            table_text = table["content"]
            if not table_text:
                continue
            title = table["title"] or "表格"
            # 如果表格太长，按行切分，但尽量保持完整
            if len(table_text) <= chunk_size * 2:
                chunks.append({
                    "text": f"【{title}】\n{table_text}",
                    "metadata": {
                        **base_meta,
                        "section_title": title,
                        "chunk_type": "table",
                    },
                })
            else:
                # 超长表格按行切分
                lines = table_text.splitlines()
                header = lines[0] if lines else ""
                sep = lines[1] if len(lines) > 1 else ""
                data_rows = lines[2:]
                buffer = [header, sep]
                for row in data_rows:
                    if len("\n".join(buffer + [row])) > chunk_size and len(buffer) > 2:
                        chunks.append({
                            "text": f"【{title}】\n" + "\n".join(buffer),
                            "metadata": {
                                **base_meta,
                                "section_title": title,
                                "chunk_type": "table",
                            },
                        })
                        buffer = [header, sep, row]
                    else:
                        buffer.append(row)
                if len(buffer) > 2:
                    chunks.append({
                        "text": f"【{title}】\n" + "\n".join(buffer),
                        "metadata": {
                            **base_meta,
                            "section_title": title,
                            "chunk_type": "table",
                        },
                    })

    return chunks


if __name__ == "__main__":
    from core.document_loader import load_documents
    from config import DOC_RATING, DOC_DEFECT

    pages = load_documents({
        "卷烟外在质量分级及评级规定": DOC_RATING,
        "卷烟外在质量缺陷判定": DOC_DEFECT,
    })
    chunks = create_chunks(pages, chunk_size=1000, chunk_overlap=200)
    print(f"Total chunks: {len(chunks)}")
    table_chunks = [c for c in chunks if c["metadata"].get("chunk_type") == "table"]
    text_chunks = [c for c in chunks if c["metadata"].get("chunk_type") != "table"]
    print(f"Text chunks: {len(text_chunks)}, Table chunks: {len(table_chunks)}")
    for c in chunks[:5]:
        print(f"\n--- {c['metadata']['doc_name']} P{c['metadata']['page_number']} [{c['metadata'].get('chunk_type')}] ---")
        print(c["text"][:600])
