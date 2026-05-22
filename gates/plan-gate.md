# Plan Gate

## Goal

For long-running tasks only, record the operational plan after Scope and Solution, before implementation. Normal and tiny tasks skip this gate.

## When To Use

Output Plan gate after Solution gate when:

- The task spans multiple work packages, files, or modules at scale
- The work cannot be reliably finished in one round of implementation
- Repository structure changes, workspace migrations, package renames, multi-stage remediation
- The user's request explicitly says "phase by phase" or "step by step over time"

For everything else, skip Plan gate and go directly from Scope to implementation.

## Required Artifact

Plan gate must point to an operations workspace under `docs/operations/<initiative>/`. Create it with:

```bash
node harness/core/operations/create-operation-docs.js <initiative>
```

The operations workspace contains:

- Stage-level todo / checklist
- Execution order
- Backlog of work packages (board)
- Verification matrix
- Decision log

Plan gate is a short summary pointing into those documents; the docs are the source of truth.

## Minimal Fields

```text
Plan gate
- Operations workspace: docs/operations/<initiative>/
- Stages: stage 1 → stage 2 → stage 3
- Current work package: <ID> — <goal>
- First execution: ...
```

## Rules

- The agent must update the board / matrix / decisions when work packages change state.
- Finishing one work package is not the same as finishing the task; do not output a Close gate for a single work package if more actionable items remain.
- "Continue / start / keep going" defaults to advancing the highest-priority `todo` or `in_progress` work package.
- Real blockers go in the board's status field as `blocked` with the reason; do not bury them in Close gate.

## Good / Bad

Good:

```text
Plan gate
- Operations workspace: docs/operations/repo-restructure/
- Stages: inventory → cleanup → reference update → verification
- Current work package: RR-01 — inventory current roots
- First execution: read package.json, top-level dirs, write inventory section in board
```

Bad:

```text
Plan gate
- We'll figure it out as we go.
```
