// 拉 OpenRouter 全量 models，按展厅中真实存在的模型家族，匹配到 OpenRouter 实际有货的版本，给出 description 中的参数信息
const res = await fetch('https://openrouter.ai/api/v1/models');
const j = await res.json();
const all = j.data;

// 列出所有 Z.ai、Qwen、DeepSeek、Gemini 等候选，让用户看清全貌
const families = {
  'Qwen': all.filter(x => /qwen/i.test(x.id)),
  'DeepSeek': all.filter(x => /deepseek/i.test(x.id)),
  'Claude': all.filter(x => /claude/i.test(x.id)),
  'GPT': all.filter(x => /gpt/i.test(x.id) || /o[1-9]/.test(x.id)),
  'Gemini': all.filter(x => /gemini/i.test(x.id)),
  'Grok': all.filter(x => /grok/i.test(x.id)),
  'Doubao/Seed': all.filter(x => /doubao|seed/i.test(x.id)),
  'Hunyuan': all.filter(x => /hunyuan/i.test(x.id)),
  'Kimi/Moonshot': all.filter(x => /kimi|moonshot/i.test(x.id)),
  'GLM/Z.ai': all.filter(x => /z-ai|glm/i.test(x.id)),
  'MiniMax': all.filter(x => /minimax|minimax/i.test(x.id)),
};
for (const [fam, arr] of Object.entries(families)) {
  console.log(`\n=== ${fam} (${arr.length}) ===`);
  for (const m of arr) {
    // 抽参数规模
    const desc = m.description || '';
    const params = desc.match(/(\d+(?:\.\d+)?[BMK]?\s*(?:parameters?|params?|param|b|bn)\b(?:\s*total)?)/i)?.[0]
      || desc.match(/(\d+(?:\.\d+)?[BMK]?B?\s+(?:active|activated)\b)/i)?.[0]
      || desc.match(/(\d+(?:\.\d+)?[BMK]?\s*(?:billion|million)\s+parameter)/i)?.[0]
      || null;
    const active = desc.match(/(\d+(?:\.\d+)?[BMK]?\s*(?:parameters?|billion|million)\s+active)/i)?.[0] || null;
    const total = desc.match(/(\d+(?:\.\d+)?[BMK]?\s*(?:parameters?|billion|million)\s+total)/i)?.[0] || null;
    console.log(`  ${m.id.padEnd(45)} ctx=${(m.context_length||'').toString().padEnd(8)} | ${(params||'?').padEnd(18)} active=${active||'-'} total=${total||'-'}`);
  }
}
