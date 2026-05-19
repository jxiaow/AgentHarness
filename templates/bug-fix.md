# Bug Fix Template

## Goal

Locate the root cause and fix the problem with the smallest possible change surface.

## Not This Template

Do not use bug-fix if:
- The "bug" is actually a requirement change (user wants different behavior, not a fix) → use `new-feature` or `refactor`
- The failure is only in tests but production behavior is correct → still use bug-fix, but apply test-failure-triage first
- The issue spans multiple modules with no single root cause → use `cross-module-change`

## Scope Gate Fields For Bugs

When using this template, fold these fields into Scope gate:

- Symptom
- Expected behavior
- Root cause or suspected chain
- Fix surface (where the change goes)
- Verification method

## Test Failure Triage

If the trigger is a test failure, or test failures are discovered during verification, first execute `harness/core/rules/test-failure-triage.md` before deciding whether to fix the test, the implementation, or the fixture.

Scope gate should additionally include:

- Failure type: implementation regression / stale test contract / requirement change not synced to tests / environment or fixture issue
- Evidence: discrepancy between current requirements, implementation, and test assertions
- Fix direction: why this surface is being changed rather than reverting another

Never revert UI, behavior, or architecture that the user explicitly chose to keep just to make tests green.

## Only Add When Relevant

- Stable reproduction: add reproduction steps and trigger conditions
- Environment differences: add Web / desktop runtime / OS
- Logs, stack traces, screenshots: only reference key evidence
- Not yet reproduced: clarify which conclusions are only code path analysis
- Test failure: add Test failure triage conclusion

## Recommended Output

```text
Scope gate
- Task type: bug fix
- Symptom: ...
- Root cause/chain: ...
- Test triage: ... (only when test failure triggered the bug)
- Fix surface: ...
- Risk: ...
- Verification: ...
```
