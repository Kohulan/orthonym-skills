#!/usr/bin/env python3
"""PreToolUse(Bash) guard, opt-in: two exact checks before a full gate starts.

A full regression gate can run for hours. Two mistakes lose that time, and a
script can see both before the gate starts (run-gate says why):
  1. The gate is wrapped in `timeout N` (or `gtimeout`). A slow but healthy
     run is killed and leaves no verdict.
  2. Another gate still holds the verdict lock. Two gates on one verdict file
     overwrite each other's result.

WIRING (required; the hook does nothing until GATE_CMD_RE is set)
    GATE_CMD_RE        Python regex matched against each Bash command; it
                       must match only your full-gate command.
    GATE_VERDICT_FILE  optional; the gate's verdict file. The lock is
                       "<verdict file>.lock" holding the gate's PID. A
                       relative path is taken from the session's cwd.

    Set them in settings.json "env" or in the shell that launches `claude`.
    An `export` run through the Bash tool never reaches a hook.

Contract: reads the PreToolUse JSON on stdin, denies only on one of the two
checks, and FAILS OPEN (exit 0, no output) on anything unexpected.
"""
import json
import os
import re
import sys

_TIMEOUT = re.compile(r"(?:^|[\s;&|(])g?timeout\s")


def _deny(reason: str) -> None:
    print(json.dumps({
        "hookSpecificOutput": {
            "hookEventName": "PreToolUse",
            "permissionDecision": "deny",
            "permissionDecisionReason": reason,
        }
    }))


def _lock_holder(path: str):
    """Return the PID in path if that process is alive, else None."""
    try:
        with open(path, encoding="utf-8", errors="replace") as f:
            m = re.search(r"\d+", f.read(200))
    except OSError:
        return None
    if not m:
        return None
    pid = int(m.group(0))
    if pid <= 1:
        return None
    try:
        os.kill(pid, 0)
    except ProcessLookupError:
        return None  # stale lock: the gate is gone
    except PermissionError:
        return pid  # alive, owned by another user
    except OSError:
        return None
    return pid


def main() -> None:
    gate = os.environ.get("GATE_CMD_RE", "").strip()
    if not gate:
        return
    try:
        rx = re.compile(gate)
        data = json.load(sys.stdin) or {}
    except Exception:
        return  # fail open
    cmd = (data.get("tool_input") or {}).get("command")
    if not isinstance(cmd, str) or not rx.search(cmd):
        return
    if _TIMEOUT.search(cmd):
        _deny("Stopped: the full gate is wrapped in `timeout`. A slow but "
              "healthy gate gets killed and leaves no verdict. Launch it in "
              "the background without `timeout` and wait on the verdict file "
              "(run-gate).")
        return
    verdict = os.environ.get("GATE_VERDICT_FILE", "").strip()
    if verdict:
        lock = verdict + ".lock"
        if not os.path.isabs(lock):
            lock = os.path.join(data.get("cwd") or os.getcwd(), lock)
        pid = _lock_holder(lock)
        if pid:
            _deny(f"Stopped: another gate (PID {pid}) holds {lock}. Two gates "
                  f"on one verdict file overwrite each other. Wait for that "
                  f"verdict, or ask the user before stopping PID {pid}.")


if __name__ == "__main__":
    try:
        main()
    except Exception:
        pass  # fail open
