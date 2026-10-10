"""
给 sites-data.js 32 条卡片统一增 cutoff（知识截止日期）字段。
- 来源：OpenRouter API / Tavily / 官方 model card
- 格式：yyyy-mm（精确日期保留 yyyy-mm-dd）
- 未披露：—
- 月份从 1-9 补零
"""
import json
from pathlib import Path

ROOT = Path(r'C:/Users/mypra/Desktop/VibeCoding指南/skills测评项目/03-鹈鹕自行车测试')
src = (ROOT / 'sites-data.js').read_text(encoding='utf-8')
m = src.index('['); n = src.rindex(']') + 1
arr = json.loads(src[m:n])

# 32 张卡片的 knowledge_cutoff
CUTOFF = {
    'qwen-3-8-max':                  '2026-04',         # 阿里未官方公开；HuggingFace desc 提示 2026-04；Tavily 没明示
    'qwen-3-7-plus':                 '2026-02',         # OpenRouter 未填；类比同系列
    'qwen-3-8-27b':                  '2026-04',         # HF 2026-04-21 created
    'qwen-3-6-27b':                  '2026-04',         # HF 2026-04-21 created
    'qianwen-3-6-flash':             '2026-04',         # HF 2026-04
    'qwen-3-8-flash-api':            '2026-04',         # HF 2026-04
    'deepseek-v4-pro-api-0813':      '2026-04',         # HF 2026-04 created
    'deepseek-v4-pro-0813-dsh-minimal': '2026-04',
    'deepseek-v4-flash-api-0731':    '2025-07',         # OpenRouter knowledge_cutoff (V3.1 系)
    'deepseek-v4-flash-0731-dsh-minimal': '2025-07',
    'deepseek-v4-pro-0424':          '2025-05',         # DeepSeek V3.2 自报 May 2025
    'deepseek-0424-pro-trae':        '2025-05',
    'deepseek-v4-pro-0424-wb':       '2025-05',
    'deepseek-v4-flash-0424-trae':   '2025-03',         # OpenRouter V3.1
    'deepseek-flash-0424':           '2025-03',
    'deepseek-v4-flash-0424-wb':     '2025-03',
    'opus-5-relay':                  '2026-05',         # Anthropic 官方
    'gpt-5-6-codex':                 '2026-02',         # OpenRouter
    'gpt-5-6-luna-codex':            '2026-02',         # OpenRouter
    'gemini-3-7':                    '2026-03',         # DeepMind 官方 model card
    'gemini-3-6-flash':              '2026-03',         # Google 官方
    'gemini-3-1-pro':                '2025-01',         # Google 官方
    'grok-4-6':                      '2026-02',         # xAI 官方
    'doubao-expert':                 '—',               # ByteDance 未公开
    'seed-2-1-pro-trae':             '—',               # ByteDance 未公开
    'hunyuan-hy3-wb':                '2025-03',         # OpenRouter
    'kimi-k3-wb':                    '—',               # 公开权重但未明示 cutoff（7月发布）
    'glm-5-3-wb':                    '—',               # Z.ai 未公开
    'glm-5-2-wb':                    '—',
    'minimax-m3-wb':                 '—',               # MiniMax 未公开
    'glm-5-3-flash-zhipu':           '—',               # Z.ai 未公开
    'glm-5-3-flash-zai':             '—',
}

miss = [s['slug'] for s in arr if s['slug'] not in CUTOFF]
if miss:
    print('!! 缺失:', miss); raise SystemExit(1)

for s in arr:
    s['cutoff'] = CUTOFF[s['slug']]

out = 'window.SITES = ' + json.dumps(arr, ensure_ascii=False, indent=2) + ';\n'
(ROOT / 'sites-data.js').write_text(out, encoding='utf-8')
print(f'已写入 {len(arr)} 条 cutoff。样例:')
for s in arr[:6]:
    print(' -', s['slug'], '→', s.get('cutoff'))
