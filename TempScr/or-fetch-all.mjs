// 拉 OpenRouter 全量 models，匹配本展厅 13 个模型，提取 description 中的参数规模
const res = await fetch('https://openrouter.ai/api/v1/models');
const j = await res.json();
const all = j.data;
console.log('total models on openrouter:', all.length);

// 16 个查询（每个模型在展厅里的中文名 / OpenRouter 搜索关键词 / 备选关键词）
const queries = [
  { key: 'qwen-3-8-max',     q: 'qwen3 max',   preferId: 'qwen/qwen3-max' },
  { key: 'qwen-3-8-27b',     q: 'qwen3.8 27b', preferId: 'qwen/qwen3.8-27b' },
  { key: 'qwen-3-7-plus',    q: 'qwen3.7 max', preferId: 'qwen/qwen3.7-max' },
  { key: 'qwen-3-6-27b',     q: 'qwen3 27b',   preferId: 'qwen/qwen3-27b' },
  { key: 'qwen-3-6-flash',   q: 'qwen3.6 flash', preferId: 'qwen/qwen3.6-flash' },
  { key: 'qwen-3-8-flash',   q: 'qwen3 flash', preferId: 'qwen/qwen3-8b' },
  { key: 'deepseek-v4-pro',  q: 'deepseek v3.2', preferId: 'deepseek/deepseek-v3.2' },
  { key: 'deepseek-v4-flash',q: 'deepseek v3.1', preferId: 'deepseek/deepseek-chat-v3.1' },
  { key: 'opus-5',           q: 'claude opus',  preferId: 'anthropic/claude-opus-4.1' },
  { key: 'gpt-5-6',          q: 'gpt 5',        preferId: 'openai/gpt-5' },
  { key: 'gemini-3-7',       q: 'gemini 3',     preferId: 'google/gemini-2.5-pro' },
  { key: 'gemini-3-6-flash', q: 'gemini flash', preferId: 'google/gemini-2.5-flash' },
  { key: 'gemini-3-1-pro',   q: 'gemini pro',   preferId: 'google/gemini-2.5-pro' },
  { key: 'grok-4-6',         q: 'grok 4',       preferId: 'x-ai/grok-4' },
  { key: 'doubao-expert',    q: 'doubao',       preferId: 'bytedance/doubao-seed-1-6-250615' },
  { key: 'seed-2-1-pro',     q: 'seed',         preferId: 'bytedance/seed-1-6' },
  { key: 'hunyuan-hy3',      q: 'hunyuan',      preferId: 'tencent/hunyuan-a13b-instruct' },
  { key: 'kimi-k3',          q: 'kimi',         preferId: 'moonshotai/kimi-k2' },
  { key: 'glm-5-3',          q: 'glm 5',        preferId: 'z-ai/glm-4.6' },
  { key: 'glm-5-3-flash-zhipu', q: 'glm 4.5 flash', preferId: 'z-ai/glm-4.5-flash' },
  { key: 'glm-5-3-flash-zai', q: 'glm 4.5',    preferId: 'z-ai/glm-4.5' },
  { key: 'minimax-m3',       q: 'minimax',      preferId: 'minimax/minimax-m2' },
];

const out = [];
for (const q of queries) {
  let m = all.find(x => x.id === q.preferId);
  if (!m) {
    // 模糊匹配：用关键词找第一个 name 含关键词的
    const kw = q.q.toLowerCase();
    m = all.find(x => x.name.toLowerCase().includes(kw) || x.id.toLowerCase().includes(kw));
  }
  if (!m) { out.push({ key: q.key, error: 'NOT FOUND' }); continue; }
  out.push({
    key: q.key,
    id: m.id,
    name: m.name,
    context_length: m.context_length,
    desc: m.description?.slice(0, 500),
    // 试图从 description 抽参数规模
    paramsHint: (m.description || '').match(/(\d+(?:\.\d+)?[BMK]?\s*(?:parameters?|params?|param|b|bn))\b/i)?.[0] || null,
  });
}
console.log(JSON.stringify(out, null, 2));
