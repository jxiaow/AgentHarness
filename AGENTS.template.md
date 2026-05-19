# AGENTS.md

This file is the main entry point for the AI/agent development workflow.

## TL;DR (read this first)

Output these gates around your work:

1. **Task type** on its own line (bug / feature / refactor / UI / cross-module)
2. **Scope gate** — what we're solving, the approach, boundary, risk, how to verify
3. *(Long-running only)* **Plan gate** — operations workspace and current work package
4. Implement the change
5. **Build gate** — what was actually changed, any deviation from Scope
6. **Close gate** — verification record, unverified items, risk, final result

Gates are process records, not approval pauses. Keep going unless there's a real blocker (needs user authorization, would damage existing work, requirement changed, or key input missing).

For tiny single-file changes that match Scope exactly, Build gate can collapse to one line.

---

- Process layer: `harness/core/` (generic, independently upgradable)
- Project layer: `harness/project/` (current project configuration)

## Standard Workflow

```
Scope → [Plan] → Build → Close
```

1. Declare task type
2. Output Scope gate
3. *(Long-running only)* Output Plan gate, create operations workspace
4. Read relevant rules (`harness/core/rules/` + `harness/project/rules/`)
5. Implement
6. Output Build gate
7. Verify; output Close gate

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
- UI redesign / major visual overhaul: wait for user confirmation after Scope gate
- Long-running tasks: create a todo/checklist first, then proceed in order
- Never pause with "if you agree / shall I continue" style prompts

## Concise Output

- Open with 1 sentence stating the goal
- Gates use multi-line short lists
- No status updates during execution by default; 1 sentence sync at key checkpoints
- Close gate: result → verified → unverified → risk

## Hard Constraints

- All changes, no matter how small, must go through Scope and Close gates
- Never skip the workflow and jump straight to implementation
- Never format intermediate progress as Close gate
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
