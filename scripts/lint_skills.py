#!/usr/bin/env python3
"""Lint every skills/*/SKILL.md, agents/*.md, hooks/ and evals/ in this repo.

Checks the skill-authoring rules a script can check (Anthropic's best-practices page:
https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices):
- frontmatter present; `name` matches the directory, <= 64 chars, [a-z0-9-], no
  "anthropic"/"claude";
- `description` present, <= 1024 chars, no XML tags, third person (does not open with
  "Use", "I " or "You "), and states a trigger ("Use when" / "Use before" / ...);
- every file in a skill folder is named in its SKILL.md (one level deep), and every
  bundled .md file over 100 lines opens with a Contents list;
- no instruction asks Claude to write out its reasoning;
- every skill has >= 3 eval cases under evals/<skill>/, each with a grader;
- no private / project-specific tokens leak into public text.
Files are listed with git (tracked plus untracked, minus .gitignore), so generated
folders such as node_modules or __pycache__ are skipped. Exit 1 on any failure.
"""
import re, subprocess, sys, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
PRIVATE = re.compile(r"(OpenSTOUT|kohulan|/home/[a-z]|OPSIN|opsin|\b1652\b|\b1663\b|v22_gate|gate_verdict\.json|claude-mem|NEXT-SESSION\.md|\.planning/|ChEBI|chebi|ZINC|zinc500k|pubchem)", re.I)
ALLOW_PRIVATE_IN = {"reference-docs"}  # worked examples may name the domain
TRIGGER = re.compile(r"\bUse (when|before|after|for|whenever|at|this)\b")
NOT_THIRD_PERSON = re.compile(r"^(Use\b|I |You )|\b(I can|you can|You can)\b")
REASONING_ECHO = re.compile(r"(think step by step|show (your )?(reasoning|thinking)|write out (your )?reasoning|explain your (internal )?reasoning)", re.I)
TOC_MIN_LINES = 100  # best-practices: reference files over 100 lines open with a contents list
MIN_EVAL_CASES = 3   # best-practices: "Build three scenarios"

def frontmatter(text):
    m = re.match(r"^---\n(.*?)\n---\n", text, re.S)
    if not m: return None
    fm = {}
    for line in m.group(1).splitlines():
        if ":" in line and not line.startswith((" ", "\t", "-")):
            k, v = line.split(":", 1); fm[k.strip()] = v.strip().strip('"').strip("'")
    return fm

def repo_files(sub):
    out = subprocess.run(["git", "ls-files", "--cached", "--others", "--exclude-standard", "--", sub],
                         cwd=ROOT, capture_output=True, text=True, check=True).stdout
    return [ROOT / p for p in out.splitlines() if (ROOT / p).is_file()]

def scan_private(path, text, start=1):
    return [f"{path}:{i}: private/project token: {line.strip()[:90]}"
            for i, line in enumerate(text.splitlines(), start) if PRIVATE.search(line)]

def check(path, kind):
    errs = []
    text = path.read_text(encoding="utf-8")
    fm = frontmatter(text)
    if fm is None: return [f"{path}: no YAML frontmatter"]
    name = fm.get("name", "")
    expected = path.parent.name if kind == "skill" else path.stem
    if name != expected: errs.append(f"{path}: name '{name}' != '{expected}'")
    if not re.fullmatch(r"[a-z0-9-]{1,64}", name): errs.append(f"{path}: name must be 1-64 chars of [a-z0-9-]")
    if re.search(r"anthropic|claude", name): errs.append(f"{path}: name uses a reserved word")
    desc = fm.get("description", "")
    if not desc: errs.append(f"{path}: missing description")
    if len(desc) > 1024: errs.append(f"{path}: description {len(desc)} chars > 1024")
    if re.search(r"<[A-Za-z/][^>]*>", desc): errs.append(f"{path}: description contains an XML tag")
    if kind == "skill":
        if not TRIGGER.search(desc):
            errs.append(f"{path}: description should state the trigger ('Use when ...')")
        if NOT_THIRD_PERSON.search(desc):
            errs.append(f"{path}: description should be third person and say what the skill does first ('Checks ...', not 'Use when'/'I can'/'You can')")
    head = re.match(r"^---\n.*?\n---\n", text, re.S).group(0)
    body = text[len(head):]
    errs += scan_private(path, body)
    for i, line in enumerate(body.splitlines(), 1):
        if REASONING_ECHO.search(line):
            errs.append(f"{path}:{i}: asks Claude to write out its reasoning; ask for the answer and a short explanation")
    if kind == "skill":
        for f in repo_files(str(path.parent.relative_to(ROOT))):
            if f == path: continue
            if f.name not in body:
                errs.append(f"{path}: bundled file {f.relative_to(path.parent)} is not named in SKILL.md")
            if f.suffix == ".md":
                lines = f.read_text(encoding="utf-8").splitlines()
                if len(lines) > TOC_MIN_LINES and not any(re.search(r"contents", l, re.I) for l in lines[:15]):
                    errs.append(f"{f}: {len(lines)} lines with no Contents list in its first 15 lines")
    return errs

def check_evals(skills):
    errs = []
    files = repo_files("evals")
    for f in files:
        if "/results/" in str(f): continue
        errs += scan_private(f, f.read_text(encoding="utf-8", errors="replace"))
    try:
        import yaml  # PyYAML; one unparsable case stops `claude plugin eval` loading the whole suite
    except ImportError:
        yaml = None
    for f in files:
        if yaml is None or "/results/" in str(f) or f.suffix not in (".md", ".yaml", ".yml"): continue
        text = f.read_text(encoding="utf-8", errors="replace")
        if f.suffix == ".md":
            m = re.match(r"^---\n(.*?)\n---\n", text, re.S)
            if not m:
                errs.append(f"{f}: no YAML frontmatter"); continue
            text = m.group(1)
        try:
            if not isinstance(yaml.safe_load(text), dict): raise ValueError("not a mapping")
        except Exception as e:
            errs.append(f"{f}: invalid YAML: {str(e).splitlines()[0]}")
    cases = {}
    for f in files:
        if f.name in ("prompt.md", "case.yaml") and "/results/" not in str(f):
            cases.setdefault(f.parent, set()).add(f.name)
    for case in cases:
        graders = list((case / "graders").glob("*.md"))
        yaml = (case / "case.yaml")
        if not graders and not (yaml.is_file() and "graders:" in yaml.read_text(encoding="utf-8")):
            errs.append(f"{case}: eval case has no grader")
    for sk in skills:
        d = ROOT / "evals" / sk
        n = sum(1 for c in cases if d in c.parents and "near-miss" not in c.name)
        if n < MIN_EVAL_CASES:
            errs.append(f"evals/{sk}: {n} eval case(s); need >= {MIN_EVAL_CASES} that should trigger the skill")
    return errs

def main():
    errs = []
    skill_md = sorted(ROOT.glob("skills/*/SKILL.md"))
    for p in skill_md: errs += check(p, "skill")
    for p in sorted(ROOT.glob("agents/*.md")): errs += check(p, "agent")
    for p in sorted(ROOT.glob("hooks/*")):
        if p.suffix in (".py", ".sh", ".md", ".json"):
            errs += scan_private(p, p.read_text(encoding="utf-8", errors="replace"))
    errs += check_evals([p.parent.name for p in skill_md])
    n_ag = len(list(ROOT.glob("agents/*.md")))
    print(f"checked {len(skill_md)} skills, {n_ag} agents, hooks/, evals/")
    for e in errs: print("FAIL", e)
    print("OK" if not errs else f"{len(errs)} problem(s)")
    return 1 if errs else 0

if __name__ == "__main__":
    sys.exit(main())
