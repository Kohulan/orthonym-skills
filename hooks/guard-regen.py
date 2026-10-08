#!/usr/bin/env python3
"""PreToolUse(Bash) guard, opt-in: stop a bulk snapshot / golden regeneration.

One regeneration command rewrites every expected value at once, so every bug
the code has today becomes the specification. The change-asserted-value skill
asks for evidence per value before it moves; this hook stops the bulk path so
the agent lists each old -> new value first.

Stopped (anywhere in the command line, after `&&`, `;` or a pipe too):
  * pytest:  --snapshot-update (syrupy), --force-regen, --regen-all
             (pytest-regressions)
  * jest:    -u, --updateSnapshot, --update-snapshot (only when the command
             runs jest or vitest, since `-u` means other things elsewhere)
  * vitest:  -u, --update
  * any:     --update-snapshots, --update-goldens, --update-golden
  * env:     UPDATE_SNAPSHOTS=1, UPDATE_GOLDEN=1, UPDATE_GOLDENS=1,
             UPDATE_EXPECT=1, INSTA_UPDATE=always, SNAPSHOT_UPDATE=1
  * cargo insta accept

Needs no wiring. To add your project's own switch, extend FLAGS or ENV_VARS.

ESCAPE
    After every changed value is listed with its evidence, the agent re-runs
    the command with the comment `# values-reviewed` appended.

Contract: reads the PreToolUse JSON on stdin, denies only on a confirmed
regeneration switch, and FAILS OPEN (exit 0, no output) on anything odd.
"""
import json
import shlex
import sys

ESCAPE = "# values-reviewed"
FLAGS = {"--snapshot-update", "--force-regen", "--regen-all",
         "--update-snapshots", "--update-goldens", "--update-golden"}
JS_RUNNERS = {"jest", "vitest"}
JS_FLAGS = {"-u", "--updateSnapshot", "--update-snapshot", "--update"}
ENV_VARS = {"UPDATE_SNAPSHOTS", "UPDATE_GOLDEN", "UPDATE_GOLDENS",
            "UPDATE_EXPECT", "INSTA_UPDATE", "SNAPSHOT_UPDATE"}
_OPERATORS = ("&&", "||", ";", "|", "&")
# cheap pre-filter: skip tokenising unless one of these substrings appears
_HINTS = ("snapshot", "regen", "golden", "update", "-u", "insta", "UPDATE")


def _find(cmd: str):
    """Return the offending switch, or None."""
    toks = shlex.split(cmd, comments=False, posix=True)
    seg = []  # tokens of the current simple command
    for tok in toks + [";"]:
        if tok not in _OPERATORS:
            seg.append(tok)
            continue
        words = {t.rsplit("/", 1)[-1] for t in seg}
        for t in seg:
            if t in FLAGS or t.startswith(("--snapshot-update=", "--update-snapshots=")):
                return t
            name, eq, val = t.partition("=")
            if eq and name in ENV_VARS and val.lower() not in ("", "0", "false", "no", "never"):
                return t
            if words & JS_RUNNERS and t in JS_FLAGS:
                return t
        if "insta" in words and "accept" in seg:
            return "cargo insta accept"
        seg = []
    return None


def main() -> None:
    try:
        data = json.load(sys.stdin)
    except Exception:
        return  # fail open
    cmd = ((data or {}).get("tool_input") or {}).get("command")
    if not isinstance(cmd, str) or ESCAPE in cmd:
        return
    if not any(h in cmd for h in _HINTS):
        return
    try:
        hit = _find(cmd)
    except ValueError:
        return  # unbalanced quotes etc. -> fail open
    if not hit:
        return
    print(json.dumps({
        "hookSpecificOutput": {
            "hookEventName": "PreToolUse",
            "permissionDecision": "deny",
            "permissionDecisionReason": (
                f"Stopped `{hit}`: a bulk snapshot/golden regeneration turns "
                f"every current bug into the expected value. First list each "
                f"value that would change (old -> new) with its evidence "
                f"(change-asserted-value). Then re-run the same command with "
                f"`{ESCAPE}` appended."),
        }
    }))


if __name__ == "__main__":
    try:
        main()
    except Exception:
        pass  # fail open
