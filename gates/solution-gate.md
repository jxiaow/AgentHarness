# Solution Gate

## Goal

After Scope and before implementation, make the selected solution visible. Scope says what problem is bounded; Solution says what behavior and contract the build will implement.

## When To Use

Output Solution gate for Task-level and long-running work after Scope gate.

Patch-level work and tiny tasks with no external behavior choice may skip it or fold the one-line solution into Scope. If a Patch grows into a Task, output Solution gate before continuing implementation.

## Minimal Fields

Use short lists. Keep the gate reviewable, not exhaustive:

- Target behavior — what the result should do from the caller or user point of view
- Chosen solution — the mechanism and main change points
- Surface changes — CLI/API/UI/config/protocol/persistence/workflow changes, or `none`
- Compatibility — what existing behavior is kept, removed, migrated, or intentionally broken
- Verification impact — what proves this solution rather than only proving code compiles

## Approval Boundary

Solution gate is a process record by default. Continue automatically when the direction is already constrained by the request and no external behavior decision remains.

Pause after Solution gate before implementation when the exact direction has not already been approved and the solution changes any of:

- Public command, API, event, message, output, or persisted data contract
- User workflow, default behavior, or meaning of an existing action
- Removal, replacement, or semantic repurposing of an existing entry point
- UX or product behavior with multiple viable directions where user judgment decides the target

The user may approve by having already stated the exact target behavior, by accepting a previously shown solution, or by explicitly asking to implement the proposed solution. Do not treat a vague "fix it" request as approval for a new public contract.

## Judgment Criteria

**Target behavior**: Must be observable. "Refactor the command layer" is not target behavior. "The status command stays config-only; a new process command returns PID and log path" is.

**Chosen solution**: Must state the chosen direction, not just list files. "Add `ps` as the runtime query entry and remove `logs` from the public command matrix" is a solution. "Edit CLI files" is not.

**Surface changes**: Must name changed contracts. If none change, say `none` so implementation-only fixes remain clear.

**Compatibility**: Must make deletions, fallback behavior, migrations, and intentional breaks visible before Build.

## Recommended Output

```text
Solution gate
- Target behavior: ...
- Chosen solution: ...
- Surface changes: ...
- Compatibility: ...
- Verification impact: ...
```

## Good / Bad

Good:

```text
Solution gate
- Target behavior: `run --detach` returns only the target process PID; runtime state can be queried separately.
- Chosen solution: add `qt ps` over stored executable path and remove launcher PID from public output.
- Surface changes: new CLI action and JSON output contract; `logs` is no longer public.
- Compatibility: saved run-state remains readable; old `logs` calls fail as unknown command.
- Verification impact: CLI parser/output tests plus detached-run PID integration test.
```

Bad:

```text
Solution gate
- We'll improve the flow and see what works.
```
