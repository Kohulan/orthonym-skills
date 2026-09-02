#!/usr/bin/env python3
"""PreToolUse gate for AskUserQuestion: allow only the 4 hard stops.

WHY
    If you have told the agent "implement it fully, don't wait on me", that
    blanket approval IS the gate — and every mid-task "which option do you
    prefer?" spends your attention on a decision you already delegated. This
    hook enforces the directive mechanically: a question is allowed through
    only when it looks like one of four things you genuinely cannot delegate.

THE 4 HARD STOPS
    1. irreversible / destructive       — deleting, overwriting, resetting,
                                          force-pushing, rewriting history.
    2. security / secrets / publishing  — credentials, tokens, keys, licences,
                                          releases, pushing to a public remote,
                                          deploying to the outside world.
    3. an expensive run                 — roughly 30k+ rows, 1h+ of wall clock,
                                          a full corpus/benchmark, overnight,
                                          or "all cores".
    4. the plan is so broken            — the spec contradicts itself, every
       that every path is a guess         path is a guess, no viable option.

    Anything else is denied with an instruction to choose the broadest
    reasonable option, say so in one line, and keep going.

ESCAPE HATCHES (three, deliberately cheap)
    * Start the question text with "HARD STOP:" — always allowed. This is the
      per-question override the deny message tells the agent about.
    * export ASK_GATE_OFF=1                    — off for the session.
    * touch <repo>/.claude/ask-gate.off        — off for the checkout.

TUNING
    HARD_STOPS below is an ordered list of (label, regex) pairs; a question is
    allowed if ANY regex matches ANY of its text (question, header, option
    labels, option descriptions), case-insensitively. To let a new class of
    question through, add an alternative to the relevant regex — e.g. put your
    own corpus or dataset names into the "expensive run" pattern, or your
    deploy targets into "security/publish". To make the gate stricter, delete
    alternatives. Widening a regex only ever ALLOWS more questions, so it is
    safe to experiment: the failure mode is an extra prompt, not a block.

    The row-count patterns are approximate by design (they match "30k",
    "500k", "30 000", "500 000"); tighten the digit classes if your project's
    numbers collide.

Every denied question is appended to <repo>/.claude/ask-gate.log so you can
see what the agent wanted to ask and widen the patterns from evidence.

The repo root is CLAUDE_PROJECT_DIR if set, else the git toplevel of the
working directory, else the working directory.
"""
import datetime
import json
import os
import re
import subprocess
import sys


def repo_root():
    env = os.environ.get("CLAUDE_PROJECT_DIR")
    if env and os.path.isdir(env):
        return env
    try:
        top = subprocess.run(
            ["git", "rev-parse", "--show-toplevel"],
            capture_output=True, text=True, timeout=5,
        )
        if top.returncode == 0 and top.stdout.strip():
            return top.stdout.strip()
    except Exception:
        pass
    return os.getcwd()


HARD_STOPS = [
    ("irreversible/destructive",
     r"\b(irreversibl\w*|destructiv\w*|delete\w*|remov\w*|wipe\w*|drop(ping)?\b"
     r"|overwrit\w*|reset --hard|force[- ]?push\w*|rm -rf|rewrit\w* (git )?history"
     r"|revert\w*|purge\w*|truncat\w*|discard\w*)"),
    ("security/secrets/publish",
     r"\b(secret\w*|credential\w*|token\w*|password\w*|api[- ]key\w*|security"
     r"|publish\w*|public repo\w*|push(ing)? to (github|origin|remote|public)"
     r"|release\w*|licen[sc]\w*|pypi|npm publish|deploy\w*)"),
    ("expensive run (30k+ rows / 1h+)",
     r"\b(\d{2,3}k\b|\d{2,3} ?000\b|full[- ]?(corpus|dataset|benchmark|split|suite|sweep|run)"
     r"|whole (corpus|dataset|benchmark)|\d+(\.\d+)? ?(hours?|hrs?|h)\b"
     r"|overnight|all night|(\d+|all) cores)"),
    ("plan broken",
     r"\b(every (path|option) is a guess|plan is broken|spec (is )?(wrong|broken)"
     r"|contradict\w*|conflicting (requirements|directives|constraints|rules)"
     r"|cannot proceed|no (valid|viable) (path|option)|locked decision)"),
    ("explicit tag", r"\bHARD[- ]STOP\b"),
]

DENY_REASON = (
    "ask-gate: this question is not one of the 4 hard stops "
    "(irreversible/destructive; security/secrets/publishing; expensive run of "
    "30k+ rows or 1h+; plan so broken that every path is a guess). "
    "Your standing autonomy directive applies: choose the broadest reasonable "
    "option yourself, state the choice in one line, and continue. "
    "If this truly is a hard stop, re-ask with the question text starting "
    "'HARD STOP:'."
)


def question_text(tool_input):
    parts = []
    for q in (tool_input or {}).get("questions") or []:
        parts.append(str(q.get("question", "")))
        parts.append(str(q.get("header", "")))
        for o in q.get("options") or []:
            parts.append(str(o.get("label", "")))
            parts.append(str(o.get("description", "")))
    return " ".join(parts)


def log_denial(root, first_q):
    try:
        d = os.path.join(root, ".claude")
        os.makedirs(d, exist_ok=True)
        stamp = datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds")
        with open(os.path.join(d, "ask-gate.log"), "a") as fh:
            fh.write(f"{stamp}\tDENIED\t{first_q!r}\n")
    except Exception:
        pass  # logging must never break the hook


def main():
    try:
        data = json.load(sys.stdin)
    except Exception:
        return 0  # malformed input: never block on our own bug
    if (data or {}).get("tool_name") != "AskUserQuestion":
        return 0
    root = repo_root()
    if os.environ.get("ASK_GATE_OFF"):
        return 0
    if os.path.exists(os.path.join(root, ".claude", "ask-gate.off")):
        return 0
    tool_input = (data or {}).get("tool_input") or {}
    text = question_text(tool_input)
    for _label, rx in HARD_STOPS:
        if re.search(rx, text, re.I):
            return 0  # hard stop: allow the question through
    qs = tool_input.get("questions") or []
    log_denial(root, (qs[0].get("question", "") if qs else "")[:200])
    print(json.dumps({"hookSpecificOutput": {
        "hookEventName": "PreToolUse",
        "permissionDecision": "deny",
        "permissionDecisionReason": DENY_REASON,
    }}))
    return 0


if __name__ == "__main__":
    sys.exit(main())
