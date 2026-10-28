#!/usr/bin/env python3
"""Change one piece of text in a pptx the user has edited by hand, without a rebuild.

Usage: patch_text.py <poster.pptx> "<old text>" "<new text>" [--backup-dir DIR]

A rebuild from the script would throw away the user's own edits, so a change to a
hand-edited file goes into its slide XML instead. The script:
- copies the file to <backup-dir>/<name>_before_<YYYY-mm-dd_HHMMSS>.pptx first
  (default backup dir: backup/ next to the file);
- replaces <old text> only when it occurs exactly once, inside one text run
  (<a:t>), on all slides together; otherwise it stops and changes nothing;
- keeps the run's formatting (font, size, colour) and every other part of the file as is.
Slide text only: chart titles and labels live in ppt/charts/chartN.xml; change those in the
build script and tell the user, or edit that chart part the same way by hand.
Then validate, run fontcheck.py, render, and copy the same change into the build script.
"""
import datetime
import os
import re
import shutil
import sys
import zipfile
from xml.sax.saxutils import escape


def main():
    args = sys.argv[1:]
    if len(args) < 3:
        sys.exit(__doc__)
    src, old, new = args[:3]
    bdir = args[args.index("--backup-dir") + 1] if "--backup-dir" in args else \
        os.path.join(os.path.dirname(os.path.abspath(src)), "backup")
    old_x, new_x = escape(old), escape(new)
    zin = zipfile.ZipFile(src)
    slides = [n for n in zin.namelist() if re.fullmatch(r"ppt/slides/slide\d+\.xml", n)]
    hits = []
    for n in slides:
        for m in re.finditer(r"<a:t>([^<]*)</a:t>", zin.read(n).decode("utf-8")):
            if old_x in m.group(1):
                hits.append((n, m.group(1)))
    if len(hits) != 1:
        where = "; ".join(f"{n}: {t[:60]}" for n, t in hits) or "no text run contains it"
        sys.exit(f"'{old}' must occur exactly once inside one text run; found {len(hits)} ({where}). "
                 "Nothing changed.")
    part, run = hits[0]
    if run.count(old_x) != 1:
        sys.exit(f"'{old}' occurs {run.count(old_x)} times in one run; give a longer text. Nothing changed.")
    os.makedirs(bdir, exist_ok=True)
    stem = os.path.splitext(os.path.basename(src))[0]
    stamp = datetime.datetime.now().strftime("%Y-%m-%d_%H%M%S")
    backup = os.path.join(bdir, f"{stem}_before_{stamp}.pptx")
    shutil.copy2(src, backup)
    tmp = src + ".tmp"
    with zipfile.ZipFile(tmp, "w") as zout:
        for item in zin.infolist():
            data = zin.read(item.filename)
            if item.filename == part:
                data = data.decode("utf-8").replace(f"<a:t>{run}</a:t>",
                                                    f"<a:t>{run.replace(old_x, new_x)}</a:t>", 1).encode("utf-8")
            zout.writestr(item, data)
    zin.close()
    os.replace(tmp, src)
    print(f"backup: {backup}\nchanged in {part}: '{old}' -> '{new}'")


if __name__ == "__main__":
    main()
