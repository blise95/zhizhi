/**
 * 在浏览器控制台运行，导出 localStorage 中的过程质量数据为 JSON。
 *
 * 用法：
 * 1. 打开质量管控系统网页
 * 2. 按 F12 打开开发者工具，切换到 Console
 * 3. 粘贴以下代码并回车
 * 4. 将下载的 process_quality_records.json 放到 ai-assistant/data/ 目录下
 */
(function () {
  const key = 'zhiliang_process_quality_records';
  const raw = localStorage.getItem(key);
  if (!raw) {
    console.error('未找到 localStorage 键：' + key);
    return;
  }
  const data = JSON.parse(raw);
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'process_quality_records.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  console.log('已导出 ' + (Array.isArray(data) ? data.length : 'unknown') + ' 条记录');
})();
