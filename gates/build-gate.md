# Build Gate

## Goal

After implementation, record what was actually changed and whether it deviated from Scope. This gate is short by design — git diff already shows the change, so only call out what is not obvious.

## When To Use

Output Build gate after implementation, before Close gate. For tiny tasks where the change is trivial and matches Scope exactly, Build gate may collapse to a single line or be merged into Close.

## Minimal Fields

Use a multi-line short list, up to 4 items:

- Changed: core change points (files / modules / functions)
- Kept: anything explicitly preserved that someone might expect to change
- Deviated from Scope: yes / no — if yes, explain why
- Incomplete: anything Scope promised but Build did not deliver

If Build matches Scope exactly with no deviations and no incomplete items, this gate is one line:

```text
Build gate: implemented as scoped, no deviations.
```

## When To Expand

Add more detail when:

- Implementation deviated from the Scope approach (changed file, used different mechanism, expanded boundary)
- Cross-module: confirm dependency direction was preserved, no reverse dependencies introduced
- High-risk entry: confirm change scope was narrowed, did not carry unrelated logic
- Public interface: confirm entry point wired up, error paths complete
- Style system: confirm design tokens used, no hardcoded reusable values

## Recommended Output

```text
Build gate
- Changed: ...
- Kept: ...
- Deviated: no
- Incomplete: none
```

Default requirements:

- Do not repeat content already in Scope gate
- Do not list every file — list change points, not file names
- Do not write implementation play-by-play
- When output alongside other gates, separate with blank lines before and after

## Deviation Handling

If Build deviated from Scope:

- State what changed and why in one sentence
- If the deviation introduces new risk, surface it in Close gate
- If the deviation invalidates parts of Scope (different approach, expanded boundary), update the operations board (long-running) or briefly restate the new boundary

Never silently deviate. Never restate the deviation as if it were the original plan.

## Good / Bad

Good (matches scope):

```text
Build gate: implemented as scoped, no deviations.
```

Good (with deviation):

```text
Build gate
- Changed: deployment store selector, DeploymentStatus empty-state branch
- Kept: route names, API shape, persisted host data format
- Deviated: yes — added a guard in the component instead of only in the store, because the empty state was rendered before the store hydrated
- Incomplete: none
```

Bad:

```text
Build gate
- Modified files: a.js, b.js, c.js, d.js, e.js
- Did some refactoring.
```
