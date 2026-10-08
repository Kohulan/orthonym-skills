#!/usr/bin/env python3
"""Group a list of file paths (stdin) by directory; collapse shard-heavy dirs to one line."""
import sys, os, collections, time
SHARD_MIN = 4   # a dir with 4+ hits is a shard dir: one summary line instead of one per file
MAX_ROWS = 40   # about one screen, newest first; the rest is counted, not dropped silently
files = [l.rstrip("\n") for l in sys.stdin if l.strip()]
bydir = collections.defaultdict(list)
for f in files:
    try:
        bydir[os.path.dirname(f)].append((os.path.getmtime(f), os.path.getsize(f), f))
    except OSError:
        pass
rows = []
fmt = lambda t: time.strftime("%Y-%m-%d %H:%M", time.localtime(t))
for d, fs in bydir.items():
    fs.sort(reverse=True)
    if len(fs) >= SHARD_MIN:
        mb = sum(s for _, s, _ in fs) / 1e6
        rows.append((fs[0][0], f"{fmt(fs[0][0])}  [{len(fs):4d} files {mb:7.1f} MB]  {d}/"))
    else:
        for m, s, f in fs:
            rows.append((m, f"{fmt(m)}  {s:>10}  {f}"))
rows.sort(reverse=True)
for _, r in rows[:MAX_ROWS]:
    print(r)
if len(rows) > MAX_ROWS:
    print(f"(+{len(rows) - MAX_ROWS} older rows not shown: narrow the keyword or add a date window)")
if not rows:
    print("(none)")
