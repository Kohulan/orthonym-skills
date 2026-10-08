# hooks

Five `PreToolUse` hooks for rules that must hold every time, not most of the time. All **fail
open**: odd input or a crash never blocks the tool call (a crash in `ask-gate.py` exits 1, which
Claude Code shows as a non-blocking hook error), so a guard bug can never block real work.

| Hook | Matcher | On by default with the plugin | Guards the rule in |
|---|---|---|---|
| `block-git-add-all.sh` | `Bash` | yes | every skill that commits |
| `ask-gate.py` | `AskUserQuestion` | no | your "don't wait on me" directive |
| `guard-holdout.py` | `Bash` | no | `eval-loop`, `run-eval`, `bounded-goals` |
| `guard-regen.py` | `Bash` | no | `change-asserted-value` |
| `gate-guard.py` | `Bash` | no | `run-gate` |

The three guards stop the command with a reason Claude reads. They use `deny`, not `ask`, so they
also hold when permission prompts are skipped.

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

## `guard-holdout.py` — matcher `Bash`

Stops a command that matches `EVAL_HOLDOUT_PATTERN` (a Python regex) and tells Claude to ask you
first: one run on the held-out split spends it. Set the pattern to what *runs* the split, such as
its override flag (`--split[= ]heldout`), not the bare split name, or every `ls` over the split
stops too. After you agree, Claude re-runs the command with `# holdout-approved` appended. No
pattern set: the hook does nothing.

## `guard-regen.py` — matcher `Bash`

Stops a bulk snapshot or golden-file regeneration (`pytest --snapshot-update`, `--force-regen`,
`--regen-all`, `jest -u`, `vitest -u`, `cargo insta accept`, `UPDATE_GOLDEN=1` and similar; the
docstring has the full list). Claude must first list each value that would change, with its
evidence, then re-run with `# values-reviewed` appended. Needs no setup.

## `gate-guard.py` — matcher `Bash`

Acts only on commands that match `GATE_CMD_RE` (your full-gate command). Stops the gate when it
is wrapped in `timeout` (a slow, healthy run is killed and leaves no verdict), and, if
`GATE_VERDICT_FILE` is set, while `<verdict file>.lock` holds the PID of a live process (two
gates on one verdict file overwrite each other). `GATE_CMD_RE` not set: the hook does nothing.

**Where the variables go.** A hook gets the environment Claude Code started with. Put
`EVAL_HOLDOUT_PATTERN`, `GATE_CMD_RE` and `GATE_VERDICT_FILE` in the `"env"` block of
`settings.json` or export them in the shell that launches `claude`. An `export` that Claude runs
through the Bash tool never reaches a hook.

## Install

With the plugin installed, `block-git-add-all` is already on. Copy only the opt-in hooks you want
and paste only their entries below; a project copy of the git guard would run on every Bash call
next to the plugin's. Without the plugin, copy the git guard too:

```bash
mkdir -p /path/to/your/project/.claude/hooks
cp hooks/ask-gate.py hooks/guard-holdout.py hooks/guard-regen.py hooks/gate-guard.py \
   /path/to/your/project/.claude/hooks/
# without the plugin, also: hooks/block-git-add-all.py hooks/block-git-add-all.sh
chmod +x /path/to/your/project/.claude/hooks/*
```

Then merge into `.claude/settings.json` (keep the entries and `env` values you need):

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
          { "type": "command", "command": "python3 \"$CLAUDE_PROJECT_DIR/.claude/hooks/guard-holdout.py\"" },
          { "type": "command", "command": "python3 \"$CLAUDE_PROJECT_DIR/.claude/hooks/guard-regen.py\"" },
          { "type": "command", "command": "python3 \"$CLAUDE_PROJECT_DIR/.claude/hooks/gate-guard.py\"" },
          { "type": "command", "command": "bash \"$CLAUDE_PROJECT_DIR/.claude/hooks/block-git-add-all.sh\"" }
        ]
      }
    ]
  },
  "env": {
    "EVAL_HOLDOUT_PATTERN": "--split[= ]heldout",
    "GATE_CMD_RE": "run_gate\\.sh",
    "GATE_VERDICT_FILE": "results/verdict.json"
  }
}
```

The last Bash entry is only for installs without the plugin.

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
# deny, then allow
echo '{"tool_name":"Bash","tool_input":{"command":"python eval.py --split heldout"}}' | EVAL_HOLDOUT_PATTERN='--split[= ]heldout' python3 hooks/guard-holdout.py
echo '{"tool_name":"Bash","tool_input":{"command":"python eval.py --split dev"}}' | EVAL_HOLDOUT_PATTERN='--split[= ]heldout' python3 hooks/guard-holdout.py
# deny, then allow
echo '{"tool_name":"Bash","tool_input":{"command":"pytest tests --snapshot-update"}}' | python3 hooks/guard-regen.py
echo '{"tool_name":"Bash","tool_input":{"command":"pytest tests -q"}}' | python3 hooks/guard-regen.py
# deny, then allow
echo '{"tool_name":"Bash","tool_input":{"command":"timeout 3600 ./run_gate.sh"}}' | GATE_CMD_RE='run_gate\.sh' python3 hooks/gate-guard.py
echo '{"tool_name":"Bash","tool_input":{"command":"nohup ./run_gate.sh > gate.log 2>&1 &"}}' | GATE_CMD_RE='run_gate\.sh' python3 hooks/gate-guard.py
```

## Disable

- One question: start the question text with `HARD STOP:`.
- One session: `export ASK_GATE_OFF=1`.
- One checkout: `touch .claude/ask-gate.off`.
- One held-out run or regeneration, after you agreed: Claude appends `# holdout-approved` or
  `# values-reviewed` to the command.
- For good: remove the hook's entry from `settings.json`.
