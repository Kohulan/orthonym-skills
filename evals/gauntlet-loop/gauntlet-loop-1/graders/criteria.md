---
type: llm
---

PASS if the reply is one paste-ready prompt (not the README itself) that names FastAPI's README as the bar, tells the agent to fetch the real README and have a separate critic compare ours against it blind, loops until the critic picks ours, and is followed by a one-line offer to run it.
FAIL if the reply writes the README itself, offers other bars instead of using FastAPI's README, or sets a fixed number of rounds or a budget the user did not give.
