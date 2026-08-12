/**
 * 智质通前端集成示例（React + TypeScript）
 *
 * 在质量管控系统中新增一个 AI 问答页面，调用本地 8000 端口的后端服务。
 */
import React, { useState } from 'react';

interface Source {
  doc_name: string;
  page_number: number;
  section_title: string;
  text: string;
}

interface AskResult {
  question: string;
  question_type: string;
  answer: string;
  sources: Source[];
  reasoning: string;
}

const ZhiZhiChat: React.FC = () => {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AskResult | null>(null);
  const [error, setError] = useState('');

  const handleAsk = async () => {
    if (!question.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('http://localhost:8000/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: question.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || '请求失败');
      }
      setResult(data);
    } catch (err: any) {
      setError(err.message || '网络错误');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-full flex-col gap-4 p-6">
      <h1 className="text-2xl font-bold text-white">智质通 · AI 质量助手</h1>
      <div className="flex gap-2">
        <input
          value={question}
          onChange={e => setQuestion(e.target.value)}
          placeholder="请输入质量相关问题，例如：缺支属于什么等级的缺陷？"
          className="flex-1 rounded-lg border border-slate-600 bg-slate-800 px-4 py-2 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
          onKeyDown={e => e.key === 'Enter' && handleAsk()}
        />
        <button
          onClick={handleAsk}
          disabled={loading}
          className="rounded-lg bg-blue-600 px-6 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? '思考中...' : '提问'}
        </button>
      </div>

      {error && <div className="rounded-lg bg-red-900/30 p-3 text-red-300">{error}</div>}

      {result && (
        <div className="space-y-4 overflow-auto rounded-2xl border border-slate-700 bg-slate-900/60 p-5">
          <div className="text-sm text-slate-400">问题类型：{result.question_type}</div>
          <div className="whitespace-pre-wrap text-slate-200 leading-relaxed">{result.answer}</div>

          {result.sources.length > 0 && (
            <div className="mt-4 border-t border-slate-700 pt-4">
              <h3 className="mb-2 text-sm font-semibold text-slate-300">知识依据</h3>
              <div className="space-y-2">
                {result.sources.map((s, idx) => (
                  <div key={idx} className="rounded-lg bg-slate-800/50 p-3 text-xs text-slate-400">
                    <div className="mb-1 font-medium text-slate-300">
                      《{s.doc_name}》第{s.page_number}页 {s.section_title}
                    </div>
                    <div className="line-clamp-3">{s.text}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ZhiZhiChat;
