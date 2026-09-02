# hooks

Two `PreToolUse` hooks for standing instructions the model forgets by mid-session. Both **fail
open**: odd input or a crash exits 0 silently, so a guard bug can never block real work.

## `ask-gate.py` — matcher `AskUserQuestion`

If you told the agent to implement fully without waiting, that approval *is* the gate. A question
passes only if it matches one of 4 hard stops: **irreversible/destructive**,
**security/secrets/publishing**, an **expensive run** (30k+ rows, 1h+, full corpus, overnight),
or a **plan so broken every path is a guess**. Everything else is denied, told to pick the
broadest reasonable option, state it in one line, and continue.

Denials append to `<root>/.claude/ask-gate.log` — read it before widening the regexes; the
docstring names the pattern to edit. `<root>` is `CLAUDE_PROJECT_DIR`, else the git toplevel,
else the cwd.

## `block-git-add-all.sh` — matcher `Bash`

Denies `git add -A` / `--all` / `.` and `git commit -a` / `-am` anywhere in the line (after
`&&`, through `git -C dir`). Explicit paths pass. The line is tokenized with `shlex`, so a commit
*message* mentioning `git add -A` is not a false positive. The `.sh` wrapper greps first and runs
the `.py` only on a hit.

## Install

```bash
mkdir -p /path/to/your/project/.claude/hooks
cp hooks/ask-gate.py hooks/block-git-add-all.py hooks/block-git-add-all.sh \
   /path/to/your/project/.claude/hooks/
chmod +x /path/to/your/project/.claude/hooks/*
```

Then merge into `.claude/settings.json`:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "AskUserQuestion",
        "hooks": [
          {
            "type": "command",
            "command": "python3 \"$CLAUDE_PROJECT_DIR/.claude/hooks/ask-gate.py\""
          }
        ]
      },
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "bash \"$CLAUDE_PROJECT_DIR/.claude/hooks/block-git-add-all.sh\""
          }
        ]
      }
    ]
  }
}
```

## Test

A deny prints one JSON line with `"permissionDecision": "deny"`; an allow prints nothing.

```bash
# deny — not a hard stop
echo '{"tool_name":"AskUserQuestion","tool_input":{"questions":[{"question":"Which approach, A or B?"}]}}' | python3 hooks/ask-gate.py
# allow — hard stop 1 (irreversible)
echo '{"tool_name":"AskUserQuestion","tool_input":{"questions":[{"question":"This will force-push main, proceed?"}]}}' | python3 hooks/ask-gate.py
# deny
echo '{"tool_name":"Bash","tool_input":{"command":"git add -A"}}' | bash hooks/block-git-add-all.sh
# allow
echo '{"tool_name":"Bash","tool_input":{"command":"git add src/foo.py"}}' | bash hooks/block-git-add-all.sh
```

## Disable

- One question: start the question text with `HARD STOP:`.
- One session: `export ASK_GATE_OFF=1`.
- One checkout: `touch .claude/ask-gate.off`.
- For good: remove the hook's entry from `settings.json`.
