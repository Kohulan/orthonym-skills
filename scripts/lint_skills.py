#!/usr/bin/env python3
"""Lint every skills/*/SKILL.md and agents/*.md in this repo.

Checks: frontmatter present; `name` matches the directory; `description` present,
<= 1024 chars, and states a trigger ("Use when" / "Use before" / "Use ..."); no
private / project-specific tokens leak into public text. Exit 1 on any failure.
"""
import re, sys, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
PRIVATE = re.compile(r"(OpenSTOUT|kohulan|/home/[a-z]|OPSIN|opsin|\b1652\b|\b1663\b|v22_gate|gate_verdict\.json|claude-mem|NEXT-SESSION\.md|\.planning/|ChEBI|chebi|ZINC|zinc500k|pubchem)", re.I)
ALLOW_PRIVATE_IN = {"reference-docs"}  # worked examples may name the domain

def frontmatter(text):
    m = re.match(r"^---\n(.*?)\n---\n", text, re.S)
    if not m: return None
    fm = {}
    for line in m.group(1).splitlines():
        if ":" in line:
            k, v = line.split(":", 1); fm[k.strip()] = v.strip().strip('"').strip("'")
    return fm

def check(path, kind):
    errs = []
    text = path.read_text(encoding="utf-8")
    fm = frontmatter(text)
    if fm is None: return [f"{path}: no YAML frontmatter"]
    name = fm.get("name", "")
    expected = path.parent.name if kind == "skill" else path.stem
    if name != expected: errs.append(f"{path}: name '{name}' != '{expected}'")
    if not re.fullmatch(r"[a-z0-9-]+", name): errs.append(f"{path}: name has chars outside [a-z0-9-]")
    desc = fm.get("description", "")
    if not desc: errs.append(f"{path}: missing description")
    if len(desc) > 1024: errs.append(f"{path}: description {len(desc)} chars > 1024")
    if kind == "skill" and not re.search(r"\bUse (when|before|after|for|whenever|at|this)\b|^Use\b", desc):
        errs.append(f"{path}: description should state the trigger ('Use when ...')")
    body = text[len(re.match(r"^---\n.*?\n---\n", text, re.S).group(0)):]
    for i, line in enumerate(body.splitlines(), 1):
        if PRIVATE.search(line):
            errs.append(f"{path}:{i}: private/project token: {line.strip()[:90]}")
    return errs

def main():
    errs = []
    for p in sorted(ROOT.glob("skills/*/SKILL.md")): errs += check(p, "skill")
    for p in sorted(ROOT.glob("agents/*.md")): errs += check(p, "agent")
    for p in sorted(ROOT.glob("hooks/*")):
        if p.suffix in (".py", ".sh", ".md", ".json"):
            for i, line in enumerate(p.read_text(encoding="utf-8", errors="replace").splitlines(), 1):
                if PRIVATE.search(line): errs.append(f"{p}:{i}: private/project token: {line.strip()[:90]}")
    n_sk = len(list(ROOT.glob("skills/*/SKILL.md"))); n_ag = len(list(ROOT.glob("agents/*.md")))
    print(f"checked {n_sk} skills, {n_ag} agents, hooks/")
    for e in errs: print("FAIL", e)
    print("OK" if not errs else f"{len(errs)} problem(s)")
    return 1 if errs else 0

if __name__ == "__main__":
    sys.exit(main())
