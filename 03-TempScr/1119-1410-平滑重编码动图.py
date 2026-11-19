"""1119-1410 温和重编码：把动图的「单帧突变」压到上限内，同时不回到「卡住」。

思路（相对 1118-1720 版）：
- 不按累计变化量重采样（那会把变化压缩到少数帧、放大跳变）；
- 长序列（40 帧）取**前段连续的 HEAD_FRAMES 帧**，避开末尾昼夜/夜间硬切；
- 相邻帧之间按实测像素差 **自适应补帧**，把每一步变化压到 MAX_STEP 以内；
- 末尾用同样的补帧方式渐变回首帧，循环处无硬跳；
- 帧数设上限控制体积，连续运动感另由 CSS `thumb-drift` 合成层提供。

输入 02-TempFiles/backup-webp-1118-1720/*.webp（原始备份），默认覆盖 thumbs/。
"""
import argparse
import math
import sys
from pathlib import Path

from PIL import Image, ImageChops, ImageEnhance, ImageStat

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "02-TempFiles" / "backup-webp-1118-1720"
DST = ROOT / "thumbs"

SIZE = (640, 400)
FRAME_MS = 130          # 慢速播放
QUALITY = 45
METHOD = 4
MAX_STEP = 2.5          # 相邻帧允许的最大像素差（160x100 尺度）
MAX_STEPS = 10          # 单个间隔最多补几帧
MAX_FRAMES = 32         # 总帧数上限
HEAD_FRAMES = 24        # 长序列取前段连续帧数
LONG_SEQ = 20


def load_frames(path):
    im = Image.open(path)
    n = getattr(im, "n_frames", 1)
    out = []
    for i in range(n):
        im.seek(i)
        rgba = im.convert("RGBA")
        bg = Image.new("RGBA", rgba.size, (255, 255, 255, 255))
        out.append(Image.alpha_composite(bg, rgba).convert("RGB"))
    return out


def normalize(f):
    w, h = f.size
    tw, th = SIZE
    scale = max(tw / w, th / h)
    nw, nh = round(w * scale), round(h * scale)
    f = f.resize((nw, nh), Image.LANCZOS)
    left, top = (nw - tw) // 2, (nh - th) // 2
    return f.crop((left, top, left + tw, top + th))


def diff(a, b):
    return sum(ImageStat.Stat(
        ImageChops.difference(
            a.resize((160, 100), Image.BILINEAR),
            b.resize((160, 100), Image.BILINEAR))).mean) / 3


def interp(seq, target, budget=None):
    """把 target 帧以「每步不超过 MAX_STEP」的渐变追加到 seq。"""
    anchor = seq[-1]
    d = diff(anchor, target)
    k = min(MAX_STEPS, max(1, math.ceil(d / MAX_STEP)))
    if budget is not None:
        k = min(k, budget)
    for j in range(1, k + 1):
        seq.append(Image.blend(anchor, target, j / k))
    return k


def build(frames):
    n = len(frames)
    src = frames[:HEAD_FRAMES] if n >= LONG_SEQ else frames
    seq = [src[0].copy()]
    for f in src[1:]:
        if len(seq) >= MAX_FRAMES:
            break
        interp(seq, f, budget=MAX_FRAMES - len(seq))
    # 闭环：从当前末帧渐变回首帧，循环处不硬跳
    tail = MAX_FRAMES + 4 - len(seq)
    if tail > 0:
        interp(seq, seq[0].copy(), budget=min(tail, MAX_STEPS))
    return seq


def ensure_distinct(seq):
    out = [seq[0]]
    for f in seq[1:]:
        if ImageChops.difference(out[-1], f).getbbox() is None:
            f = ImageEnhance.Brightness(f).enhance(1.004)
        out.append(f)
    return out


def encode(src, dst):
    frames = [normalize(f) for f in load_frames(src)]
    seq = ensure_distinct(build(frames))
    seq[0].save(
        dst, format="WEBP", save_all=True, append_images=seq[1:],
        duration=FRAME_MS, loop=0, quality=QUALITY, method=METHOD,
    )
    return src.stat().st_size, dst.stat().st_size, len(seq)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--slugs", default="", help="逗号分隔的 slug；留空为全部")
    ap.add_argument("--out", default="", help="输出目录；留空为覆盖 thumbs/")
    a = ap.parse_args()
    files = sorted(SRC.glob("*.webp"))
    if a.slugs:
        wanted = {s.strip() for s in a.slugs.split(",") if s.strip()}
        files = [f for f in files if f.stem in wanted]
    out_dir = Path(a.out) if a.out else DST
    out_dir.mkdir(parents=True, exist_ok=True)
    before = after = 0
    for i, f in enumerate(files, 1):
        b, c, n = encode(f, out_dir / f.name)
        before += b
        after += c
        print("ok %2d/%2d %-36s %4dKB -> %4dKB  frames=%d" % (
            i, len(files), f.stem[:36], b // 1024, c // 1024, n))
        sys.stdout.flush()
    print("合计 %.2f MB -> %.2f MB" % (before / 1048576, after / 1048576))


if __name__ == "__main__":
    main()
