#!/usr/bin/env bash
# PreToolUse(Bash) wrapper: cheap grep pre-filter, then the precise Python guard.
# Only starts Python when the command mentions "add" or "commit", keeping the hot
# Bash path near-zero cost. Always exits 0 (the deny, if any, is emitted as JSON
# by the Python guard).
in=$(cat)
if printf '%s' "$in" | grep -qE 'add|commit'; then
  printf '%s' "$in" | python3 "$(dirname "$0")/block-git-add-all.py"
fi
exit 0
