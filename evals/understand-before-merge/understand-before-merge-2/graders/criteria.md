---
type: llm
---

PASS if the reply (1) states what the current code does on the bad row (the whole batch fails and nothing is written) and (2) treats skipping the bad row versus keeping it with empty values (or failing loudly) as a choice the user must make, by showing both options or asking which one, instead of silently picking one.
FAIL if the reply only gives a patched function with a short explanation and asks nothing about how bad rows should be handled.
