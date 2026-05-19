# Cross Module Change Template

## Goal

Control the boundaries, dependency direction, and communication patterns of cross-module changes.

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
