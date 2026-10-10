// 精确匹配展厅 32 个模型 slug → OpenRouter 真实模型 id，并提取 description 中的参数规模
const res = await fetch('https://openrouter.ai/api/v1/models');
const j = await res.json();
const all = j.data;

// 32 个 slug → OpenRouter 期望 id
const map = [
  ['qwen-3-8-max',            'qwen/qwen3.8-max'],
  ['qwen-3-7-plus',           'qwen/qwen3.7-plus'],
  ['qwen-3-8-27b',            'qwen/qwen3.8-27b'],
  ['qwen-3-6-27b',            'qwen/qwen3.6-27b'],
  ['qianwen-3-6-flash',       'qwen/qwen3.6-flash'],
  ['qwen-3-8-flash-api',      'qwen/qwen3.8-flash'],
  ['deepseek-v4-pro-api-0813','deepseek/deepseek-v4-pro-0813'],
  ['deepseek-v4-pro-0813-dsh-minimal', 'deepseek/deepseek-v4-pro'],
  ['deepseek-v4-flash-api-0731', 'deepseek/deepseek-v4-flash-0731'],
  ['deepseek-v4-flash-0731-dsh-minimal', 'deepseek/deepseek-v4-flash-0731'],
  ['deepseek-v4-pro-0424',    'deepseek/deepseek-v3.2'],  // 0424 找不到，用 3.2 代替并说明
  ['deepseek-0424-pro-trae',  'deepseek/deepseek-v3.2'],
  ['deepseek-v4-pro-0424-wb', 'deepseek/deepseek-v3.2'],
  ['deepseek-v4-flash-0424-trae', 'deepseek/deepseek-v3.1'],
  ['deepseek-flash-0424',     'deepseek/deepseek-v3.1'],
  ['deepseek-v4-flash-0424-wb', 'deepseek/deepseek-v3.1'],
  ['opus-5-relay',            'anthropic/claude-opus-5'],
  ['gpt-5-6-codex',           'openai/gpt-5.6-sol'],         // 真实有 gpt-5.6-sol
  ['gpt-5-6-luna-codex',      'openai/gpt-5.6-luna'],
  ['gemini-3-7',              'google/gemini-3.7-flash'],
  ['gemini-3-6-flash',        'google/gemini-3.6-flash'],
  ['gemini-3-1-pro',          'google/gemini-3.1-pro-preview'],
  ['grok-4-6',                'x-ai/grok-4.6'],
  ['doubao-expert',           'bytedance-seed/seed-1.6'],
  ['seed-2-1-pro-trae',       'bytedance-seed/seed-2-1-turbo'],
  ['hunyuan-hy3-wb',          'tencent/hunyuan-a13b-instruct'],
  ['kimi-k3-wb',              'moonshotai/kimi-k3'],
  ['glm-5-3-wb',              'z-ai/glm-5.3'],
  ['glm-5-2-wb',              'z-ai/glm-5.2'],
  ['minimax-m3-wb',           'minimax/minimax-m3'],
  ['glm-5-3-flash-zhipu',     'z-ai/glm-5.3-flash'],
  ['glm-5-3-flash-zai',       'z-ai/glm-5.3-flash'],  // zai 渠道和智谱官网同一 id
];

// 抽参数规模
function extractParams(desc) {
  if (!desc) return { total: null, active: null, raw: null };
  const total = desc.match(/(\d+(?:\.\d+)?[BMK]?\s*(?:billion|million|parameters?|params?|param|bn)\s+total)/i)?.[1]
    || desc.match(/(\d+(?:\.\d+)?[BMK]?B?\s*total)/i)?.[1]
    || desc.match(/(\d+(?:\.\d+)?[BMK]?B?)\s*parameters?/i)?.[1]
    || null;
  const active = desc.match(/(\d+(?:\.\d+)?[BMK]?\s*(?:billion|million|parameters?|params?|param|bn)\s+active)/i)?.[1] || null;
  return { total, active };
}

const out = [];
for (const [slug, orId] of map) {
  const m = all.find(x => x.id === orId);
  if (!m) { out.push({ slug, orId, error: 'NOT FOUND' }); continue; }
  const params = extractParams(m.description);
  out.push({
    slug,
    orId: m.id,
    name: m.name,
    context_length: m.context_length,
    pricing: {
      prompt: m.pricing?.prompt ? '$' + (parseFloat(m.pricing.prompt) * 1e6).toFixed(4) + '/M' : null,
      completion: m.pricing?.completion ? '$' + (parseFloat(m.pricing.completion) * 1e6).toFixed(4) + '/M' : null,
    },
    params_total: params.total,
    params_active: params.active,
    desc_excerpt: m.description?.slice(0, 180),
  });
}
console.log(JSON.stringify(out, null, 2));
