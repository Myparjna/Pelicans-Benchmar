"""
统一参数量单位为 B + 整数化：
- 2.45T -> 2450B
- 1.60T -> 1600B（但 HF 字节 1598839674782 ≈ 1599B，为了 4 位整数显示 1599B 偏离 1600 太小；为对齐 HF 精确数用 round）
- 304B -> 304B
- 27.78B -> 28B（这是 HF 精确字节 27781427952，rounded）
- 35.95B -> 36B（HF 字节 35952534528，rounded）
- 2.78T -> 2780B（HF 字节 2779931837184）
- 1.5T -> 1500B
- 685B -> 685B
- 80B -> 80B
- 427B -> 427B
- 320B -> 320B
- 397B -> 397B
- 180B -> 180B
- 753B -> 753B
估算的 ~XXB 保留 ~ 前缀
不披露仍是 —
"""
import json
from pathlib import Path

ROOT = Path(r'C:/Users/mypra/Desktop/VibeCoding指南/skills测评项目/03-鹈鹕自行车测试')
src = (ROOT / 'sites-data.js').read_text(encoding='utf-8')
m = src.index('['); n = src.rindex(']') + 1
arr = json.loads(src[m:n])

# 精确整数化（基于 HF safetensors 字节数与官方披露）
PARAMS = {
    'qwen-3-8-max':                  '2450B',          # 2446182725504
    'qwen-3-7-plus':                 '397B',           # 官方
    'qwen-3-8-27b':                  '28B',            # 27781427952 ≈ 28B（27.78B 整数化）
    'qwen-3-6-27b':                  '28B',            # 27781427952
    'qianwen-3-6-flash':             '36B',            # 35952534528
    'qwen-3-8-flash-api':            '180B',           # 180B
    'deepseek-v4-pro-api-0813':      '1599B',          # 1598839674782 ≈ 1599B
    'deepseek-v4-pro-0813-dsh-minimal': '1599B',
    'deepseek-v4-flash-api-0731':    '304B',           # 304180418494 ≈ 304B
    'deepseek-v4-flash-0731-dsh-minimal': '304B',
    'deepseek-v4-pro-0424':          '685B',           # 685396921376
    'deepseek-0424-pro-trae':        '685B',
    'deepseek-v4-pro-0424-wb':       '685B',
    'deepseek-v4-flash-0424-trae':   '685B',           # 684531386000 ≈ 685B
    'deepseek-flash-0424':           '685B',
    'deepseek-v4-flash-0424-wb':     '685B',
    'opus-5-relay':                  '~2000B',         # 行业估算 2-3T
    'gpt-5-6-codex':                 '~3000B',         # 行业估算 2-4T（取中位）
    'gpt-5-6-luna-codex':            '—',
    'gemini-3-7':                    '—',
    'gemini-3-6-flash':              '—',
    'gemini-3-1-pro':                '—',
    'grok-4-6':                      '1500B',          # 1.5T
    'doubao-expert':                 '~200B',          # 行业估算
    'seed-2-1-pro-trae':             '~230B',          # 类比 Seed 1.6
    'hunyuan-hy3-wb':                '80B',            # 80393183232
    'kimi-k3-wb':                    '2780B',          # 2779931837184
    'glm-5-3-wb':                    '753B',           # 753329940480
    'glm-5-2-wb':                    '753B',
    'minimax-m3-wb':                 '427B',           # 427040140160
    'glm-5-3-flash-zhipu':           '320B',
    'glm-5-3-flash-zai':             '320B',
}

miss = [s['slug'] for s in arr if s['slug'] not in PARAMS]
if miss:
    print('!! 缺失:', miss); raise SystemExit(1)

for s in arr:
    s['params'] = PARAMS[s['slug']]

out = 'window.SITES = ' + json.dumps(arr, ensure_ascii=False, indent=2) + ';\n'
(ROOT / 'sites-data.js').write_text(out, encoding='utf-8')
print(f'已写入 {len(arr)} 条。样例:')
for s in arr[:6]:
    print(' -', s['slug'], '→', s['params'])
