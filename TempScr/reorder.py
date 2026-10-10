"""
按 OpenRouter created 时间戳倒序重排 32 条卡片（最近在前）。
不改内容，仅调换数组顺序。
"""
import json
from pathlib import Path

ROOT = Path(r'C:/Users/mypra/Desktop/VibeCoding指南/skills测评项目/03-鹈鹕自行车测试')
src = (ROOT / 'sites-data.js').read_text(encoding='utf-8')
m = src.index('['); n = src.rindex(']') + 1
arr = json.loads(src[m:n])

# slug -> OpenRouter created（Unix 秒）；来自 or-released.mjs 输出
RELEASED = {
    'qwen-3-8-flash-api':        1787773060,
    'glm-5-3-flash-zhipu':       1787752741,
    'glm-5-3-flash-zai':         1787752741,
    'glm-5-3-wb':                1787086655,
    'qwen-3-8-27b':              1786722910,
    'gemini-3-7':                1786640581,
    'seed-2-1-pro-trae':         1786552176,
    'deepseek-v4-pro-api-0813':  1786549364,
    'grok-4-6':                  1786548957,
    'qwen-3-8-max':              1785731612,
    'deepseek-v4-flash-api-0731': 1785478908,
    'deepseek-v4-flash-0731-dsh-minimal': 1785478908,
    'opus-5-relay':              1784912544,
    'gemini-3-6-flash':          1784646733,
    'kimi-k3-wb':                1784215858,
    'gpt-5-6-luna-codex':        1783590864,
    'gpt-5-6-codex':             1783590850,
    'glm-5-2-wb':                1781631930,
    'qwen-3-7-plus':             1780491783,
    'minimax-m3-wb':             1780245374,
    'qianwen-3-6-flash':         1777261362,
    'qwen-3-6-27b':              1777255064,
    'deepseek-v4-pro-0813-dsh-minimal': 1777000679,
    'gemini-3-1-pro':            1771509627,
    'doubao-expert':             1766504997,
    'deepseek-v4-pro-0424':      1764594642,
    'deepseek-0424-pro-trae':    1764594642,
    'deepseek-v4-pro-0424-wb':   1764594642,
    'deepseek-v4-flash-0424-trae': 1755779628,
    'deepseek-flash-0424':       1755779628,
    'deepseek-v4-flash-0424-wb': 1755779628,
    'hunyuan-hy3-wb':            1751987664,
}

for s in arr:
    s['released'] = RELEASED.get(s['slug'])

# 倒序
arr.sort(key=lambda s: -(s.get('released') or 0))

out = 'window.SITES = ' + json.dumps(arr, ensure_ascii=False, indent=2) + ';\n'
(ROOT / 'sites-data.js').write_text(out, encoding='utf-8')
print(f'已重排 {len(arr)} 条。顺序:')
for i, s in enumerate(arr, 1):
    d = s.get('released')
    from datetime import datetime
    date = datetime.fromtimestamp(d).strftime('%Y-%m-%d') if d else '????-??-??'
    print(f' {i:2d}. {date}  {s["slug"]:<35s} {s["model"]}')
