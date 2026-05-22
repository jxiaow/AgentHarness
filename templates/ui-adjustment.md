# UI Adjustment Template

## Goal

Control UI adjustment scope, ensuring visual, interaction, and theme adaptation are complete.

## Not This Template

Do not use ui-adjustment if:
- The change is adding a new page or feature (not adjusting existing UI) → use `new-feature`
- The change is fixing a crash or functional bug that happens to be in a UI component → use `bug-fix`
- The change is restructuring component code without visual change → use `refactor`

## Scope Gate Fields For UI Changes

When using this template, fold these fields into Scope gate:

- Adjustment type
- Affected pages/components
- Main changes
- Verification method
- Residual risk

## Design Approval (Pause After Scope/Solution Gates)

The following situations require pausing after Scope and Solution gates to generate a previewable HTML UI mockup for user confirmation; implementation is forbidden before confirmation:

- User requests "redesign UI / redo interface / full overhaul / visual direction"
- Changes affect page information architecture, core layout, visual style, or multiple core pages
- Multiple viable visual directions require trade-off decisions
- User judgment is needed on whether "what it looks like" meets expectations

Scope gate must at minimum provide:

- Target pages and layout approach for each
- Core visual direction (density, color, card/table/log form factors)
- Key interaction states (hover / active / focus / empty / loading)
- Responsive handling approach
- HTML mockup path and preview method
- Explicit question asking user whether to implement per the HTML mockup

HTML mockup requirements:

- Place in `docs/operations/<initiative>/` or user-specified operations directory
- Use a single directly-openable `.html` file expressing page structure, core visuals, and key states
- Cover desktop and mobile main layouts; use multi-state blocks in the same HTML when necessary
- Use the project's design system and CSS variable approach; do not introduce visual systems unrelated to the target project
- The mockup is confirmation material, not a replacement for final business code implementation

The following situations do NOT require pausing; proceed with Autopilot:

- Single color, spacing, copy, icon, alignment, or other clear style fixes
- User has provided sufficiently specific mockups, screenshots, or implementation requirements
- User explicitly says "just implement / no confirmation needed / go with your approach"

## Required References

- Before UI design, visual refactoring, or component style adjustments, reference the project's design system documentation if it exists (e.g. `docs/design/design-system.md`)
- Theme variables and state styles follow the project's theme rules if defined (e.g. `harness/project/rules/theme-patterns.md`)

## Design System Sync (auto-triggered)

When UI adjustments involve any of the following, the corresponding design system documentation **must** be synced before Close gate (if the project maintains design system docs under `docs/design/`):

| Trigger | Sync target |
| --- | --- |
| Modifying public component interaction or visual spec | design system controls doc |
| Adding/modifying layout patterns or spacing rules | design system layout doc |
| Adding/modifying feedback component behavior | design system feedback doc |
| Adding/modifying form control behavior or states | design system forms or controls doc |
| Adding/modifying theme variables | design system foundations + variables file |

Rules:

- Sync is part of implementation, not an optional follow-up.
- Only update affected entries; do not rewrite the entire document.
- Close gate must list which design system files were synced; explain if not synced.

## Only Add When Relevant

- Involves theme: add light / dark
- Involves layout: add responsiveness
- Involves interaction: add hover / active / disabled / focus
- Involves public components: clarify whether it is a local tweak or a public style change

## Recommended Output

```text
Scope gate
- Task type: UI
- Affected: ...
- Changes: ...
- States: ...
- Risk: ...
- Verification: ...
```
