"""整理仓库根目录：模型原件收进 models/ 并按 slug 规范命名，同步 sites-data.js 的 file 字段。"""

import os
import re
import subprocess

ROOT = r"C:\Users\mypra\Desktop\VibeCoding指南\skills测评项目\03-鹈鹕自行车测试"
MODELS = os.path.join(ROOT, "models")
DATA = os.path.join(ROOT, "sites-data.js")

# 未进入展厅数据、仍留在根目录的原件，按内容重新命名
ORPHANS = {
    "1031-1449-鹈鹕白天骑自行车天气动画-terra.html": "terra-archived.html",
    "deepseek0424pro trae.html": "deepseek-v4-pro-0424-trae.html",
    "deepseekflash0424官网版.html": "deepseek-v4-flash-0424-official.html",
    "deepseekv4flash0424trae.html": "deepseek-v4-flash-0424-trae.html",
    "deepseekv4pro424官网版本.html": "deepseek-v4-pro-0424-official.html",
    "grok4.5.html": "grok-4-5.html",
    "grok45真.html": "grok-4-5-real.html",
    "pelican-bike-weather.html": "pelican-bike-weather.html",
    "qwen3.6flash官网.html": "qwen3-6-flash-official.html",
}


def move(old_rel, new_rel):
    old = os.path.join(ROOT, old_rel)
    new = os.path.join(ROOT, new_rel)
    if not os.path.exists(old):
        print("缺失:", old_rel)
        return False
    os.makedirs(os.path.dirname(new), exist_ok=True)
    tracked = subprocess.run(["git", "ls-files", "--error-unmatch", old_rel],
                             cwd=ROOT, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    if tracked.returncode == 0:
        r = subprocess.run(["git", "mv", old_rel, new_rel], cwd=ROOT,
                           stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    else:
        r = subprocess.run(["mv", old, new], shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    ok = r.returncode == 0
    print(("OK  " if ok else "FAIL"), old_rel, "->", new_rel)
    return ok


def main():
    os.makedirs(MODELS, exist_ok=True)
    src = open(DATA, encoding="utf-8").read()
    entries = re.findall(r'"file": "(.*?)",\s*\n\s*"slug": "(.*?)"', src)
    print("数据条目:", len(entries))

    for file_val, slug in entries:
        if file_val.startswith("models/"):
            continue
        new_rel = "models/%s.html" % slug
        if move(file_val, new_rel):
            src = src.replace('"file": "%s"' % file_val, '"file": "%s"' % new_rel)

    for old, new in ORPHANS.items():
        move(old, "models/%s" % new)

    open(DATA, "w", encoding="utf-8", newline="\n").write(src)
    print("sites-data.js 已同步")


if __name__ == "__main__":
    main()
