# AgentHarness

AgentHarness is a portable process layer for AI coding agents. It makes agents state requirements, choose a design, implement within project rules, verify the result, and deliver a clear closeout instead of jumping straight into edits.

It is for teams using tools like Codex, Claude Code, Gemini CLI, or custom coding agents inside real repositories where "just change the code" often turns into skipped context, half-finished refactors, vague verification, or messy docs.

## Why It Exists

AI coding agents are useful, but they fail in predictable ways:

- They start coding before the requirement boundary is clear.
- They make local fixes that violate project architecture.
- They call one small work package "done" while the larger migration is still open.
- They mix stable docs, transition plans, and execution checklists in the same place.
- They say something is verified without showing what was actually run.

AgentHarness turns those failure modes into a small, repeatable workflow:

```text
Requirement -> Design -> Implementation -> Verification -> Delivery
```

The point is not more ceremony. The point is to make agent work reviewable, resumable, and harder to derail.

## What You Get

- **Task templates** for bug fixes, features, refactors, UI changes, and cross-module work.
- **Stage gates** that force the agent to record scope, design, implementation, verification, and delivery.
- **Autopilot rules** so gates are process records, not approval pauses.
- **Project adapters** for repo-specific facts, high-risk paths, and local rules.
- **Operations docs** for long-running migrations and remediation work.
- **Lightweight process checks** to catch broken Markdown structure and known harness rule issues.

## 30-Second Example

Without a process layer:

```text
User: Fix the deployment page bug.
Agent: I changed three files. It should work now.
```

With AgentHarness:

```text
Task type
Bug

Requirement gate
- Symptom: deployment page fails when the selected host is missing.
- Boundary: keep API shape and routing unchanged.
- Expected behavior: show an actionable empty state.
- Verification: targeted unit test and smoke path.

Design gate
- Fix point: normalize missing host state in the store, not inside the component.
- Risk: host selection is shared by deployment and branch flows.
- Rules: preserve Pinia state path and existing router entry.

Verification gate
- `npm run test:unit -- deploy-host-selection`: pass
- Manual smoke: deployment page empty state renders
- Not covered: real SSH connection
```

The agent still moves quickly, but reviewers can see what it believed, what it touched, and what it did not verify.

More examples:

- [Bug fix gate output](examples/bug-fix-gate-output.md)
- [Long-running remediation board](examples/long-running-remediation.md)

## Quick Start

Copy this directory into your repository:

```text
your-repo/
└── harness/
    └── process/
```

Create or update `AGENTS.md` at the repo root. You can start from:

```text
harness/process/AGENTS.template.md
```

Generate a project adapter:

```bash
node harness/process/project/create-adapter.js --target harness/process/project/local --name "Local Project Adapter"
```

Fill in the adapter with your repo facts:

- `harness/process/project/local/local.md`
- `harness/process/project/local/rules/`
- optional `harness/process/project/local/automation/`

Ask the agent to follow the harness. A minimal root `AGENTS.md` should say:

```md
# AGENTS.md

Use `harness/process/` as the development workflow.

Before editing code:
- classify the task
- output Requirement gate
- output Design gate
- read the relevant rules

After editing:
- output Implementation gate
- run necessary verification
- output Verification and Delivery gates
```

## Optional npm Scripts

`npm run ...` only works after you add wrappers to your own `package.json`.

```json
{
  "scripts": {
    "process:check": "node harness/process/automation/check-process.js",
    "harness:ops:init": "node harness/process/operations/create-operation-docs.js",
    "harness:create-adapter": "node harness/process/project/create-adapter.js"
  }
}
```

Then you can run:

```bash
npm run process:check
npm run harness:ops:init -- desktop-restructure
npm run harness:create-adapter -- --target harness/process/project/local --name "Local Project Adapter"
```

## Repository Layout

```text
harness/process/
├── AGENTS.template.md          # starter root instructions
├── README.md                   # this file
├── automation/                 # lightweight checks
├── examples/                   # copyable workflow examples
├── gates/                      # Requirement, Design, Verification, Delivery, Git
├── operations/                 # long-running initiative doc generator
├── project/                    # project adapter templates and local adapter
├── rules/                      # portable implementation rules
└── templates/                  # task-type templates
```

## Core Model

AgentHarness has two layers:

- **Core**: templates, gates, rules, operations workflow, and checks that are portable across repositories.
- **Project adapter**: repository-specific facts such as module boundaries, high-risk files, local commands, and domain rules.

Keep business facts out of the core. Put them in `project/local/` so the harness can be copied to another repo without carrying the previous repo's architecture.

## Default Workflow

For every task, the agent should:

1. Select the closest template from `templates/`.
2. Decide task size: `tiny`, `normal`, or `long-running`.
3. Output Requirement gate.
4. Output Design gate.
5. Read the relevant `rules/` and project rules.
6. Implement the change.
7. Output Implementation gate.
8. Run necessary verification.
9. Output Verification gate.
10. Output Delivery gate.

Gates are not approval checkpoints by default. If there is no real blocker, the agent records the gate and continues.

## Task Sizes

| Size | Use When | Extra Requirement |
| ---- | -------- | ----------------- |
| `tiny` | Single-file wording, style, or local config changes | Still output Requirement and Design gates |
| `normal` | Regular bugs, features, refactors, or UI changes | Read relevant rules before implementation |
| `long-running` | Repository structure, workspace, migration, or multi-stage remediation | Create `docs/operations/<initiative>/` docs before implementation |

## Long-Running Work

For migrations, repo restructures, or continuous remediation, create an operations workspace:

```bash
node harness/process/operations/create-operation-docs.js <initiative>
```

This creates:

```text
docs/operations/<initiative>/
├── current-<initiative>.md
├── <initiative>-board.md
├── <initiative>-matrix.md
└── <initiative>-decisions.md
```

Use these files as the source of truth for:

- phase goals
- work package order
- backlog state
- verification matrix
- decisions and reopen conditions

A work package finishing is not the same thing as the whole task finishing. The agent should continue to the next highest-priority item unless the phase is complete or a real blocker appears.

## Document Placement

Use two documentation layers:

- `docs/development/` for stable architecture, module, setup, and long-term maintenance docs.
- `docs/operations/` for temporary execution docs: plans, boards, checklists, verification matrices, and migration state.

Do not leave transition checklists and phase decisions mixed into stable development docs.

## Lean Output Rules

Default agent output should be compact:

- Start with one sentence: goal and first action.
- Put task type on its own line.
- Keep Requirement and Design gates to short bullets.
- Do not treat gates as a pause.
- Do not output a final closeout for a single work package if the larger goal still has work.
- In the final closeout, separate completed work, verification, unverified areas, and real remaining risk.

Before a final closeout, classify the current target:

- `single-task`: one bounded task; close only after the requested result and necessary verification are complete.
- `staged/ongoing`: migration, remediation, or multi-stage work; close only when the current phase has no actionable remaining item or a real blocker appears.
- `continuation`: the user says "continue", "start", or "keep going"; inherit the active phase and move to the next actionable item.
- `explicit-closeout`: the user asks to summarize, stop, or close; report the current verified state without pretending unfinished work is done.

## Verification

For normal changes, prefer targeted checks:

```bash
node harness/process/automation/check-process.js --changed --summary --max-issues 5
```

For harness development, run the harness tests:

```bash
npm run harness:test
```

The process check is not a business test. It only proves that the harness-visible process files pass the checks currently implemented.

## Execution Model

AgentHarness defaults to autopilot execution:

1. If there is no real blocker, the agent continues from requirement and design through implementation, verification, and delivery.
2. Requirement and Design gates must happen before implementation. They are records, not approval pauses.
3. Long-running or multi-stage work must create phase-level todos, a checklist, and an execution order before implementation.
4. Finishing one work package is not a final closeout. The agent should continue to the next actionable item.
5. "Continue", "start", and "keep going" mean continuing the active phase by default.
6. A final closeout is allowed only when the current target is complete or a real blocker appears.
7. Durable decisions can be written to `docs/development/changes/`, but only at phase closeout, after high-risk work is complete, or when the user explicitly asks for it.
8. External skills or planning tools should not inflate the workflow. Collapse their output into the harness gates and continue unless there is a real blocker.

Real blockers are limited to:

- a command needs user authorization
- continuing would overwrite or damage existing work
- the requirement has changed enough that continuing would clearly miss the goal
- key input is missing and cannot be inferred from the repository

## Closeout Rules

Before a final closeout, the agent must decide which target type it is handling:

- `single-task`: a bounded task; close only after the requested result and necessary verification are complete.
- `staged/ongoing`: long-running remediation, migration, or multi-stage work; close only when the current phase has no actionable remaining item, or a real blocker appears.
- `continuation`: the user says "continue", "start", "keep going", or similar; inherit the active phase and continue the next item.
- `explicit-closeout`: the user asks to summarize, stop, or close; report the current verified state.

If an active operations board or checklist exists under `docs/operations/<initiative>/`, the agent must read it before final closeout and confirm that the highest-priority actionable item has been advanced.

## Long-Running Remediation Workflow

Use this workflow for repository restructures, workspace changes, package renames, application entrypoint renames, migrations, and multi-stage remediation.

Before implementation:

1. Create or reuse `docs/operations/<initiative>/`.
2. Write the phase-level todo/checklist, execution order, non-goals, and first work package.
3. Update the board so the current highest-priority work package is explicit.

Each work package should record:

- `ID`
- goal
- scope
- risk
- verification method
- completion standard
- dependency
- status

When a package finishes:

1. Update the board.
2. Update the verification matrix.
3. Record decisions, deferrals, or reopen conditions if they changed.
4. Continue to the next item unless the phase is complete or blocked.

## Responsibility Split

Keep rules in the narrowest stable place:

- `AGENTS.md`: repo-level hard constraints, trigger rules, red lines, and navigation.
- `README.md`: general execution model, task sizing, and long-running workflow.
- `templates/`: minimal analysis fields for each task type.
- `gates/`: stage closeout fields, examples, and anti-patterns.
- `rules/`: portable implementation and verification rules.
- `automation/`: generic process checks.
- `project/`: repository facts, business chains, high-risk paths, and replaceable adapter content.

## Lean Execution Defaults

Default command and context usage should stay small:

1. Search only the target paths and exclude generated output such as `target/`, `node_modules/`, and `dist/`.
2. Check `git status` only for paths relevant to the current task when possible.
3. Read files by locating first, then opening a small window.
4. Truncate long outputs and keep only decision-relevant lines.
5. Prefer changed-file process checks over full lint/test runs unless the conclusion depends on a broader check.
6. If a broad check is necessary, state the reason and scope in Verification gate.

Details live in [rules/token-efficiency.md](rules/token-efficiency.md).

## Quick Navigation

- Task routing: [templates/](templates/)
- Stage gates: [gates/](gates/)
- Portable rules: [rules/](rules/)
- Automation: [automation/](automation/)
- Project adapter: [project/](project/)
- Adapter profiles: [project/profiles/](project/profiles/)

## Maintenance Rule

When maintaining the harness, check that:

- template triggers, gate order, and README defaults agree
- repository-specific facts stay in `project/` or project-specific rules
- automation mapping tables render correctly
- regex values containing `|` are escaped in Markdown tables
- new rules have either a human judgment point or a candidate automated check

## License

MIT. See [LICENSE](LICENSE).
