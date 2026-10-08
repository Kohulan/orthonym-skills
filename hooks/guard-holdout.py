#!/usr/bin/env python3
"""PreToolUse(Bash) guard, opt-in: stop a held-out run until the user agreed.

The held-out split is the one number nobody optimised against. Run it once
on the agent's own initiative and it is spent: every later result on it is
a dev number. The eval-loop, run-eval and bounded-goals skills say so in
words; this hook makes the agent stop and ask.

WIRING (required; the hook does nothing until you set it)
    EVAL_HOLDOUT_PATTERN  a Python regex matched against each Bash command.
                          Match the command that RUNS the held-out split,
                          e.g. its override flag ('--split[= ]heldout' or
                          '--allow-heldout'), not the bare split name, or
                          every `ls`/`grep` over the split will be stopped.

    Set it in settings.json "env" or in the shell that launches `claude`.
    An `export` run through the Bash tool never reaches a hook.

ESCAPE
    After the user has agreed in so many words, the agent re-runs the command
    with the comment `# holdout-approved` appended. The deny message says so.

Contract: reads the PreToolUse JSON on stdin, denies only on a match, and
FAILS OPEN (exit 0, no output) on anything unexpected: no pattern, a bad
pattern, odd input. A guard must never block work because it hit an edge case.
"""
import json
import os
import re
import sys

ESCAPE = "# holdout-approved"


def main() -> None:
    pattern = os.environ.get("EVAL_HOLDOUT_PATTERN", "").strip()
    if not pattern:
        return
    try:
        rx = re.compile(pattern)
        data = json.load(sys.stdin)
    except Exception:
        return  # fail open
    cmd = ((data or {}).get("tool_input") or {}).get("command")
    if not isinstance(cmd, str) or ESCAPE in cmd:
        return
    m = rx.search(cmd)
    if not m:
        return
    print(json.dumps({
        "hookSpecificOutput": {
            "hookEventName": "PreToolUse",
            "permissionDecision": "deny",
            "permissionDecisionReason": (
                f"Stopped: this command matches EVAL_HOLDOUT_PATTERN "
                f"(matched {m.group(0)!r}), so it may run the held-out split, "
                f"which cannot be undone. Ask the user first. Only if they "
                f"agree in so many words, re-run the same command with "
                f"`{ESCAPE}` appended."),
        }
    }))


if __name__ == "__main__":
    try:
        main()
    except Exception:
        pass  # fail open
