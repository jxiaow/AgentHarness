# Scope Gate

## Goal

Before implementation, state what is being solved, where it will change, what is out of scope, and how the result will be verified. Scope bounds the problem; it does not replace Solution gate for Task-level work.

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

## Judgment Criteria

Use these to decide what to write in each field:

**Goal**: Must name a specific observable problem or outcome. "Fix the bug" is not a goal. "Deployment page crashes when no host is selected" is.

**Approach**: Must name the specific location and mechanism. "Change some code" is not an approach. "Normalize missing host state in the store selector" is.

**Boundary**: Must name at least one thing that will NOT change. If you cannot name a boundary, the scope is too vague — ask for clarification or narrow it yourself.

**Risk**: Apply this decision tree:
- Does the change touch shared state, public interfaces, or cross-module boundaries? → Name the specific sharing risk.
- Does the change have a failure mode that is not covered by the verification plan? → Name it.
- Is the change isolated to one file with no external consumers? → Write "low — isolated change" (one line, not a paragraph).
- Never write "no risk" for changes touching more than one module.

**Verification**: Must name a concrete method (command, manual step, or contract). "Will verify" is not a plan. "Run `npm test -- auth`, check login page renders" is.

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

For UI redesign, full visual overhauls, or cases with multiple viable directions, use Solution gate to make the target direction explicit before implementation. UI changes that require a previewable HTML mockup still pause for confirmation after Scope/Solution. See `templates/ui-adjustment.md` for details.

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
