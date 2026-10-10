// 完整 description 全文提取参数规模
const res = await fetch('https://openrouter.ai/api/v1/models');
const j = await res.json();
const all = j.data;
const byId = Object.fromEntries(all.map(m => [m.id, m]));

const ids = [
  'qwen/qwen3.8-max', 'qwen/qwen3.7-plus', 'qwen/qwen3.6-27b', 'qwen/qwen3.6-flash', 'qwen/qwen3.8-flash',
  'deepseek/deepseek-v4-pro-0813', 'deepseek/deepseek-v4-pro', 'deepseek/deepseek-v3.2', 'deepseek/deepseek-v3.1', 'deepseek/deepseek-chat-v3.1',
  'anthropic/claude-opus-5',
  'openai/gpt-5.6-sol', 'openai/gpt-5.6-luna',
  'google/gemini-3.7-flash', 'google/gemini-3.6-flash', 'google/gemini-3.1-pro-preview',
  'x-ai/grok-4.6',
  'bytedance-seed/seed-1.6', 'bytedance-seed/seed-2-1-turbo',
  'tencent/hunyuan-a13b-instruct',
  'moonshotai/kimi-k3',
  'z-ai/glm-5.3', 'z-ai/glm-5.2', 'z-ai/glm-5.3-flash',
  'minimax/minimax-m3',
];

for (const id of ids) {
  const m = byId[id];
  if (!m) { console.log(`MISS ${id}`); continue; }
  const desc = m.description || '';
  console.log('==', id);
  console.log('  full desc:', desc);
  console.log('---');
}
