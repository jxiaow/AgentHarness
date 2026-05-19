# New Feature Template

## Goal

Clarify the feature goal, placement, and boundaries to avoid unbounded scope creep.

## Scope Gate Fields For Features

When using this template, fold these fields into Scope gate:

- Feature goal
- Target user / entry point
- Primary placement (where new code goes)
- Success criteria
- Explicitly out of scope

## Only Add When Relevant

- Involves UI: add theme, responsiveness, component or view patterns
- Involves runtime bridge: add adapter / command / IPC / message boundaries
- Involves public interface: add entry point, state container, composition logic, and communication chain
- Involves new files: add application entry, registration entry, export entry, or dependency manifest

## Recommended Output

```text
Scope gate
- Task type: feature
- Goal: ...
- Placement: ...
- Approach: ...
- Boundary: ...
- Risk: ...
- Verification: ...
```
