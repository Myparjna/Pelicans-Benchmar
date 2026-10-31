// 查询 OpenRouter 上 GPT-6 / Gemini 3.8 的 created、context、knowledge_cutoff
import { ProxyAgent, fetch as undiciFetch } from 'undici';

const proxy = process.env.HTTPS_PROXY || 'http://127.0.0.1:7897';
let res;
try {
  res = await fetch('https://openrouter.ai/api/v1/models', { signal: AbortSignal.timeout(15000) });
} catch (e) {
  console.error('直连失败，走代理:', e.message);
  res = await undiciFetch('https://openrouter.ai/api/v1/models', {
    dispatcher: new ProxyAgent(proxy),
    signal: AbortSignal.timeout(20000),
  });
}
const j = await res.json();
const hits = j.data.filter(m => /gpt-6|gemini-3\.8/i.test(m.id));
for (const m of hits) {
  console.log(JSON.stringify({
    id: m.id,
    name: m.name,
    created: m.created,
    createdIso: m.created ? new Date(m.created * 1000).toISOString() : null,
    context: m.context_length,
    cutoff: m.knowledge_cutoff ?? null,
    pricing: m.pricing?.prompt,
  }, null, 2));
}
if (!hits.length) console.log('未匹配到 gpt-6 / gemini-3.8，共', j.data.length, '个模型');
