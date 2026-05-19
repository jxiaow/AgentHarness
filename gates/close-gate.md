# Close Gate

## Goal

After implementation, record what was actually run for verification, what was not covered, and the residual risk. This is both the verification record and the delivery closeout.

## When To Use

Output Close gate when:

- The current Scope is complete (or, for long-running tasks, the current phase has no actionable remaining items)
- A real blocker appears (needs user authorization, would damage existing work, requirement changed enough to miss the goal, key input missing)

Do not output Close gate for an intermediate work package if the larger task still has actionable items. Continue execution instead, or output a brief working update.

## Final Closeout Conditions

Before closing, decide which target type is being handled:

- `single-task`: a bounded task; close after the requested result and necessary verification are complete
- `staged/ongoing`: long-running multi-stage work; close only when the current phase has no actionable remaining items
- `continuation`: user said "continue / start / go ahead / proceed as planned"; inherit the active phase and continue, do not treat one work package as final completion
- `explicit-closeout`: user explicitly said "summarize / close / stop here"; close based on current verified state

If an active operations board or checklist exists under `docs/operations/<initiative>/`, the agent must read it before closing and confirm the highest-priority actionable item has been advanced.

## Judgment Criteria

**Result**: Must state the observable outcome, not just "done". "Missing-host crash fixed; empty-state renders correctly" is a result. "Completed the task" is not.

**Verified**: Must name the actual command or method AND its result. "Checked it" is not verification. "`npm run test:unit -- deploy`: pass" is.

**Unverified**: Apply this decision tree:
- Is there a runtime path that was not exercised by any test or manual check? → Name it.
- Is there an environment (production, mobile, different OS) not covered? → Name it.
- Was everything in Scope's verification plan actually executed? → If yes, write "none beyond covered scope".
- Never write "none" if the verification plan in Scope was not fully executed.

**Risk**: Apply this decision tree:
- Are there unverified paths that could fail in production? → Name the specific scenario.
- Is the change fully covered by the verification that was run? → Write "none beyond stated unverified items" (do not repeat the unverified list).
- Never write generic "low risk" without naming what could go wrong.

## Minimal Fields

```text
Close gate
- Result: ...
- Verified: <command or method>: <result>
- Unverified: ...
- Risk: ...
```

When there are no unverified items and no real risk, state so in one sentence; do not expand into boilerplate.

## Executable Risk Is Not Closeout Risk

Classify all unverified items and risks before closing:

- `actionable`: can still be fixed, verified, tested, or narrowed within current repo, permissions, and information
- `blocked`: continuing requires user authorization, external environment, missing critical input, or would damage existing changes
- `accepted residual`: goal is complete, but real runtime risks remain that cannot be proven or eliminated within this task

As long as `actionable` items exist, do not output a final Close gate. Continue execution or explain the real blocker.

The following are NOT residual risk; they are actionable items that must continue:

- Test failures not yet triaged or fixed
- Test contracts not synced with current requirements or UI
- Verification commands that can clearly still be run
- Known code issues with clear fix surface needing no new authorization
- Known runtime risks that can be narrowed through code, tests, timeouts, retries, or diagnostic logging

Before closing with test failures, triage must follow `../rules/test-failure-triage.md`; do not package "tests still need fixing" as risk and stop.

## Hard Rules

- No "next steps" suggestions in Close gate. If actionable items exist, continue. If blocked, write the blocker explicitly.
- No boilerplate "no risk" / "everything fine" filler. Be specific or be brief.
- Code review or static reading cannot be stated as runtime verification.
- Do not omit unverified items or residual risk for brevity.
- Working update vs Close gate: working updates record progress mid-task; Close gate is the final record. Do not format intermediate progress as Close gate.

## Change Log Retention

By default, maintain todo / checklist only. Write `docs/development/changes/` only when:

- A completed stage of process refactoring or architecture adjustment
- A completed high-risk entry modification needing long-term context
- A major bug fix requiring preserved decision context
- User explicitly requests a change record

Do not write change logs for:

- Intermediate work package progress
- Routine steps already in checklist
- Pure style, naming, comment, or test additions

## Good / Bad

Good:

```text
Close gate
- Result: missing-host crash fixed; empty-state renders correctly
- Verified: `npm run test:unit -- deploy-host-selection`: pass; manual smoke on deployment page
- Unverified: real SSH connection to a remote host
- Risk: only static and unit-level coverage; runtime SSH path not exercised
```

Good (no risk case):

```text
Close gate
- Result: typo in error message corrected
- Verified: build pass, visual diff
- Unverified and risk: none beyond covered scope
```

Bad:

```text
Close gate
- All done, looks good, no issues.
```

```text
Close gate
- Done. Next step: continue improving the deploy flow.
```
