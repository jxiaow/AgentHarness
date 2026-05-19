# Rule To Check Map

## Goal

Classify rules in the development process harness by "degree of automation feasibility", providing a minimal mapping for future tooling.

## Categories

- `fully-automatable`
  - Clear rule boundaries; can be implemented directly with scripts or ESLint
- `semi-automatable`
  - Can automatically detect suspicious patterns, but still requires human or AI judgment
- `human-ai-judgment`
  - Depends on semantic understanding; not suitable for hard automated gates

## Current Mapping

`Process` rows belong to harness core and travel with the `harness/core/` submodule. Project entry, interface contract, style, and build rules belong to the project adapter in `harness/project/`; configure these via `entry-checks.json` and project-specific scripts.

| Rule Area     | Example Rule                                    | Type              | Notes                                                        |
| ------------- | ----------------------------------------------- | ----------------- | ------------------------------------------------------------ |
| Code Style    | Formatting rules                                | fully-automatable | Reuse project formatter                                      |
| Code Style    | Static analysis rules                           | fully-automatable | Reuse project lint/typecheck                                 |
| Entry Points  | New capability registered at entry point        | semi-automatable  | Scan project-defined commands, exports, routes, plugins, or build entries |
| Interfaces    | Public interface not accidentally deleted/renamed| semi-automatable  | Scan exports, commands, events, config, or schema diffs      |
| Data Access   | Upper layer does not directly operate lower storage | semi-automatable | Scan project-defined boundaries and forbidden dependencies   |
| Error Model   | Errors use unified model                        | semi-automatable  | Scan hand-written error responses, exit codes, or exception patterns |
| Style System  | Styles do not bypass project tokens             | semi-automatable  | Only for projects with UI/style systems                      |
| Build         | New files wired into build or publish entry     | semi-automatable  | Requires file diff scanning                                  |
| Architecture  | No reverse dependencies                         | human-ai-judgment | Requires human judgment on dependency direction              |
| Communication | Communication method selection                  | human-ai-judgment | Requires human judgment                                      |
| Requirement   | Requirement boundary clarity                    | human-ai-judgment | Depends on context understanding                             |
| Design        | Approach reasonableness                         | human-ai-judgment | Depends on architecture trade-offs                           |
| Verification  | Verification sufficiency                        | human-ai-judgment | Depends on task semantics                                    |
| Process       | `in_progress` forbids `final closeout`          | semi-automatable  | Scan board status and delivery text keywords                 |
| Process       | Incomplete must have next action or blocker     | semi-automatable  | Scan board `next action`/`block reason` fields               |
| Process       | Closeout must have evidence anchors             | semi-automatable  | Scan result / verification command / unverified / risk       |
| Process       | Non-blocking next steps forbidden in closeout   | semi-automatable  | Scan next-step suggestions in final closeout                 |
| Process       | Next steps cannot be required closeout fields   | semi-automatable  | Scan phrasing that makes next steps a required closeout field|
| Process       | No boilerplate risk when no real risk exists    | semi-automatable  | Scan empty-value combinations of unverified + risk           |
| Process       | Task type and gates must be on separate lines   | semi-automatable  | Scan same line for task type + gate or multiple gate markers |
| Process       | In-progress defaults to maintaining checklist   | semi-automatable  | Scan checklist updates and closeout timing                   |
| Process       | Long-running tasks need stage todo and order    | semi-automatable  | Scan stage plan / order fields / current stage anchor        |
| Docs          | Operations docs not mixed into development      | semi-automatable  | Scan board/matrix/decision docs location                     |
| Git           | Commit message format correct                   | semi-automatable  | Regex match `<type>: <message>` format                       |
| Git           | No sensitive files committed                    | semi-automatable  | Scan `.env`, `credentials`, `*.pem`                          |
| Git           | No unrelated files committed                    | semi-automatable  | Scan `*.log`, `node_modules/`, temp files                    |
| Git           | Branch naming follows convention                | semi-automatable  | Regex match `feature/<name>`, `fix/<name>`, `refactor/<name>`|
| Git           | Commit granularity reasonable                   | human-ai-judgment | Requires judgment on change relatedness                      |
| Git           | Commit message meaningful                       | human-ai-judgment | Requires semantic understanding of message quality           |

## Candidate Checks

### Fully Automatable

- Project formatter check
- Project lint/typecheck check
- New files added to corresponding entry or registry

All above checks should support excluding:

- `node_modules/`
- Historical files unrelated to current diff

### Semi Automatable

- Scan cross-module changes for simultaneous modifications to multiple top-level directories
- Scan in-progress status for missing next action or blocker explanation
- Scan whether `final closeout` appears under `in_progress` status
- Scan whether `final closeout` contains result, recent verification command, unverified items, and risk
- Scan whether `final closeout` includes non-blocking next-step suggestions
- Scan whether docs make next steps a required `final closeout` field
- Scan whether `final closeout` uses "no unverified + no risk" boilerplate
- Scan whether same line contains task type + gate or multiple gate output markers
- Scan whether long-running tasks have stage-level todo/checklist and order fields first
- Scan whether operations docs are incorrectly placed in `docs/development/`
- Scan whether new files are wired into project-defined entries
- Scan whether upper modules directly depend on project-defined lower implementations
- Scan whether public interfaces, commands, events, or configs are accidentally deleted
- Scan whether error responses, exit codes, or exception models bypass project unified patterns
- Scan whether commit messages match `<type>: <message>` format
- Scan whether staged area contains `.env`, `credentials`, `*.pem`, `*.key` files
- Scan whether staged area contains `*.log`, `node_modules/`, temp files
- Scan whether branch name matches `feature|fix|refactor/<name>` format

### Human / AI Judgment

- Judge whether requirement boundary is clear
- Judge whether design approach fits existing patterns
- Judge whether verification coverage is sufficient
- Judge whether refactoring truly improves boundaries
- Judge whether cross-module changes break responsibility layering
- Judge whether project entry wiring is correct
- Judge whether module organization is reasonable
- Judge whether multiple changes should be split into separate commits (granularity)
- Judge whether commit message truly describes the change (semantic quality)
- Judge whether to create a new branch or continue on existing

## Automation Rollout

Automation lands in order of: low cost, low ambiguity, easily overlooked.

Default cost strategy: daily use `node harness/core/automation/check-process.js --changed --summary --max-issues 3`; only expand to full lint/test/build at stage closeout or high-risk entries.

Explicit targets: when needing to cover files or directories beyond git diff, run `node harness/core/automation/check-process.js --summary --max-issues 3 <path> [...]`.

Output budget: checks display first 5 issues by default; append `--max-issues <n>` for more.

Summary mode: on bulk failures, append `--summary` to see rule hit counts only.

Detailed report: failure details default to `.tmp/harness-check-report.json`; terminal keeps only summary.

### Phase 0: Process Checks

These checks land first because they directly reduce agent false-closeout and step-skipping probability:

Current entry points:

- Working tree: `npm run process:check -- --changed`
- Staged: `npm run process:check -- --staged`
- Full docs: `npm run process:check`

1. Does `final closeout` contain result, recent verification command, unverified items, and risk
2. Does `in_progress` stage incorrectly output `final closeout`
3. Does `final closeout` include non-blocking next-step suggestions
4. Does documentation make next steps a required `final closeout` field
5. Does `final closeout` use no-risk boilerplate to fill format
6. Does same line contain task type + gate or multiple gate output markers
7. Does `long-running` task have stage-level todo/checklist, execution order, and current work package first
8. Are operations board, verification matrix, decision log incorrectly placed in `docs/development/`

### Phase 1: Project Entry Checks

These checks cover the most commonly overlooked wiring points:

Current entry points are defined by the project adapter. If the adapter provides entry check scripts, prefer supporting:

- Working tree check
- Staged check
- Specified file check

1. Is new capability mounted at project-defined entry or registry
2. Are public interfaces, commands, events, or configs kept compatible
3. Does upper module bypass project-defined boundary to directly depend on lower implementation
4. Do error responses, exit codes, or exception models use unified patterns
5. Style token check (only for projects with UI/style systems)

### Phase 2: Existing Tooling

These checks prefer reusing existing tools; do not reinvent:

1. Project lint/typecheck (if project has config)
2. Formatter / Markdown format check (if project has config)
3. Git commit message and sensitive file scanning

Notes:

- Not recommended to make historical backlog a full-repo hard blocker in phase 1
- Entry wiring checks are better suited to cover new files first

## Suggested Output Format

Future tooling checks should use unified output:

- `rule`
- `severity`
- `location`
- `message`
- `suggestion`

## Principle

The automation layer's goal is not to replace rules, but to first turn the:

- Most stable
- Most easily overlooked
- Lowest ambiguity

rules into repeatable executable checks.
