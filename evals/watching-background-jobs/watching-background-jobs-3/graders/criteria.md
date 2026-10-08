---
type: llm
---

PASS if the reply explains briefly that a background subagent cannot keep waking itself to watch, and instead keeps the watch loop in the main agent (optionally handing each single check to a one-shot cheap subagent).
FAIL if the reply spawns, or claims to have spawned, a persistent watcher subagent and ends there.
