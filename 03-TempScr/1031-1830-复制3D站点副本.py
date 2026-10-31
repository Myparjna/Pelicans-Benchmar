"""把 models/3d 下已生成的 3D 原件复制为展厅站点副本（sites/3d-*.html）。"""

import os
import shutil

ROOT = r"C:\Users\mypra\Desktop\VibeCoding指南\skills测评项目\03-鹈鹕自行车测试"
SRC_DIR = os.path.join(ROOT, "models", "3d")
SITES = os.path.join(ROOT, "sites")

# 原件名 -> 展厅副本标识
MAPPING = [
    ("GLM5.3-3D鹈鹕.html", "3d-glm-5-3"),
    ("HY40909-1145-体素鹈鹕骑行场景.html", "3d-hy4"),
    ("KIMI-K3体素鹈鹕.html", "3d-kimi-k3"),
    ("V4FLASH官网.html", "3d-deepseek-v4-flash"),
    ("V4PRO官网.html", "3d-deepseek-v4-pro"),
    ("deepseekv4.1flash.html", "3d-deepseek-v4-1-flash"),
    ("gpt6·鹈鹕漫游·体素骑行.html", "3d-gpt-6"),
    ("体素鹈鹕骑自行车-天气循环场景-qwen3.8max.html", "3d-qwen-3-8-max"),
    ("体素鹈鹕骑自行车V4FLASH VISION EXP.html", "3d-deepseek-v4-flash-vision"),
    ("模型鹈鹕-gpt5.6sol.html", "3d-gpt-5-6-sol"),
    ("鹈鹕gpt5.6luna.html", "3d-gpt-5-6-luna"),
    ("鹈鹕白天骑自行车-体素场景-GLM5.3.html", "3d-glm-5-3-scene"),
]


def main():
    os.makedirs(SITES, exist_ok=True)
    for src_name, slug in MAPPING:
        src = os.path.join(SRC_DIR, src_name)
        dst = os.path.join(SITES, slug + ".html")
        if not os.path.exists(src):
            print("缺失:", src_name)
            continue
        shutil.copyfile(src, dst)
        print("OK  %-34s -> sites/%s.html" % (src_name[:34], slug))
    print("完成")


if __name__ == "__main__":
    main()
