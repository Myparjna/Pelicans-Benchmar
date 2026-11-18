"""重编码展厅动画 WebP：去掉近似重复帧、按变化进度均匀重采样、插值补帧。

规格统一：640x400（与卡片 16:10 一致）、18 帧、83ms/帧（12fps）、loop=0、约 1.5s 循环。
输入 02-TempFiles/backup-webp-1118-1720/*.webp（原始备份），默认输出覆盖 thumbs/。

用法：
  python 1118-1720-重编码动图.py                # 全量覆盖 thumbs/
  python 1118-1720-重编码动图.py --slugs a,b,c --out 02-TempFiles/sample-recoded
"""
import argparse
import math
import sys
from pathlib import Path

from PIL import Image, ImageChops, ImageEnhance, ImageStat

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "02-TempFiles" / "backup-webp-1118-1720"
DST = ROOT / "thumbs"

SIZE = (640, 400)       # 16:10，与 .thumb-wrap aspect-ratio 一致，避免 object-fit 裁切
KEYS = 9                # 关键帧数
OUT_FRAMES = 18         # 关键帧两两之间插 1 帧
FRAME_MS = 83           # 12fps
QUALITY = 58
METHOD = 4
MOTION_THRESHOLD = 40   # 累计变化量低于此值的素材叠加连续推镜，消除「静止假动画」


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
    """等比 cover 裁切到 SIZE。"""
    w, h = f.size
    tw, th = SIZE
    scale = max(tw / w, th / h)
    nw, nh = round(w * scale), round(h * scale)
    f = f.resize((nw, nh), Image.LANCZOS)
    left, top = (nw - tw) // 2, (nh - th) // 2
    return f.crop((left, top, left + tw, top + th))


def frame_diff(a, b):
    return sum(ImageStat.Stat(ImageChops.difference(a, b)).mean) / 3


def resample(frames, keys=KEYS):
    """按累计画面变化量均匀取关键帧：静止段被跳过，突变段被展开。返回 (关键帧, 累计变化量)。"""
    small = [f.resize((160, 100), Image.BILINEAR) for f in frames]
    cum = [0.0]
    for i in range(1, len(small)):
        cum.append(cum[-1] + frame_diff(small[i - 1], small[i]))
    total = cum[-1]
    if total < 1e-6:
        return [frames[0]] * keys, 0.0
    picked = []
    for j in range(keys):
        target = total * j / (keys - 1)
        i = 1
        while i < len(cum) and cum[i] < target:
            i += 1
        i = min(i, len(cum) - 1)
        span = cum[i] - cum[i - 1]
        w = (target - cum[i - 1]) / span if span > 1e-6 else 0.0
        picked.append(Image.blend(frames[i - 1], frames[i], max(0.0, min(1.0, w))))
    return picked, total


def add_motion(seq):
    """给低变化素材叠加缓慢推镜 + 明暗呼吸（sin 往返，循环无缝）。

    原页面本身没有动画时，纯重采样仍会产出大量零变化帧；这层连续运动让预览
    在 12fps 下始终有位移，同时避免 WebP 编码器把相同帧合并成单一长帧。
    """
    out = []
    w, h = SIZE
    for i, f in enumerate(seq):
        t = i / len(seq)
        s = 1.0 + 0.05 * (1 - math.cos(2 * math.pi * t)) / 2
        nw, nh = round(w * s), round(h * s)
        big = f.resize((nw, nh), Image.LANCZOS)
        dx = (nw - w) // 2 + round(6 * math.sin(2 * math.pi * t))
        dy = (nh - h) // 2
        dx = max(0, min(nw - w, dx))
        frame = big.crop((dx, dy, dx + w, dy + h))
        frame = ImageEnhance.Brightness(frame).enhance(1.0 + 0.02 * math.sin(2 * math.pi * t))
        out.append(frame)
    return out


def ensure_distinct(seq):
    """打散完全相同的相邻帧，避免 WebP 编码器把它们合并成单一长帧（规格不统一）。"""
    out = [seq[0]]
    for f in seq[1:]:
        if ImageChops.difference(out[-1], f).getbbox() is None:
            f = ImageEnhance.Brightness(f).enhance(1.004)
        out.append(f)
    return out


def build(frames, motion=False):
    keys, total = resample(frames)
    out = []
    for i in range(len(keys)):
        a, b = keys[i], keys[(i + 1) % len(keys)]
        out.append(a)
        out.append(Image.blend(a, b, 0.5))   # 尾→首也补一帧，闭环不跳
    assert len(out) == OUT_FRAMES
    if motion and total < MOTION_THRESHOLD:
        out = add_motion(out)
    return ensure_distinct(out), total


def encode(src, dst, motion=False):
    frames = [normalize(f) for f in load_frames(src)]
    seq, total = build(frames, motion=motion)
    seq[0].save(
        dst, format="WEBP", save_all=True, append_images=seq[1:],
        duration=FRAME_MS, loop=0, quality=QUALITY, method=METHOD,
    )
    return src.stat().st_size, dst.stat().st_size, total


def main():
    global SIZE, QUALITY
    ap = argparse.ArgumentParser()
    ap.add_argument("--slugs", default="", help="逗号分隔的 slug；留空为全部")
    ap.add_argument("--out", default="", help="输出目录；留空为覆盖 thumbs/")
    ap.add_argument("--quality", type=int, default=QUALITY)
    ap.add_argument("--size", default="640x400")
    ap.add_argument("--motion", action="store_true", help="低变化素材烘焙推镜（体积会明显变大，默认关闭）")
    a = ap.parse_args()

    SIZE = tuple(int(v) for v in a.size.split("x"))
    QUALITY = a.quality

    files = sorted(SRC.glob("*.webp"))
    if a.slugs:
        wanted = {s.strip() for s in a.slugs.split(",") if s.strip()}
        files = [f for f in files if f.stem in wanted]
    out_dir = Path(a.out) if a.out else DST
    out_dir.mkdir(parents=True, exist_ok=True)

    total_before = total_after = 0
    motion_count = 0
    for i, f in enumerate(files, 1):
        before, after, total = encode(f, out_dir / f.name, motion=a.motion)
        if total < MOTION_THRESHOLD:
            motion_count += 1
        total_before += before
        total_after += after
        print("ok %2d/%2d %-36s %4dKB -> %4dKB (-%d%%) motion=%s" % (
            i, len(files), f.stem[:36], before // 1024, after // 1024,
            round((1 - after / before) * 100) if before else 0,
            "Y" if total < MOTION_THRESHOLD else "N"))
        sys.stdout.flush()
    print("合计 %.2f MB -> %.2f MB；叠加推镜 %d 张" % (
        total_before / 1048576, total_after / 1048576, motion_count))


if __name__ == "__main__":
    main()
