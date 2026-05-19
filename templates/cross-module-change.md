# Cross Module Change Template

## Goal

Control the boundaries, dependency direction, and communication patterns of cross-module changes.

## Not This Template

Do not use cross-module-change if:
- The change is contained within a single module even if it affects multiple files → use `bug-fix`, `new-feature`, or `refactor`
- The cross-module aspect is only a test or documentation update → use the primary template for the code change
- The work is a large-scale migration → use `cross-module-change` + long-running flow with Plan gate

## Scope Gate Fields For Cross-Module Changes

When using this template, fold these fields into Scope gate:

- Modules involved
- Primary change point
- Why a single module change is insufficient
- Key interfaces / communication chain
- Verification method

## Only Add When Relevant

- Touches runtime bridge: add adapter / command / IPC / message boundaries
- Touches public interface: add entry point, permission boundaries, and communication chain
- Touches state management: add state container, cache, or persistence boundaries
- Long-running / multi-stage: switch to long-running flow with Plan gate; create operations workspace
- A smaller entry point exists: explain why it is not used this time

## Recommended Output

```text
Scope gate
- Task type: cross-module
- Modules: ...
- Primary target: ...
- Why cross-module: ...
- Communication chain: ...
- Risk: ...
- Verification: ...
```
