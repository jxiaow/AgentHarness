# Gates

This directory contains stage gates for the execution process.

## Gates

| Gate | When | Purpose |
| --- | --- | --- |
| Scope | Before implementation | Decisions: goal, approach, boundary, risk, verification plan |
| Solution | Task-level and long-running work, after Scope | Selected behavior, public surface change, compatibility direction |
| Plan | Long-running tasks only, after Solution | Operations workspace, work packages, execution order |
| Build | After implementation, before Close | Actual change points, deviations from Scope |
| Close | At completion or real blocker | Verification record + final closeout: result, verified, unverified, risk |
| Git | When user explicitly asks to commit / push / open MR | Commit message, branch, sensitive file checks |

## Execution Order

Normal task: `Scope → Solution → Build → Close`

Long-running task: `Scope → Solution → Plan → Build → Close`

Tiny task: may collapse Build into Close if the change is trivial and matches Scope exactly.

## Rules

- Gates are process records by default. Output the gate and continue unless there is a real blocker or Solution gate exposes an unapproved public behavior decision.
- Solution gate must be shown before Build for Task-level work; Scope alone is not a substitute for a reviewable solution.
- Real blockers: needs user authorization, would damage existing work, requirement changed enough to miss the goal, key input missing.
- Finishing one work package is not the same as finishing a long-running task. Continue to the next actionable item unless the phase is complete or blocked.
- Do not output Close gate as a way to format intermediate progress.
