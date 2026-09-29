---
name: watching-background-jobs
description: Keeps a long-running background job watched from the main agent — a baseline and checkpoint, scheduled wake-ups that tell a stall from a quiet compute phase, a one-line progress report per wake-up, and a verdict-first alert on completion. Use when a long-running job (benchmark, regression gate, eval, test suite, build, batch run) is or will be running in the background and someone must notice completion, stalls, or crashes — triggers include "keep an eye on it", "ping me when it's done", "keep a cheap agent running to check", "is it still running?", "all done?", "why is this taking so long?", or launching anything expected to run over ~5 minutes. Not for the regression gate recipe itself (use run-gate).
---

# Watching background jobs

## Overview

**Only the main agent can report progress while the job runs.** The harness sends a free
task-notification when a background task *exits*, and a wake-up tool (`Monitor`, or
`ScheduleWakeup` inside a self-paced `/loop`; probe with ToolSearch) re-invokes *you*. A watcher
subagent has no `ScheduleWakeup` and cannot sleep (foreground `sleep` is blocked); a `Monitor` or
background command it starts can wake it, but its report reaches you only when its run ends. So it
either returns before the job ends or goes quiet until it does. Own the watch loop yourself.

**Skip this** only for short foreground commands, or a job whose internal timeout reliably makes
it exit.

## Wire this in

Substitute: `<job>` — the launch command · `<log-file>` — its **line-buffered** log (unbuffered,
or progress is unmeasurable) · `<verdict-file>` — the sentinel written *only* on completion ·
`<scratchpad>/watch.json` — the checkpoint · your stall threshold and any known quiet phases.

## The pattern

**1. Baseline (immediately, one Bash call):**
- Confirm the process is alive: by PID when you have one (`ps -p <pid>`), else with one letter
  bracketed (`pgrep -fa '[m]yjob'`, with the plain name nowhere else in that command line),
  because a plain `pgrep -fa <job>` also matches the shell running the check. If already dead,
  go straight to the crash path — never arm a watchdog on a corpse.
- Record progress markers: log size / line count + mtime.
- If the job writes a sentinel/verdict file, check for a **stale one from a prior run** and
  record its mtime — "done" later means *mtime newer than launch*, not *file exists*.

**2. Arm the watchdog:**
- Persist a checkpoint (`{lines, log_mtime, launch_ts}`) to disk — each wake-up is a fresh turn.
- Schedule the next check: 240–270s while watching something fast-changing (stays inside the
  5-min prompt cache), or 1200s+ as a slow heartbeat for multi-hour jobs. Avoid 300s (worst
  of both) and 60s polling (burns cache for nothing).
- Completion needs no polling — the exit notification is free and re-invokes you.
- If `Monitor` is your wake-up tool, make its filter emit on failure lines (`Traceback|Error|Killed`)
  as well as on progress, because a progress-only filter stays silent through a crash or hang;
  re-arm it each time it expires.

**3. Each wake-up:**
- Re-stat log/output against the checkpoint.
- Progress since last check → update the checkpoint, re-arm, and end the wake-up with **the
  progress line** below. That one line is the wake-up's whole output.
- Flat for ≥ the stall threshold → **check CPU before crying stall** (`ps -o %cpu` on the
  worker): a busy process with a quiet log is a compute phase, not a hang. Wedged = 0% CPU +
  frozen log + no verdict.
- Truly wedged → notify the user with evidence (minutes flat, last log line, CPU state) and
  **leave the process running** — never kill or restart without their say-so.

**4. On completion (the task-notification fires):**
- Read the verdict file, verify its mtime postdates the launch, grab the log tail.
- Notify verdict-first — numbers in the alert, full reconciliation in the chat:
  `"Gate PASS — 843 golds (+3 vs 840), 0 new regressions, 1h12m"` *(example from a SMILES→IUPAC
  namer)*. Use `PushNotification` only if it is in this harness's tool list (probe with
  ToolSearch — it is not universal); with no push tool, the verdict is your next chat message.
  Never claim a push you did not send.
- Disarm: don't re-schedule; delete the checkpoint file.

## The progress line (post it; do not wait to be asked)

Silence is why users poll — "how much done?" gets retyped for the whole life of the job. Every
wake-up that shows progress ends with exactly one line, in this shape:

`<job> · <done>/<total> (<pct>%) · <rate>/min · ETA <HH:MM UTC> · last: "<final log line, trimmed>"`

- One line. No preamble, no plan, no "still running fine".
- Rate and ETA come from the delta since the checkpoint, not from the job start.
- No done/total in the log → `<job> · <lines> log lines (+<delta>) · <elapsed> elapsed · <cpu>% CPU · last: "..."`.
- At each 25 / 50 / 75 % crossing and at completion, send the same line with `PushNotification`
  when that tool exists here (probe once).
- "how much done?" from the user gets this same line, from a fresh probe.

## Answering "is it still running?"

Never from memory or vibes. One Bash call: process state + output delta since the checkpoint +
elapsed, then an evidence-based answer ("yes — 4,100 → 5,300 rows in 22 min, ~40% done, ETA ~2h").

## Stall thresholds

Default 20 min of flat output. Widen to 40+ min for known quiet phases — a determinism pass, or
a stage that only writes on completion, goes silent legitimately. If a healthy-but-slow job
outlives the watchdog timeout, silently re-arm; never ping the user for "still running fine".

## Hard rules

- The watch is read-only. While it runs, start no second heavy job, test suite, or
  git-mutating agent: they compete with the job for cores and memory, and a git mutation can
  change files the job is reading.
- If the user asks for "a cheap agent that keeps checking": honor the **intent** (cheap,
  continuous monitoring), not the letter. Own the schedule loop; optionally delegate each
  *single* health-check to a one-shot cheap subagent that returns one verdict line from the log
  tail — and say in one sentence that you are doing this, and why.
- Report failures faithfully: a crash notification carries the exit code and log tail, and
  preserves the log (copy it to the scratchpad) before it can be clobbered.

## Rationalization table

| Excuse | Reality |
|---|---|
| "Progress is not worth a message; I'll report at the end" | Silence is why the user polls. It is one line. Post it. |
| "The user asked for a persistent watcher subagent" | Nothing wakes it on a schedule, and its report arrives only when its run ends — the loop must live with you. Substitute and say so. |
| "The exit notification will cover it" | It covers *exit* only. A hung process never exits; stalls are invisible without the poll loop. |
| "I'll poll every 60s to be safe" | 8 cache-burning wakes per quiet stretch. 240–270s in-cache, or commit to 1200s+. |
| "Log is quiet — it's hung, restart it" | Check CPU first. Quiet ≠ dead, and restarting destroys evidence. Never restart unilaterally. |
| "The user will ask if they want status" | Dozens of wasted "is it done?" turns. Push the verdict the moment it exists. |
| "I'll spawn the watcher and end my turn — done" | You just orphaned the job. If you did not arm a wake-up, nobody is watching. |
