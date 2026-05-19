# Gates

This directory contains stage gates for the execution process.

## Gates

| Gate | When | Purpose |
| --- | --- | --- |
| Scope | Before implementation | Decisions: goal, approach, boundary, risk, verification plan |
| Plan | Long-running tasks only, after Scope | Operations workspace, work packages, execution order |
| Build | After implementation, before Close | Actual change points, deviations from Scope |
| Close | At completion or real blocker | Verification record + final closeout: result, verified, unverified, risk |
| Git | When user explicitly asks to commit / push / open MR | Commit message, branch, sensitive file checks |

## Execution Order

Normal task: `Scope → Build → Close`

Long-running task: `Scope → Plan → Build → Close`

Tiny task: may collapse Build into Close if the change is trivial and matches Scope exactly.

## Rules

- Gates are process records, not approval pauses. Output the gate and continue unless there is a real blocker.
- Real blockers: needs user authorization, would damage existing work, requirement changed enough to miss the goal, key input missing.
- Finishing one work package is not the same as finishing a long-running task. Continue to the next actionable item unless the phase is complete or blocked.
- Do not output Close gate as a way to format intermediate progress.
