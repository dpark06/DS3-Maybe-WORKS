#!/usr/bin/env python3
"""Turn a folder of collage cutouts (PNG with transparency) into the web-ready photos the site uses.

Usage:  python3 scripts/make-photos.py /path/to/cutouts_folder
Writes: public/photos/NN.webp (large), public/photos/NN-t.webp (thumbnail), src/data/photos.json
File names starting with "flashy_" or "real_" get mixed together in the grid. Everything else is kept in name order.
Needs:  pip install pillow
"""
import json, os, re, sys
from PIL import Image

src = sys.argv[1]
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
out_dir = os.path.join(root, 'public', 'photos')
os.makedirs(out_dir, exist_ok=True)
files = sorted(f for f in os.listdir(src) if f.lower().endswith('.png'))
flashy = [f for f in files if f.startswith('flashy_')]
real = [f for f in files if f.startswith('real_')]
other = [f for f in files if f not in flashy and f not in real]
order, i, j = [], 0, 0
while i < len(flashy) or j < len(real):
    if i < len(flashy): order.append(flashy[i]); i += 1
    if j < len(real): order.append(real[j]); j += 1
    if i < len(flashy): order.append(flashy[i]); i += 1
order += other

manifest = []
for n, f in enumerate(order, 1):
    pid = '%02d' % n
    im = Image.open(os.path.join(src, f)).convert('RGBA')
    bb = im.getchannel('A').point(lambda a: 255 if a > 8 else 0).getbbox()
    if bb: im = im.crop(bb)
    big = im.copy(); big.thumbnail((1000, 1250)); big.save(os.path.join(out_dir, f'{pid}.webp'), quality=82, method=6)
    th = im.copy(); th.thumbnail((480, 480)); th.save(os.path.join(out_dir, f'{pid}-t.webp'), quality=78, method=6)
    alt = re.sub(r'^(flashy|real)_', '', os.path.splitext(f)[0]).replace('_src', '').replace('-', ' ')
    manifest.append({"id": pid, "kind": "flashy" if f.startswith('flashy') else "real", "alt": alt,
                     "w": big.width, "h": big.height, "tw": th.width, "th": th.height})
json.dump(manifest, open(os.path.join(root, 'src', 'data', 'photos.json'), 'w'), indent=1)
print(len(manifest), 'photos written')
