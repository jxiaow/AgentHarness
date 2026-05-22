# Bug Fix Gate Output Example

This example shows the shape of a compact bug-fix interaction with the Scope/Solution/Build/Close flow. The exact fields can vary by project, but the important behavior is stable: the agent records scope and the selected solution before editing, then records build deltas and verification after editing.

## User Request

```text
Fix the deployment page crash when no host is selected.
```

## Agent Output Before Editing

```text
Task type
Bug

Scope gate
- Goal: deployment page crashes when no host is selected; render a usable empty state instead.
- Approach: normalize missing host state in the store selector; component consumes the normalized state and renders the existing empty state component.
- Boundary: do not change route names, API shape, or persisted host data.
- Risk: host selection is shared by deploy and branch workflows.
- Verification: targeted component/store test and manual page smoke.

Solution gate
- Target behavior: page renders the existing empty state when no host is selected.
- Chosen solution: normalize missing-host data at the selector boundary and keep the component branch small.
- Surface changes: none; route, API, and persisted host data stay unchanged.
- Compatibility: existing selected-host flow keeps the same data shape.
- Verification impact: test both selector normalization and empty-state render path.
```

## Agent Output After Editing

```text
Build gate
- Changed: host selection selector and deployment empty-state branch.
- Kept: route names, API shape, persisted data format.
- Deviated: no.

Close gate
- Result: missing-host crash fixed and covered by targeted verification.
- Verified: `npm run test:unit -- deployment-host-selection`: pass; manual smoke: deployment page loads with no selected host.
- Unverified: real SSH connection to a remote host.
- Risk: only static and unit-level coverage; runtime SSH path not exercised.
```

## Why This Helps

The reviewer can quickly answer:

- What bug did the agent think it was fixing?
- What did it explicitly avoid changing?
- What was actually changed?
- Did the implementation deviate from the plan?
- What evidence supports the closeout claim?
- What is still unverified?
