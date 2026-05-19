# Refactor Template

## Goal

Improve boundaries, readability, or reuse without changing existing external behavior.

## Not This Template

Do not use refactor if:
- External behavior will change (even slightly) → use `new-feature` or `bug-fix`
- The restructuring spans multiple modules and the main risk is cross-module coordination → use `cross-module-change`
- The change is purely cosmetic (rename a CSS class, fix a typo) → use tiny task shortcut directly

## Scope Gate Fields For Refactors

When using this template, fold these fields into Scope gate:

- Refactoring goal
- Is behavior preserved (must explicitly say yes)
- Boundary (what code stays untouched)
- Core focus points
- Verification method

## Only Add When Relevant

- Touches high-risk entry: explain why this specific location must be changed
- Involves cross-module: explain dependency direction and communication boundaries
- Needs phasing: explain which layer first, which layer next
- Long-running / multi-stage: switch to long-running flow with Plan gate; create operations workspace
- Just moving files: explain why this still provides structural benefit

## Recommended Output

```text
Scope gate
- Task type: refactor
- Goal: ...
- Behavior preserved: yes
- Boundary: ...
- Focus: ...
- Risk: ...
- Verification: ...
```
