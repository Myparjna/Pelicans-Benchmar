"""
给 sites-data.js 32 条卡片统一加 params 字段（总参为准）。
- 数值来源：HuggingFace safetensors 字节数 / 官方披露 / Tavily 行业估算
- 数字格式：27.78B / 397B / 1.60T / 2.45T
- MoE：只标总参（不写激活）
- 估算值加 ~ 前缀
- 闭源且无任何公开数据：—
"""
import re, json
from pathlib import Path

ROOT = Path(r'C:/Users/mypra/Desktop/VibeCoding指南/skills测评项目/03-鹈鹕自行车测试')
src = (ROOT / 'sites-data.js').read_text(encoding='utf-8')
m = src.index('['); n = src.rindex(']') + 1
arr = json.loads(src[m:n])

# 32 张卡片的 params 字段（按 slug 索引）
PARAMS = {
    'qwen-3-8-max':                  '2.45T',          # HF Qwen3.8-2.4T-A95B
    'qwen-3-7-plus':                 '397B',           # 官方 Qwen3.5-397B-A17B（API 名为 Plus）
    'qwen-3-8-27b':                  '27.78B',         # HF Qwen3.8-27B 稠密
    'qwen-3-6-27b':                  '27.78B',         # HF Qwen3.6-27B 稠密
    'qianwen-3-6-flash':             '35.95B',         # HF Qwen3.6-35B-A3B
    'qwen-3-8-flash-api':            '180B',           # HF Qwen3.8-Flash-Next
    'deepseek-v4-pro-api-0813':      '1.60T',          # HF DeepSeek-V4-Pro
    'deepseek-v4-pro-0813-dsh-minimal': '1.60T',
    'deepseek-v4-flash-api-0731':    '304B',           # HF DeepSeek-V4-Flash-0731
    'deepseek-v4-flash-0731-dsh-minimal': '304B',
    'deepseek-v4-pro-0424':          '685B',           # HF V3.2
    'deepseek-0424-pro-trae':        '685B',
    'deepseek-v4-pro-0424-wb':       '685B',
    'deepseek-v4-flash-0424-trae':   '685B',           # HF V3.1
    'deepseek-flash-0424':           '685B',
    'deepseek-v4-flash-0424-wb':     '685B',
    'opus-5-relay':                  '~2-3T',          # 行业估算（Anthropic 未披露）
    'gpt-5-6-codex':                 '~2-4T',          # 行业估算（OpenAI 未披露）
    'gpt-5-6-luna-codex':            '—',              # 官方未披露，且为轻量版
    'gemini-3-7':                    '—',              # Google 不披露
    'gemini-3-6-flash':              '—',
    'gemini-3-1-pro':                '—',
    'grok-4-6':                      '1.5T',           # xAI 官方（Elon 公开 V9 foundation）
    'doubao-expert':                 '~200B',          # 行业估算（Doubao 1.5 Pro 20B 激活 ≈ 140B dense 性能，总参推测）
    'seed-2-1-pro-trae':             '~230B+',         # 类比 Seed 1.6（230B/23B），未官方披露
    'hunyuan-hy3-wb':                '80B',            # HF Hunyuan-A13B
    'kimi-k3-wb':                    '2.78T',          # HF / 官方
    'glm-5-3-wb':                    '753B',           # Z.ai 官方（与 GLM-5.2 同尺寸）
    'glm-5-2-wb':                    '753B',           # HF GLM-5.2
    'minimax-m3-wb':                 '427B',           # HF MiniMax-M3
    'glm-5-3-flash-zhipu':           '320B',           # 官方 + HF
    'glm-5-3-flash-zai':             '320B',
}

miss = []
for s in arr:
    if s['slug'] not in PARAMS:
        miss.append(s['slug'])
        continue
    s['params'] = PARAMS[s['slug']]

if miss:
    print('!! 缺失 slug:', miss)
    raise SystemExit(1)

# 输出回 sites-data.js
out = 'window.SITES = ' + json.dumps(arr, ensure_ascii=False, indent=2) + ';\n'
(ROOT / 'sites-data.js').write_text(out, encoding='utf-8')
print(f'已写入 {len(arr)} 条卡片的 params 字段。')
print('样例前 3 条:')
for s in arr[:3]:
    print(' -', s['slug'], '→', s['params'])
