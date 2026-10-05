"""按联网检索结果回填新增条目的参数规模与知识截止。"""

import io
import json
import os

ROOT = r"C:\Users\mypra\Desktop\VibeCoding指南\skills测评项目\03-鹈鹕自行车测试"
DATA = os.path.join(ROOT, "sites-data.js")

# 来源：DataLearner 模型页 / 火山引擎官方文章 / 腾讯云开发者社区 / OpenAI 发布页
UPDATES = {
    "seed-2-1-pro-0915": {"params": "未公开", "cutoff": "—"},
    "gpt-6-sol": {"params": "未公开", "cutoff": "2026-04"},
    "gpt-6-luna": {"params": "未公开", "cutoff": "2026-05"},
    "gpt-6-1-sol": {"params": "未公开", "cutoff": "2026-04"},
    "step-5-preview": {"params": "600B(A27B)", "cutoff": "—"},
    "hy4-preview": {"params": "770B(A49B)", "cutoff": "—"},
    "spacebunny": {"params": "—", "cutoff": "—"},
    "kimi-k2-8": {"params": "未公开", "cutoff": "—"},
    "claude-sonnet-5-5": {"params": "未公开", "cutoff": "2026-06"},
    "claude-opus-5-5-zcode": {"params": "未公开", "cutoff": "2026-06"},
}


def main():
    raw = io.open(DATA, encoding="utf-8").read()
    body = raw[raw.index("[") : raw.rindex("]") + 1]
    sites = json.loads(body)

    changed = []
    for s in sites:
        patch = UPDATES.get(s["slug"])
        if patch:
            s.update(patch)
            changed.append(s["slug"])

    out = "window.SITES = " + json.dumps(
        sites, ensure_ascii=False, indent=2
    ) + ";\n"
    io.open(DATA, "w", encoding="utf-8").write(out)
    print("已更新 %d 条：" % len(changed))
    print("、".join(changed))


if __name__ == "__main__":
    main()
