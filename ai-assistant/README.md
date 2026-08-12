# 智质通 AI 智能问答模块

基于 **Python + LangChain + LangGraph** 构建的 RAG 质量知识问答与业务数据分析助手，服务于“智·质”卷烟质量管控系统。

## 核心能力

- **质量知识问答**：严格基于两个企业标准文档回答缺陷判定、质量评级、扣分规则等专业问题。
- **业务数据分析**：查询当前系统中已录入的检验批次、合格率、优质率、缺陷分布、机台对比等数据。
- **组合分析**：结合文档规则与系统数据，回答“为什么优质率下降”“这个批次为什么是二等品”等综合问题。
- **知识可追溯**：每条专业回答都附带知识来源（文档名称、章节、页码）。
- **严格防幻觉**：知识库未找到依据时明确告知无法回答，禁止编造。

## 项目结构

```
ai-assistant/
├── config.py                   # 模型、向量库、文档路径配置
├── core/
│   ├── document_loader.py      # PDF 解析与文本清洗
│   ├── chunking.py             # 智能文档切分
│   ├── vectorstore.py          # Embedding 与 Chroma 向量库
│   ├── retriever.py            # 查询扩展、多路召回、RRF 重排
│   └── business_data.py        # 业务数据读取与分析
├── graph/
│   ├── state.py                # LangGraph 状态定义
│   ├── nodes.py                # 分类/检索/查询/生成/兜底节点
│   └── graph.py                # 工作流编排与助手封装
├── api/
│   ├── main.py                 # FastAPI 服务
│   └── frontend-example.tsx    # React 前端集成示例
├── scripts/
│   ├── index_documents.py      # 构建质量知识向量库
│   └── export_localstorage_data.js  # 导出浏览器 localStorage 数据
├── data/                       # 业务数据与向量库存放目录
├── requirements.txt
└── README.md
```

## 快速开始

### 1. 安装依赖

```bash
cd ai-assistant
python -m venv venv
# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
```

### 2. 配置模型

复制环境变量示例文件：

```bash
cp .env.example .env
```

编辑 `.env`，选择模型提供商并填入 API Key：

```ini
# 方案一：OpenAI / 智谱 / 通义千问（OpenAI 兼容接口）
MODEL_PROVIDER=openai
OPENAI_API_KEY=your-api-key
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
OPENAI_CHAT_MODEL=gpt-4o-mini

# 方案二：Ollama 本地模型
MODEL_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_EMBEDDING_MODEL=nomic-embed-text
OLLAMA_CHAT_MODEL=qwen2.5:7b
```

### 3. 构建质量知识向量库

```bash
python scripts/index_documents.py
```

该脚本会：
- 解析两个 PDF 文档
- 按章节、表格、缺陷规则进行智能切分
- 生成 Embedding 并保存到 `data/vector_store/`

### 4. 准备业务数据（可选但推荐）

方式 A：在浏览器控制台导出 localStorage 数据
1. 打开质量管控系统网页
2. F12 → Console → 粘贴 `scripts/export_localstorage_data.js` 内容并回车
3. 将下载的 `process_quality_records.json` 放到 `ai-assistant/data/` 目录

方式 B：配置前端 API 接口，让后端自动拉取（需前端暴露 `/api/records`）

### 5. 启动 API 服务

```bash
python api/main.py
```

服务默认运行在 `http://localhost:8000`

### 6. 调用示例

```bash
curl -X POST http://localhost:8000/ask \
  -H "Content-Type: application/json" \
  -d '{"question": "缺支属于什么等级的缺陷？"}'
```

返回示例：

```json
{
  "question": "缺支属于什么等级的缺陷？",
  "question_type": "knowledge",
  "answer": "...",
  "sources": [
    {
      "doc_name": "卷烟外在质量缺陷判定",
      "page_number": 19,
      "section_title": "7 盒装",
      "text": "..."
    }
  ],
  "reasoning": "...",
  "business_results": {}
}
```

## 前端集成

将 `api/frontend-example.tsx` 中的组件复制到 React 项目中，并新增一个页面路由即可。确保前端能访问 `http://localhost:8000`。

## 支持的问答类型

| 类型 | 示例 |
|------|------|
| 知识问答 | “什么是 A 类缺陷？”“二等品的扣分范围是多少？” |
| 缺陷判定 | “缺支属于什么等级？”“小盒透明纸皱怎么判定？” |
| 评级规则 | “累计扣分 50 分属于什么等级？” |
| 数据统计 | “本月有多少检验批次？”“本周缺陷率是多少？” |
| 趋势分析 | “本月优质率为什么比上个月下降？” |
| 机台对比 | “本月哪个机台缺陷最多？” |
| 批次追溯 | “这个批次为什么是二等品？” |

## 开发原则

1. **知识只认两个文档**：专业质量知识只能来自用户提供的两个 PDF。
2. **数据只认当前系统**：统计、趋势、对比必须基于真实业务数据。
3. **结论必须有依据**：每条专业回答都要显示数据来源和知识依据。
4. **严格防止幻觉**：检索或数据不足时明确告知无法回答。

## 常见问题

**Q: 没有 API Key 怎么办？**
A: 可以安装 [Ollama](https://ollama.com/) 并拉取本地模型（如 `nomic-embed-text` 和 `qwen2.5:7b`），然后在 `.env` 中配置 `MODEL_PROVIDER=ollama`。

**Q: 向量库构建失败？**
A: 检查模型配置是否正确、网络是否可达、依赖是否安装完整。首次构建需要调用 Embedding 接口。

**Q: 业务数据为空？**
A: 需要先通过浏览器导出 localStorage 数据，或让前端提供业务数据 API。
