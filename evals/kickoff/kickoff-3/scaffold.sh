#!/usr/bin/env bash
# Workspace: no handoff note; a notes index points at the current start-here note.
set -euo pipefail
g() { git -c user.name=eval -c user.email=eval@example.com -c commit.gpgsign=false "$@"; }
git init -q
mkdir -p src notes
cat > notes/INDEX.md <<'MD'
# Notes index
- Current milestone: M3. Start here: notes/m3-start-here.md
- Older: notes/m2-summary.md
MD
cat > notes/m3-start-here.md <<'MD'
# M3: probability calibration
- Method: temperature scaling on the model's logits (src/calibrate.py).
- Done: calibration split frozen (2,000 rows); reliability diagram script.
- Next step: fit the temperature on the calibration split, then report ECE before and after.
- Baseline: ECE 0.081 uncalibrated.
MD
printf '# M2 summary\nRing featurizer shipped; protected set 1204/1250.\n' > notes/m2-summary.md
printf 'def fit_temperature(logits, labels):\n    raise NotImplementedError\n' > src/calibrate.py
g add notes src; g commit -qm "feat(calibrate): freeze calibration split"
