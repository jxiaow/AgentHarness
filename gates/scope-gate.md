# Scope Gate

## Goal

Before implementation, state what is being solved, where it will change, what is out of scope, and how the result will be verified. This is the only pre-implementation gate.

## Minimal Fields

Use multi-line short lists, up to 6 items:

- Task type (bug / feature / refactor / UI / cross-module)
- Goal — target problem or feature
- Approach — where and how to change
- Boundary — what is explicitly out of scope
- Risk — what could go wrong
- Verification — how the result will be checked

## Only Add When Relevant

- Bug: symptom, expected behavior, suspected root cause
- Feature: target user, entry point, is it new / replacement / enhancement
- Refactor: confirm external behavior preserved, main pain point
- UI: theme, responsiveness, component patterns, design approval requirements
- Cross-module: dependency direction, communication chain, why a single module change is insufficient
- Long-running: a stage-level todo/checklist and execution order must exist before this gate

## Recommended Output

```text
Scope gate
- Task type: ...
- Goal: ...
- Approach: ...
- Boundary: ...
- Risk: ...
- Verification: ...
```

Default requirements:

- Simple tasks may reduce field count; do not cram multiple fields into one line with semicolons
- Task type must be on its own line, not crammed with the gate heading
- When output alongside other gates, separate with blank lines before and after
- Complex tasks prefer 4-6 line short lists
- Do not omit critical risks or verification approach for brevity
- Only keep decisions and boundaries; do not write implementation play-by-play

## Design Approval

For UI redesign, full visual overhauls, or cases with multiple viable directions, pause after Scope gate to generate a previewable HTML mockup before implementation. See `templates/ui-adjustment.md` for details.

## Good / Bad

Good:

```text
Scope gate
- Task type: bug fix
- Goal: deployment page crashes when no host is selected
- Approach: normalize missing host state in store selector; render existing empty state
- Boundary: no API or routing changes
- Risk: host selection is shared with branch workflow
- Verification: targeted unit test, manual page smoke
```

Bad:

```text
Scope gate
- Just gonna fix the bug, should be simple.
```
