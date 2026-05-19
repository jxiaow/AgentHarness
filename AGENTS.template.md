# AGENTS.md

This file is the main entry point for the AI/agent development workflow.

## TL;DR (read this first)

Before any code change, output:

1. **Task type** on its own line (bug / feature / refactor / UI / cross-module)
2. **Requirement gate** — what we're solving, what's in/out of scope
3. **Design gate** — where to change, the risk, how to verify

After implementing, output:

4. **Verification gate** — what was actually run, results, what's NOT covered
5. **Delivery gate** — only when the task is complete; never close out a single work package as the whole task

Gates are process records, not approval pauses. Keep going unless there's a real blocker (needs user authorization, would damage existing work, requirement changed, or key input missing).

For tiny single-file changes, you may collapse Requirement + Design into one combined "Scope gate".

---

- Process layer: `harness/core/` (generic, independently upgradable)
- Project layer: `harness/project/` (current project configuration)

## Standard Workflow

```
Requirement → Design → Implementation → Verification → Delivery
```

1. Declare task type
2. Output Requirement gate
3. Output Design gate
4. Read relevant rules (`harness/core/rules/` + `harness/project/rules/`)
5. Implement → Implementation gate
6. Verify → Verification gate
7. Deliver → Delivery gate

## Auto Trigger

| Keywords | Template |
| --- | --- |
| fix / bug / error / issue | `bug-fix` |
| refactor / optimize / clean up | `refactor` |
| add / create / implement | `new-feature` |
| adjust / modify / restyle | `ui-adjustment` |
| cross-module / affects multiple | `cross-module-change` |
| overall structure / directory restructure / workspace / migration | `cross-module-change` + long-running handling |

Automatically enters the workflow when keywords are detected; no user prompt needed.

## Autopilot

- Gates are process records, not approval checkpoints; execute continuously when unblocked
- Only pause when user authorization is needed, existing changes could be damaged, or critical input is missing
- UI redesign / major visual overhaul: wait for user confirmation after Design gate
- Long-running tasks: create a todo/checklist first, then proceed in order
- Never pause with "if you agree / shall I continue" style prompts

## Concise Output

- Open with 1 sentence stating the goal
- Gates use multi-line short lists
- No status updates during execution by default; 1 sentence sync at key checkpoints
- Final closeout: result → verified → unverified → risk

## Hard Constraints

- All changes, no matter how small, must go through gates
- Never skip the workflow and jump straight to implementation
- Never format intermediate progress as final delivery
- Auto-advance by default; do not ask questions in place of actions you can complete yourself
- Do not run builds or start dev servers by default (unless required for verification)
- On test failure, first execute `harness/core/rules/test-failure-triage.md`

## Project Configuration

See `harness/project/profile.md`

## Navigation

| Content | Path |
| --- | --- |
| Project config | `harness/project/profile.md` |
| Project rules | `harness/project/rules/` |
| Task templates | `harness/core/templates/` |
| Stage gates | `harness/core/gates/` |
| Generic rules | `harness/core/rules/` |
| Automation | `harness/core/automation/` |
| Operations doc templates | `harness/core/operations/` |

## Onboarding a New Project

```bash
git submodule add https://github.com/jxiaow/agent-harness.git harness/core
mkdir -p harness/project/rules
```

Then give the AI a one-liner:

> Read `harness/core/ONBOARD.md` and generate the profile and rules for this repository.

The AI will automatically complete: generating `harness/project/profile.md`, project rules, and `AGENTS.md`.
