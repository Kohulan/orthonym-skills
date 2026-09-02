#!/usr/bin/env bash
# sweep.sh <keyword> [since YYYY-MM-DD] [until YYYY-MM-DD]
# One-call search for an existing result before re-running anything expensive.
# Order: ledger -> files (repo + extra roots) -> notes.
#
# Roots (override with env vars):
#   RBR_REPO         repo to search        default: git toplevel, else $PWD
#   RBR_LEDGER       results ledger        default: $RBR_REPO/RESULTS-LEDGER.md
#   RBR_EXTRA_ROOTS  colon-separated extra dirs to search (session scratchpads, a notes
#                    or memory dir, an artifact store)   default: empty
set -u
KW="${1:?usage: sweep.sh <keyword> [since YYYY-MM-DD] [until YYYY-MM-DD]}"
SINCE="${2:-}"; UNTIL="${3:-}"

REPO="${RBR_REPO:-$(git rev-parse --show-toplevel 2>/dev/null || printf '%s' "$PWD")}"
LEDGER="${RBR_LEDGER:-$REPO/RESULTS-LEDGER.md}"

ROOTS=()
[ -d "$REPO" ] && ROOTS+=("$REPO")
if [ -n "${RBR_EXTRA_ROOTS:-}" ]; then
  IFS=':' read -r -a _extra <<< "$RBR_EXTRA_ROOTS"
  for r in ${_extra[@]+"${_extra[@]}"}; do
    [ -n "$r" ] && [ -d "$r" ] && ROOTS+=("$r")
  done
fi
if [ "${#ROOTS[@]}" -eq 0 ]; then echo "sweep: no searchable root (RBR_REPO=$REPO)" >&2; exit 2; fi

PRUNE=( \( -name .git -o -name .venv -o -name venv -o -name node_modules -o -name __pycache__ \
        -o -name .mypy_cache -o -name .pytest_cache -o -name dist -o -name build \) -prune -o )
T=(); [ -n "$SINCE" ] && T+=(-newermt "$SINCE"); [ -n "$UNTIL" ] && T+=(! -newermt "$UNTIL")

# Group shard-heavy directories into one line each so the listing stays readable.
group() { python3 "$(dirname "$0")/_group.py"; }

echo "== 1. LEDGER  $LEDGER =="
if [ -f "$LEDGER" ]; then
  grep -i -- "$KW" "$LEDGER" 2>/dev/null | grep '^| 20' || echo "(no ledger row matches '$KW')"
else
  echo "(no ledger at $LEDGER — create it: see 'Ledger format' in SKILL.md)"
fi

echo; echo "== 2. FILES  name matches '*${KW}*'${SINCE:+ since $SINCE}${UNTIL:+ until $UNTIL}  (newest first) =="
find "${ROOTS[@]}" "${PRUNE[@]}" -type f -iname "*${KW}*" ${T[@]+"${T[@]}"} -print 2>/dev/null | group

if [ -n "$SINCE" ] || [ -n "$UNTIL" ]; then
  echo; echo "== 2b. ANY result file in that window (json/jsonl/csv/tsv/log/md/txt) =="
  find "${ROOTS[@]}" "${PRUNE[@]}" -type f \( -name '*.json' -o -name '*.jsonl' -o -name '*.csv' \
    -o -name '*.tsv' -o -name '*.log' -o -name '*.md' -o -name '*.txt' \) \
    ${T[@]+"${T[@]}"} -print 2>/dev/null | group
fi

echo; echo "== 3. NOTES mentioning '$KW'  (docs/notes across all roots, max 20) =="
find "${ROOTS[@]}" "${PRUNE[@]}" -type f \( -name '*.md' -o -name '*.txt' -o -name '*.rst' \
  -o -name '*.jsonl' \) -print0 2>/dev/null \
  | xargs -0 -r grep -Ils -- "$KW" 2>/dev/null | xargs -r ls -t 2>/dev/null | head -20

echo; echo "Roots searched: ${ROOTS[*]}"
echo "Next: ONE query to your notes / memory tool for \"$KW result\", then write the 3-line verdict block."
