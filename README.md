# agent-harness

A portable process layer for AI coding agents. It makes agents define scope and approach before editing, then record what was verified and what wasn't — instead of jumping straight into code.

For teams using Codex, Claude Code, Kiro, Gemini CLI, Cursor, or custom agents in real repositories.

Chinese version: [README.zh-CN.md](README.zh-CN.md)

---

## Who Should Read What

| You are… | Start here |
| --- | --- |
| Developer integrating harness into a project | [Quick Start](#quick-start) |
| Agent maintainer or harness contributor | [docs/maintaining.md](docs/maintaining.md) |
| Curious about the full workflow details | [docs/workflow-reference.md](docs/workflow-reference.md) |

---

## The Problem

AI coding agents fail in predictable ways:

- Start coding before the requirement boundary is clear
- Make local fixes that violate project architecture
- Call one work package "done" while the larger migration is still open
- Mix stable docs, transition plans, and execution checklists in the same place
- Say something is verified without showing what was actually run

agent-harness turns those failure modes into a repeatable workflow:

```
Scope → Solution → [Plan] → Build → Close
```

The point is not ceremony — it's making agent work reviewable, recoverable, and less likely to drift.

---

## What You Get

- **Task templates** — cover bug fixes, new features, refactors, UI adjustments, and cross-module changes.
- **Stage gates** — force the agent to record scope, selected solution, build deltas, and verification before closing out.
- **Autopilot rules** — gates are process records by default, with explicit pauses for unapproved public behavior changes.
- **Project adaptation layer** — captures repo facts, high-risk paths, and local rules.
- **Operations docs** — support long-running migrations and multi-stage remediation.
- **Lightweight process checks** — catch Markdown structure issues and known harness rule violations.

---

## 30-Second Example

Without a process layer:

```text
User: Fix the deployment page bug.
Agent: I changed three files. It should work now.
```

With agent-harness:

```text
Task type
Bug

Scope gate
- Symptom: deployment page fails when the selected host is missing.
- Boundary: keep API shape and routing unchanged.
- Expected behavior: show an actionable empty state.
- Verification: targeted unit test and smoke path.

Solution gate
- Target behavior: missing host renders the existing empty-state component.
- Chosen solution: normalize missing host in the selector and keep the route/API unchanged.
- Surface changes: none.
- Compatibility: persisted host data format stays unchanged.
- Verification impact: selector unit test plus deployment page smoke path.

Build gate
- Changed: store selector and DeploymentStatus empty-state branch.
- Kept: route names, API shape, persisted host data format.
- Deviated: no.

Close gate
- `npm run test:unit -- deploy-host-selection`: pass
- Manual smoke: deployment page empty state renders
- Not covered: real SSH connection
```

The agent still moves fast, but reviewers can see what it understood, what it changed, and what it didn't verify.

More examples:

- [Bug fix gate output](examples/bug-fix-gate-output.md)
- [Long-running remediation board](examples/long-running-remediation.md)

---

## Quick Start

### 1. Add submodule

```bash
git submodule add https://github.com/jxiaow/agent-harness.git harness/core
mkdir -p harness/project/rules
```

### 2. Tell the AI

> Read `harness/core/ONBOARD.md` and generate the profile and rules for this repository.

The AI will:

1. Scan your repo structure (package.json, directories, entry points, routes, etc.)
2. Generate `harness/project/profile.md` — project facts, module placement, high-risk paths, red lines
3. Generate `harness/project/rules/*.md` — project-specific rules based on identified risk points (typically 1–3 for simple projects, 5–8 for complex ones)
4. Generate `AGENTS.md` at repo root — workflow entry point with your project's hard constraints

### 3. Done

Your repo now has a complete agent workflow. Every AI agent that reads `AGENTS.md` will follow the gate process.

### What the generated profile looks like

`harness/project/profile.md` contains:

```markdown
# Project Profile

## Stack
(Tech stack: language, framework, build tools)

## Repository Shape
(Core directory tree, max 15 lines)

## Product Chain Map
(Main business chains, 3–8 items)

## Module Placement
(Table: where new code should go by type)

## High-Risk Changes
(Files requiring extra caution)

## Active Rules / Reading Sets
(Which rules to read by task type)

## Project Hard Constraints
(Red lines: what must not be bypassed)
```

---

## How It Works

```
harness/
├── core/                    ← submodule (generic, independently upgradable)
│   ├── AGENTS.template.md   # Template for root AGENTS.md
│   ├── ONBOARD.md           # AI reads this to set up a new project
│   ├── gates/               # Stage gate definitions
│   ├── templates/           # Task type templates (bug-fix, new-feature, etc.)
│   ├── rules/               # Generic rules (token-efficiency, test-failure-triage)
│   ├── automation/          # Process checks
│   ├── operations/          # Long-running initiative templates
│   ├── examples/            # Gate output examples
│   └── docs/                # Detailed references
│
└── project/                 ← project-specific (never overwritten by core updates)
    ├── profile.md           # Project facts, chains, placement, constraints
    └── rules/               # Project-specific rules
```

**core/** is generic — it defines the workflow, gates, and templates. It knows nothing about your project.

**project/** is specific — it contains your project's architecture facts, risk points, and red lines. The AI generates this for you based on your actual repo structure.

---

## Workflow

Every task follows:

```
1. Declare task type (bug / feature / refactor / UI / cross-module)
2. Scope gate — what we're solving, the approach, boundary, risk, how to verify
3. Solution gate — target behavior, selected solution, surface change, compatibility
4. (Long-running only) Plan gate — operations workspace and current work package
5. Implement
6. Build gate — what was actually changed, any deviation from Scope/Solution
7. Close gate — verification, unverified items, risk, final result
```

Gates are process records by default. The agent outputs them and keeps going unless there's a real blocker, or Solution gate exposes an unapproved public behavior decision such as a CLI/API/output/config/user-flow change.

Final Close gate target types:

- `single-task` — a bounded one-off task is complete and verified.
- `staged/ongoing` — a long-running phase has no actionable remaining item.
- `continuation` — the user said "continue/start/keep going"; inherit the active phase and continue.
- `explicit-closeout` — the user explicitly asked to stop, summarize, or pause.

---

## Auto Trigger

The agent automatically enters the workflow when it detects keywords:

| Keywords | Template |
| --- | --- |
| fix / bug / error | `bug-fix` |
| refactor / optimize / clean up | `refactor` |
| add / create / implement | `new-feature` |
| adjust / restyle | `ui-adjustment` |
| cross-module / affects multiple | `cross-module-change` |

---

## Compatibility

agent-harness is agent-agnostic. It works with any AI coding agent that reads Markdown instructions:

| Agent | How it picks up harness |
| --- | --- |
| Codex | Reads `AGENTS.md` at repo root |
| Claude Code | Reads `AGENTS.md` at repo root |
| Kiro | Reads `AGENTS.md` via steering rules |
| Gemini CLI | Reads `AGENTS.md` at repo root |
| Cursor | Reads `.cursorrules` or `AGENTS.md` |
| Custom agents | Point them at `AGENTS.md` |

No runtime dependency. No SDK. Just Markdown files that shape agent behavior.

---

## Update Core

```bash
cd harness/core && git pull origin main
cd ../.. && git add harness/core && git commit -m "chore: update harness core"
```

## Clone a Repo with Submodule

```bash
git clone --recurse-submodules <your-repo>
# or for existing clones:
git submodule update --init
```

---

## Optional npm Scripts

Add these to your `package.json` for convenient access:

```json
{
  "scripts": {
    "process:check": "node harness/core/automation/check-process.js",
    "harness:check": "node harness/core/automation/check-harness.js",
    "harness:ops:init": "node harness/core/operations/create-operation-docs.js",
    "harness:install-hooks": "node harness/core/automation/install-hooks.js"
  }
}
```

| Script | Purpose |
| --- | --- |
| `process:check` | Check Markdown structure and gate conventions |
| `harness:check` | Combined check — runs process + project entry checks sequentially |
| `harness:ops:init` | Create operations workspace for long-running initiatives |
| `harness:install-hooks` | Install git pre-commit hook to run harness:check on staged files |

Usage tips:
- Daily wrap-up: `npm run harness:check -- --changed --summary --max-issues 3`
- Pre-commit: `npm run harness:check -- --staged --summary`
- Auto pre-commit: `npm run harness:install-hooks` (one-time setup)
- Full scan: `npm run process:check`

---

## Troubleshooting

| Problem | Solution |
| --- | --- |
| AI doesn't enter the workflow automatically | Make sure `AGENTS.md` is at repo root and contains the auto-trigger keyword table. Some agents need a restart to pick up new files. |
| Submodule shows empty after clone | Run `git submodule update --init --recursive` |
| Submodule conflicts on merge | Run `git checkout --theirs harness/core && git submodule update --init` then verify the core version is acceptable |
| AI generates too many / too few rules | Edit `harness/project/rules/` manually. Rules should match real risk points, not theoretical completeness. |
| Gates feel too verbose | Gates are meant to be short bullets. If the AI writes paragraphs, remind it: "gates are process records, keep them to short bullets." |
| `check-process.js` reports false positives | Check if your Markdown follows the expected heading structure. Run with `--summary` to see which rules triggered. |

---

## More Documentation

- [Workflow reference](docs/workflow-reference.md) — full process rules, task sizes, execution model
- [Maintaining agent-harness](docs/maintaining.md) — how to evolve core without breaking projects
- [Workflow reference (Chinese)](docs/workflow-reference.zh-CN.md)
- [Maintaining (Chinese)](docs/maintaining.zh-CN.md)

---

## License

MIT. See [LICENSE](LICENSE).
