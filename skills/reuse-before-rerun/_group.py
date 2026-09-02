#!/usr/bin/env python3
"""Group a list of file paths (stdin) by directory; collapse shard-heavy dirs to one line."""
import sys, os, collections, time
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
    if len(fs) > 3:
        mb = sum(s for _, s, _ in fs) / 1e6
        rows.append((fs[0][0], f"{fmt(fs[0][0])}  [{len(fs):4d} files {mb:7.1f} MB]  {d}/"))
    else:
        for m, s, f in fs:
            rows.append((m, f"{fmt(m)}  {s:>10}  {f}"))
rows.sort(reverse=True)
for _, r in rows[:40]:
    print(r)
if not rows:
    print("(none)")
