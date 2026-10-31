"""用 HuggingFace Hub API 查 32 个模型中开源那批的 safetensors 参数量（最权威）"""
import sys
from huggingface_hub import HfApi

api = HfApi()

# 展厅 slug -> HuggingFace 模型 id 候选
candidates = {
    'qwen-3-8-max':            ['Qwen/Qwen3.8-2.4T-A95B', 'Qwen/Qwen3.8-Max'],
    'qwen-3-7-plus':           ['Qwen/Qwen3.7-Plus', 'Qwen/Qwen3.7-Plus-Preview'],
    'qwen-3-8-27b':            ['Qwen/Qwen3.8-27B'],
    'qwen-3-6-27b':            ['Qwen/Qwen3.6-27B'],
    'qianwen-3-6-flash':       ['Qwen/Qwen3.6-Flash', 'Qwen/Qwen3.6-Flash-Preview'],
    'qwen-3-8-flash-api':      ['Qwen/Qwen3.8-Flash', 'Qwen/Qwen3.8-Flash-Next'],
    'deepseek-v4-pro-api-0813':['deepseek-ai/DeepSeek-V4-Pro', 'deepseek-ai/DeepSeek-V4-Pro-0813'],
    'deepseek-v4-pro-0813-dsh-minimal': ['deepseek-ai/DeepSeek-V4-Pro', 'deepseek-ai/DeepSeek-V4-Pro-Base'],
    'deepseek-v4-flash-api-0731': ['deepseek-ai/DeepSeek-V4-Flash-0731', 'deepseek-ai/DeepSeek-V4-Flash'],
    'deepseek-v4-flash-0731-dsh-minimal': ['deepseek-ai/DeepSeek-V4-Flash-0731', 'deepseek-ai/DeepSeek-V4-Flash'],
    'deepseek-v4-pro-0424':    ['deepseek-ai/DeepSeek-V3.2', 'deepseek-ai/DeepSeek-V3', 'deepseek-ai/DeepSeek-V3-Base'],
    'deepseek-0424-pro-trae':  ['deepseek-ai/DeepSeek-V3.2', 'deepseek-ai/DeepSeek-V3'],
    'deepseek-v4-pro-0424-wb': ['deepseek-ai/DeepSeek-V3.2'],
    'deepseek-v4-flash-0424-trae': ['deepseek-ai/DeepSeek-V3.1', 'deepseek-ai/DeepSeek-V3'],
    'deepseek-flash-0424':     ['deepseek-ai/DeepSeek-V3.1'],
    'deepseek-v4-flash-0424-wb': ['deepseek-ai/DeepSeek-V3.1'],
    'opus-5-relay':            [],  # Anthropic 不开源
    'gpt-5-6-codex':           [],  # OpenAI 不开源
    'gpt-5-6-luna-codex':      [],
    'gemini-3-7':              [],
    'gemini-3-6-flash':        [],
    'gemini-3-1-pro':          [],
    'grok-4-6':                [],  # xAI 不开源
    'doubao-expert':           ['ByteDance-Seed/Seed-1.6', 'ByteDance-Seed/Doubao-1.5-pro'],
    'seed-2-1-pro-trae':       ['ByteDance-Seed/Seed-2.1-Turbo', 'ByteDance-Seed/Seed-2.1'],
    'hunyuan-hy3-wb':          ['tencent/Hunyuan-A13B-Instruct', 'tencent/Hunyuan-A13B-Instruct-Base'],
    'kimi-k3-wb':              ['moonshotai/Kimi-K3', 'moonshotai/Kimi-K3-Instruct'],
    'glm-5-3-wb':              ['THUDM/GLM-5.3', 'zai-org/GLM-5.3'],
    'glm-5-2-wb':              ['THUDM/GLM-5.2', 'zai-org/GLM-5.2'],
    'minimax-m3-wb':           ['MiniMax/MiniMax-M3', 'MiniMaxAI/MiniMax-M3'],
    'glm-5-3-flash-zhipu':     ['THUDM/GLM-5.3-Flash', 'zai-org/GLM-5.3-Flash'],
    'glm-5-3-flash-zai':       ['THUDM/GLM-5.3-Flash', 'zai-org/GLM-5.3-Flash'],
}

def fmt(n):
    if n is None: return None
    n = float(n)
    for unit, scale in [('T', 1e12), ('B', 1e9), ('M', 1e6), ('K', 1e3)]:
        if n >= scale:
            return f'{n/scale:.2f}{unit}'
    return str(n)

results = []
for slug, ids in candidates.items():
    if not ids:
        results.append({'slug': slug, 'note': '闭源，未开源到 HF'})
        continue
    found = False
    for mid in ids:
        try:
            info = api.model_info(mid)
            st = info.safetensors
            if st and st.total:
                results.append({
                    'slug': slug, 'hf_id': mid,
                    'params_total': int(st.total),
                    'params_human': fmt(st.total),
                    'breakdown': dict(st.parameters) if st.parameters else None,
                    'downloads': info.downloads,
                    'library': info.library_name,
                })
                found = True
                break
        except Exception as e:
            last_err = str(e)[:80]
            continue
    if not found:
        results.append({'slug': slug, 'tried': ids, 'note': 'HF 上无该 id' if not ids else 'HF 上无该 id'})

import json
print(json.dumps(results, indent=2, ensure_ascii=False))
