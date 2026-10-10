// 拉 OpenRouter /api/v1/models，提取 32 张卡片的 created（Unix 秒）
const res = await fetch('https://openrouter.ai/api/v1/models');
const j = await res.json();
const byId = Object.fromEntries(j.data.map(m => [m.id, m]));

const map = [
  'qwen-3-8-max',          'qwen/qwen3.8-max',
  'qwen-3-7-plus',         'qwen/qwen3.7-plus',
  'qwen-3-8-27b',          'qwen/qwen3.8-27b',
  'qwen-3-6-27b',          'qwen/qwen3.6-27b',
  'qianwen-3-6-flash',     'qwen/qwen3.6-flash',
  'qwen-3-8-flash-api',    'qwen/qwen3.8-flash',
  'deepseek-v4-pro-api-0813',     'deepseek/deepseek-v4-pro-0813',
  'deepseek-v4-pro-0813-dsh-minimal', 'deepseek/deepseek-v4-pro',
  'deepseek-v4-flash-api-0731',   'deepseek/deepseek-v4-flash-0731',
  'deepseek-v4-flash-0731-dsh-minimal', 'deepseek/deepseek-v4-flash-0731',
  'deepseek-v4-pro-0424',         'deepseek/deepseek-v3.2',
  'deepseek-0424-pro-trae',       'deepseek/deepseek-v3.2',
  'deepseek-v4-pro-0424-wb',      'deepseek/deepseek-v3.2',
  'deepseek-v4-flash-0424-trae',  'deepseek/deepseek-chat-v3.1',
  'deepseek-flash-0424',          'deepseek/deepseek-chat-v3.1',
  'deepseek-v4-flash-0424-wb',    'deepseek/deepseek-chat-v3.1',
  'opus-5-relay',                 'anthropic/claude-opus-5',
  'gpt-5-6-codex',                'openai/gpt-5.6-sol',
  'gpt-5-6-luna-codex',           'openai/gpt-5.6-luna',
  'gemini-3-7',                   'google/gemini-3.7-flash',
  'gemini-3-6-flash',             'google/gemini-3.6-flash',
  'gemini-3-1-pro',               'google/gemini-3.1-pro-preview',
  'grok-4-6',                     'x-ai/grok-4.6',
  'doubao-expert',                'bytedance-seed/seed-1.6',
  'seed-2-1-pro-trae',            'bytedance-seed/seed-2-1-turbo',
  'hunyuan-hy3-wb',               'tencent/hunyuan-a13b-instruct',
  'kimi-k3-wb',                   'moonshotai/kimi-k3',
  'glm-5-3-wb',                   'z-ai/glm-5.3',
  'glm-5-2-wb',                   'z-ai/glm-5.2',
  'minimax-m3-wb',                'minimax/minimax-m3',
  'glm-5-3-flash-zhipu',          'z-ai/glm-5.3-flash',
  'glm-5-3-flash-zai',            'z-ai/glm-5.3-flash',
];

const out = [];
for (let i = 0; i < map.length; i += 2) {
  const [slug, orId] = [map[i], map[i+1]];
  const m = byId[orId];
  if (!m) { out.push({ slug, orId, created: null }); continue; }
  out.push({ slug, orId, created: m.created || null, name: m.name });
}
console.log(JSON.stringify(out.sort((a,b) => (b.created||0) - (a.created||0)), null, 2));
