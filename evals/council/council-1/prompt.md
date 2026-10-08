---
description: A loaded "~100 rows" claim is re-derived from the run record before the call is made.
tags: [council]
max_turns: 20
allowed_tools: [Skill, Read, Glob, Grep]
---

Should we fix the low-confidence cluster or ship the featurizer refactor first? The handoff note says the cluster is "~100 rows, one root cause". Here is the run record for it:

| rows tagged low_conf | 104 |
|---|---|
| of those, out_of_domain = true | 97 |
| in-domain, same traceback in normalize() | 2 |
| in-domain, other causes | 5 |

The featurizer refactor's ledger row says: 45 rows fixed on the dev split, 0 regressions on the protected set. Your call. (There is no repository in this session; answer from what is here.)
