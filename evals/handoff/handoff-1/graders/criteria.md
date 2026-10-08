---
type: llm
---

PASS if the reply's plan checks for uncommitted work, updates the durable notes with this session's lessons without trimming existing entries, then writes a short handoff note (last commit, next task, what to read first) and commits it by explicit path.
FAIL if the reply only summarises the session in chat, or writes a long prompt for the next session instead of a handoff note.
