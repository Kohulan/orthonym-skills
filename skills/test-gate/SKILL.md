---
name: test-gate
description: "Checks that a test fails on some plausible wrong code, such as a guard that always allows or always refuses, an empty result, an identity transform or a missing lock, and gates each new test on four answers: behaviour, regression, owner and seam. Use when writing, changing or reviewing tests: a regression test for a fix, a PR or diff that adds tests, a coverage push, or a green suite that may not catch a bug. Triggers on 'add a test for', 'review these tests', 'is this test enough', fail-closed guards and health checks, locks and concurrency tests, checks that loop over outputs, and mocks or fixtures that already hold the answer. Not for changing an existing expected value (use change-asserted-value) or deriving a property the output must satisfy (use prove-invariant)."
---

# test-gate

## The rule

A test earns its place only if some wrong code makes it fail. For every test you write or
review, name the cheapest wrong code that a real bug could produce, and check that the test
fails on it. If a plausible wrong version still passes, the test is not done.

## Gate for a new test

Answer all four before adding it. A blank answer means do not add it yet.

1. **Behaviour:** the observable behaviour or contract it protects.
2. **Regression:** the credible bug that makes it fail. For a bug fix, run the test on the
   pre-fix code and watch it fail for that reason.
3. **Owner:** why existing tests miss that bug. One contract has one primary test at the
   strongest boundary; extend a parametrised case before adding a near-duplicate.
4. **Seam:** if it needs an export, flag or hook that no production caller uses, test through
   the real entry point instead and drop the seam.

## Wrong code to try

Try each row that applies, in both directions.

| Code under test | Wrong versions the test must fail on |
|:---|:---|
| Guard, validator, permission or health check | always refuses, **and** always allows |
| Returns a collection | returns empty, returns everything |
| Cache, dedupe, run-once | ignores the cache, runs every time |
| Lock or other concurrency control | no lock, with callers that really overlap (a `Barrier` and a slow body) |
| Transform or formatter | identity, a constant |
| Error path | nothing raised |
| TTL or timeout | a margin smaller than the clock's resolution |

**A guard is two contracts.** "Refuses when unhealthy" also passes on a guard that refuses
everything, which is a total outage. A fail-closed check needs a test that the healthy path
still gets through. That test is required, not optional.

**A check that loops over outputs passes on no output.** "Every span is valid" holds for an
empty list. Add inputs that must produce output, with exact expected values.

## Signs a test cannot fail

- No assertion, or `try/except: pass` where `pytest.raises` belongs.
- The expected value comes from the code under test, or is imported from it.
- A mock or fixture already supplies the asserted answer: a backend mock that returns the
  cached value, or an autouse fixture that pre-seeds state.
- A "concurrent" test whose callers never overlap.
- A name that promises more than its input exercises.
- A helper that exists only for the test.

## Review procedure

1. Copy the tree to a fresh directory of your own (`mktemp -d`); a shared scratch directory
   can hold another run's files. Check that the copy's tests import the copy, not an editable
   install of the real tree (print `<pkg>.__file__`). Leave the real tree as you found it.
2. For each test and fixture, pick the wrong versions from the table, in both directions.
3. Run each wrong version in the copy. A test that still passes on one is not done: fix it and
   return to this step. "Would fail" counts only after you have seen it fail.
4. Report one line per test and fixture: keep, change or drop; the wrong versions you ran and
   whether the test failed on each; the fix, for anything that is not a keep.

Related: `prove-invariant` for deriving a property the output must satisfy.
