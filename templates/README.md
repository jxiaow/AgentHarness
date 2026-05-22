# Templates

This directory contains task type templates.

Template list:

- `new-feature.md`
- `bug-fix.md`
- `refactor.md`
- `ui-adjustment.md`
- `cross-module-change.md`

Selection rules:

- New functionality or new page: `new-feature.md`
- Fixing an anomaly or regression: `bug-fix.md`
- Restructuring without changing target behavior: `refactor.md`
- Local style or interaction adjustment: `ui-adjustment.md`
- Changes involving multiple modules: `cross-module-change.md`

Default requirements:

- Match the closest primary template first
- Only add minimal analysis points; inline into Scope or Solution gate by default, do not output a separate template section
- When multiple templates match, use the primary template and only supplement missing boundaries from secondary templates

Task sizing:

- `tiny`: template uses only 2-3 key fields; Build gate may collapse to one line
- `normal`: use template default minimal analysis points, then output Solution gate before Build
- `long-running`: beyond template fields, output Solution gate and Plan gate with stage-level todo/checklist, execution order, and current first work package

Example:

```text
Scope gate
- Task type: refactor
- Goal: reduce repetition in process documentation
- Approach: collapse Requirement/Design and Verification/Delivery gates
- Boundary: only change harness/core docs, not business code
- Risk: existing consumers may have memorized old gate names
- Verification: Markdown static check, run process check on whole repo

Solution gate
- Target behavior: process documentation uses one explicit selected-solution stage before Build.
- Chosen solution: add a generic Solution gate and route normal/long-running task flows through it.
- Surface changes: harness process docs and generated AGENTS template.
- Compatibility: Patch tier stays direct; public-behavior Solution gates may pause for approval.
- Verification impact: search old flow strings and run harness checks.
```
