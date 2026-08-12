"""
PDF 文档解析与加载

支持解析两个质量文档：
1. 卷烟外在质量分级及评级规定
2. 卷烟外在质量缺陷判定
"""
import re
from pathlib import Path
from typing import List, Dict, Any
import pdfplumber


class PDFDocument:
    """表示一个解析后的 PDF 文档"""

    def __init__(self, file_path: Path, doc_name: str):
        self.file_path = Path(file_path)
        self.doc_name = doc_name
        self.pages: List[Dict[str, Any]] = []
        self.metadata: Dict[str, Any] = {}

    def load(self) -> "PDFDocument":
        """加载 PDF 并提取文本、表格和元数据"""
        with pdfplumber.open(self.file_path) as pdf:
            self.metadata = {
                "file_name": self.file_path.name,
                "doc_name": self.doc_name,
                "total_pages": len(pdf.pages),
            }
            for page_num, page in enumerate(pdf.pages, 1):
                text = page.extract_text() or ""
                tables = page.extract_tables() or []
                self.pages.append({
                    "page_number": page_num,
                    "text": text.strip(),
                    "tables": tables,
                })
        return self


def clean_text(text: str) -> str:
    """清洗提取的文本"""
    # 移除页眉页脚中的标准号重复
    text = re.sub(r"QJ/ZY-GY\.02-0\d{2}-2023\n?", "", text)
    # 移除页码行
    text = re.sub(r"^\d+$", "", text, flags=re.MULTILINE)
    # 合并多余空行
    text = re.sub(r"\n{3,}", "\n\n", text)
    # 移除行首行尾空白
    text = "\n".join(line.strip() for line in text.splitlines())
    return text.strip()


def merge_table_to_text(table: List[List[str]]) -> str:
    """将表格转换为 Markdown 文本，保持结构"""
    if not table or not table[0]:
        return ""
    # 清洗单元格内容
    cleaned = []
    for row in table:
        cleaned_row = [cell.replace("\n", " ").strip() if cell else "" for cell in row]
        # 跳过全空行
        if any(cleaned_row):
            cleaned.append(cleaned_row)

    if len(cleaned) < 1:
        return ""

    # 构建 Markdown 表格
    header = cleaned[0]
    lines = ["| " + " | ".join(header) + " |"]
    lines.append("| " + " | ".join(["---"] * len(header)) + " |")
    for row in cleaned[1:]:
        # 补齐列数
        row = row + [""] * (len(header) - len(row))
        lines.append("| " + " | ".join(row[:len(header)]) + " |")
    return "\n".join(lines)


def load_documents(doc_paths: Dict[str, Path]) -> List[Dict[str, Any]]:
    """
    加载所有文档，返回按页组织的文档内容。
    每个元素包含：doc_name, page_number, text, tables_text
    """
    results = []
    for doc_name, path in doc_paths.items():
        doc = PDFDocument(path, doc_name).load()
        for page in doc.pages:
            tables_text = "\n\n".join(
                merge_table_to_text(table) for table in page["tables"] if table
            )
            full_text = clean_text(page["text"])
            results.append({
                "doc_name": doc_name,
                "page_number": page["page_number"],
                "text": full_text,
                "tables_text": tables_text,
                "source": path.name,
            })
    return results


if __name__ == "__main__":
    from config import DOC_RATING, DOC_DEFECT
    docs = load_documents({
        "卷烟外在质量分级及评级规定": DOC_RATING,
        "卷烟外在质量缺陷判定": DOC_DEFECT,
    })
    print(f"Loaded {len(docs)} pages")
    for d in docs[:3]:
        print(f"\n--- {d['doc_name']} 第{d['page_number']}页 ---")
        print(d["text"][:500])
