#!/usr/bin/env python3
"""List the hard moments of a Claude Code session, from its JSONL log.

Usage:
  python3 friction.py --latest [PROJECT_DIR]   newest log of that project (default: cwd)
  python3 friction.py PATH/TO/session.jsonl
Options:
  --hunt N    read/search calls before the next edit that count as a hunt (default 8)
  --big N     tool result size in chars that counts as oversized (default 20000)
  --churn N   edits to one file that count as churn (default 6)
  --json      machine-readable output

The script finds candidate moments. It does not judge them. Read the log around each
line before a row goes in the friction ledger. Standard library only; reads, never writes.
"""
import argparse, collections, hashlib, json, pathlib, re, sys

SEARCH_TOOLS = {"Read", "Grep", "Glob", "LS", "ToolSearch", "WebSearch", "WebFetch"}
EDIT_TOOLS = {"Edit", "Write", "MultiEdit", "NotebookEdit"}
SEARCH_CMD = re.compile(r"^\s*(cd [^;&|]+(&&|;)\s*)?(ls|cat|head|tail|grep|rg|find|fd|wc|sed -n|awk|tree|stat|file|git (log|show|diff|status|grep|blame))\b")
CORRECTION = re.compile(
    r"\b(no[,.!]|nope|wrong|stop\b|don'?t\b|do not\b|not what|i said|i told you|i asked|again\b|"
    r"why (did|are|do) you|instead\b|revert|undo|that'?s not|you (forgot|missed|ignored|broke)|still (not|broken|fails|failing|wrong))",
    re.I)
INTERRUPT = re.compile(r"\[Request interrupted by user")
DENIED = re.compile(r"(user doesn'?t want to proceed|tool use was rejected|permission to use .* has been denied|was denied)", re.I)
HOOK_BLOCK = re.compile(r"hook.{0,80}(block|denied|error|failed)|blocked by .{0,40}hook", re.I | re.S)
WRAPPER = re.compile(r"^\s*<(system-reminder|local-command|command-name|command-message|task-notification|bash-|user-prompt-submit-hook)")


def text_of(content):
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        return "\n".join(b.get("text", "") if isinstance(b, dict) else str(b) for b in content)
    return "" if content is None else str(content)


def short(s, n=140):
    s = " ".join(str(s).split())
    return s if len(s) <= n else s[: n - 1] + "…"


def call_label(name, inp):
    if not isinstance(inp, dict):
        return name
    for key in ("command", "file_path", "pattern", "query", "url", "skill", "description"):
        if inp.get(key):
            return f"{name}: {short(inp[key], 100)}"
    return name


def is_search(name, inp):
    if name in SEARCH_TOOLS:
        return True
    return name == "Bash" and isinstance(inp, dict) and bool(SEARCH_CMD.match(str(inp.get("command", ""))))


def latest_log(project_dir):
    slug = re.sub(r"[^A-Za-z0-9]", "-", str(pathlib.Path(project_dir).resolve()))
    folder = pathlib.Path.home() / ".claude" / "projects" / slug
    logs = sorted(folder.glob("*.jsonl"), key=lambda p: p.stat().st_mtime)
    if not logs:
        sys.exit(f"no session log in {folder}; pass a log path instead")
    return logs[-1]


def scan(path, hunt_min, big_min, churn_min):
    rows, calls, seen_calls = [], {}, collections.defaultdict(list)
    edits = collections.defaultdict(list)
    hunt, err_streak = [], []
    stats = collections.Counter()
    first_ts = last_ts = None

    def add(line, kind, cost, quote, ts=None):
        rows.append({"line": line, "time": ts, "kind": kind, "cost": cost, "quote": short(quote)})

    def close_hunt():
        if len(hunt) >= hunt_min:
            add(hunt[0][0], "hunt", f"{len(hunt)} read/search calls before the next edit",
                f"{hunt[0][1]}  →  {hunt[-1][1]}", hunt[0][2])
        hunt.clear()

    def close_errors():
        if err_streak:
            add(err_streak[0][0], "errors", f"{len(err_streak)} failed call(s) in a row",
                f"{err_streak[0][1]} | {err_streak[0][2]}", err_streak[0][3])
        err_streak.clear()

    with open(path, encoding="utf-8", errors="replace") as fh:
        for n, raw in enumerate(fh, 1):
            try:
                d = json.loads(raw)
            except ValueError:
                continue
            kind, ts = d.get("type"), d.get("timestamp")
            if ts and kind in ("user", "assistant"):
                first_ts, last_ts = first_ts or ts, ts
            if d.get("isSidechain"):
                continue
            if kind == "system" and d.get("subtype") == "compact_boundary":
                stats["compactions"] += 1
                add(n, "compaction", "context was summarized", "work before this line left the context", ts)
                continue
            if kind not in ("user", "assistant"):
                continue
            content = (d.get("message") or {}).get("content")
            blocks = content if isinstance(content, list) else [{"type": "text", "text": text_of(content)}]
            for b in blocks:
                if not isinstance(b, dict):
                    continue
                bt = b.get("type")
                if kind == "assistant" and bt == "tool_use":
                    name, inp = b.get("name", "?"), b.get("input")
                    label = call_label(name, inp)
                    calls[b.get("id")] = (n, name, label)
                    stats["tool calls"] += 1
                    digest = hashlib.sha1((name + json.dumps(inp, sort_keys=True, default=str)).encode()).hexdigest()
                    seen_calls[digest].append((n, label, ts))
                    if is_search(name, inp):
                        hunt.append((n, label, ts))
                    elif name in EDIT_TOOLS:
                        close_hunt()
                        if isinstance(inp, dict) and inp.get("file_path"):
                            edits[inp["file_path"]].append((n, ts))
                elif kind == "user" and bt == "tool_result":
                    body = text_of(b.get("content"))
                    line, name, label = calls.get(b.get("tool_use_id"), (n, "?", "?"))
                    if DENIED.search(body[:600]):
                        stats["denials"] += 1
                        add(line, "denied", "the user refused this call", label, ts)
                    elif HOOK_BLOCK.search(body[:600]):
                        stats["hook blocks"] += 1
                        add(line, "hook-block", "a hook stopped this call", f"{label} | {body}", ts)
                    elif b.get("is_error") is True:
                        stats["errors"] += 1
                        err_streak.append((line, label, body, ts))
                        continue
                    if len(body) >= big_min:
                        stats["oversized results"] += 1
                        add(line, "oversized", f"{len(body):,} chars returned", label, ts)
                    close_errors()
                elif kind == "user" and bt == "text":
                    body = b.get("text", "")
                    if d.get("isMeta") or WRAPPER.match(body) or body.startswith("Base directory for this skill"):
                        continue
                    close_hunt()
                    close_errors()
                    if INTERRUPT.search(body):
                        stats["interrupts"] += 1
                        add(n, "interrupt", "the user stopped the turn", body, ts)
                    elif stats["user turns"] and CORRECTION.search(body[:400]):
                        stats["corrections"] += 1
                        add(n, "correction", "the user corrected the work", body, ts)
                    stats["user turns"] += 1
    close_hunt()
    close_errors()
    for hits in seen_calls.values():
        if len(hits) >= 2:
            stats["repeated calls"] += 1
            add(hits[0][0], "repeat", f"same call made {len(hits)} times (lines {', '.join(str(h[0]) for h in hits[:6])})",
                hits[0][1], hits[0][2])
    for fp, hits in edits.items():
        if len(hits) >= churn_min:
            add(hits[0][0], "churn", f"{len(hits)} edits to one file", fp, hits[0][1])
    rows.sort(key=lambda r: r["line"])
    return rows, stats, first_ts, last_ts


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("log", nargs="?", help="path to a session .jsonl log")
    ap.add_argument("--latest", nargs="?", const=".", metavar="PROJECT_DIR")
    ap.add_argument("--hunt", type=int, default=8)
    ap.add_argument("--big", type=int, default=20000)
    ap.add_argument("--churn", type=int, default=6)
    ap.add_argument("--json", action="store_true")
    a = ap.parse_args()
    if not a.log and a.latest is None:
        ap.error("give a log path or --latest")
    path = pathlib.Path(a.log) if a.log else latest_log(a.latest)
    if not path.is_file():
        sys.exit(f"not a file: {path}")
    rows, stats, t0, t1 = scan(path, a.hunt, a.big, a.churn)
    if not stats["tool calls"] and not stats["user turns"]:
        sys.exit(f"{path}: no user turn and no tool call found; this is not a Claude Code session log, "
                 "or its format changed. Build the ledger by hand.")
    if a.json:
        json.dump({"log": str(path), "from": t0, "to": t1, "stats": stats, "rows": rows}, sys.stdout, indent=1)
        print()
        return
    print(f"log: {path}")
    print(f"span: {t0} → {t1}")
    print("totals: " + ", ".join(f"{v} {k}" for k, v in sorted(stats.items())))
    if not rows:
        print("no candidate moment found")
        return
    print(f"\n{len(rows)} candidate moments (read the log around each line before you keep it):\n")
    for r in rows:
        print(f"L{r['line']:<6} {r['kind']:<11} {r['cost']}\n        {r['quote']}")


if __name__ == "__main__":
    main()
