#!/usr/bin/env python3
"""PreToolUse(Bash) guard: block bulk git staging.

`git add -A` / `git add --all` / `git add .` (and `git commit -a` / `-am`,
which stages every tracked modification before committing) sweep the whole
tree. In a working repo that tree usually carries churn you did not mean to
commit — build artefacts, caches, generated reports, submodule pointer moves —
and, when several agents share a checkout, another agent's in-progress edits.
This hook denies those forms and leaves explicit-path `git add <path> ...`
untouched.

Rules enforced (deny), for every `git` invocation found anywhere in the
command line, including after `&&`, `;` or a pipe, and including `git -C dir`
and other global options:
  * `git add` with any of: `-A`, `-all`, `--all`, `.`, or a clustered short
    option starting `-A` (e.g. `-Av`).
  * `git commit` with `--all`, or a clustered short option containing `a`
    (`-a`, `-am`, `-va`). `--amend` and `-m` alone are NOT bulk staging.

Contract: reads the PreToolUse JSON on stdin, emits a deny decision only on a
confirmed bulk stage, and FAILS OPEN (exit 0, no output) on anything
unexpected — a guard must never block legitimate work because it hit an edge
case.
"""
import json
import shlex
import sys

_OPERATORS = ("&&", "||", ";", "|", "&", "(", ")", "{", "}")
_GIT_OPT_WITH_VALUE = ("-C", "--git-dir", "--work-tree", "--namespace")
_BULK_ADD = ("-A", "--all", ".", "-all")

_HINT = ("Stage explicit paths instead: `git add path/to/file ...` "
         "(and `git commit -m ...` without `-a`).")


def _deny(reason: str) -> None:
    print(json.dumps({
        "hookSpecificOutput": {
            "hookEventName": "PreToolUse",
            "permissionDecision": "deny",
            "permissionDecisionReason": reason,
        }
    }))


def _is_bulk_add(arg: str) -> bool:
    return arg in _BULK_ADD or (arg.startswith("-A") and len(arg) > 2)


def _is_bulk_commit(arg: str) -> bool:
    if arg == "--all":
        return True
    # clustered short options: -a, -am, -va ... but not --amend, not -m
    return arg.startswith("-") and not arg.startswith("--") and "a" in arg[1:]


def main() -> None:
    try:
        data = json.load(sys.stdin)
    except Exception:
        return  # fail open
    cmd = ((data or {}).get("tool_input") or {}).get("command")
    if not isinstance(cmd, str):
        return
    if "add" not in cmd and "commit" not in cmd:
        return
    # Tokenize the WHOLE command with shlex so a quoted `-m "...git add -A..."`
    # commit message stays a SINGLE token and is never parsed as a command.
    # (Naive splitting on newlines/operators mis-read a commit message that
    # merely mentions `git add -A` as a real invocation — a false positive.)
    try:
        toks = shlex.split(cmd, comments=False, posix=True)
    except ValueError:
        return  # unbalanced quotes etc. -> fail open
    i = 0
    while i < len(toks):
        if toks[i] != "git":
            i += 1
            continue
        # find the subcommand, skipping git global options (and their values)
        j = i + 1
        while j < len(toks) and toks[j].startswith("-"):
            j += 2 if toks[j] in _GIT_OPT_WITH_VALUE else 1
        if j >= len(toks) or toks[j] not in ("add", "commit"):
            i = j if j > i else i + 1
            continue
        sub = toks[j]
        # collect this subcommand's args up to the next shell operator / command
        k = j + 1
        args = []
        while k < len(toks) and toks[k] not in _OPERATORS:
            args.append(toks[k])
            k += 1
        if sub == "add" and any(_is_bulk_add(a) for a in args):
            _deny(f"Blocked `git add {' '.join(args)}` — bulk staging is "
                  f"forbidden in this repo: it sweeps up unrelated tree churn "
                  f"(build artefacts, caches, generated reports, submodule "
                  f"pointer moves) and any other agent's in-progress edits. "
                  f"{_HINT}")
            return
        if sub == "commit" and any(_is_bulk_commit(a) for a in args):
            flags = " ".join(a for a in args if _is_bulk_commit(a))
            _deny(f"Blocked `git commit {flags}` — `-a`/`--all` stages every "
                  f"tracked modification, which is bulk staging by another "
                  f"name and sweeps up changes you did not review. {_HINT}")
            return
        i = k


if __name__ == "__main__":
    main()
