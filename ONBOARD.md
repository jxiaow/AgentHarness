# Onboard — AI Self-Service Integration

This file is the single instruction set for an AI agent to integrate agent-harness into any project. Read this file, then execute all steps autonomously.

---

## Step 0: Add Submodule (if not already present)

Check if `harness/core/` exists in the repository.

- If it does NOT exist, run:
  ```bash
  git submodule add https://github.com/jxiaow/agent-harness.git harness/core
  ```
- If it already exists, skip this step.

Create `harness/project/rules/` if it does not exist:
```bash
mkdir -p harness/project/rules
```

---

## Step 1: Read Repository Structure

Scan the following information; do not guess when uncertain:

- Package management files (package.json / Cargo.toml / go.mod / pyproject.toml / pom.xml etc.)
- Workspace / monorepo configuration
- Main source directories, test directories, documentation directories
- Build and toolchain configuration
- Application entry files
- Routing, state management, middleware, authentication, database layer (if present)

---

## Step 2: Generate `harness/project/profile.md`

If `harness/project/profile.md` already exists, read it and update only sections that are outdated or incomplete. Do not overwrite user-customized content.

If it does not exist, create it from the actual repository structure:

```markdown
# Project Profile

## Stack
(Tech stack: language, framework, build tools)

## Repository Shape
(Core directory tree, list only key directories, no more than 15 lines)

## Product Chain Map
(Main business chains, inferred from routes/entry points/services, 3-8 items)

## Module Placement
(Table: where new code should go, listed by type with paths)

## High-Risk Changes
(Files/directories requiring extra caution when modified, typically entry points, auth, config, database layer)

## Active Rules
(Table: project rules in rules/ and their applicable scenarios, fill in after generating rules)

## Reading Sets
(Table: which rule combinations to read by task type, fill in after generating rules)

## Project Hard Constraints
(Project red lines: what must not be bypassed, what must not be directly operated, what must be synced when changed)
```

---

## Step 3: Generate Project Rules

If `harness/project/rules/` already contains rule files, read them and only add new rules for risk points not yet covered. Do not overwrite or delete existing rules.

If the directory is empty, create project-specific rule files.

**Guiding principle:** Identify risk points in this repository where the agent is likely to make mistakes. Each risk point corresponds to one rule file. Common risk points include but are not limited to:

- Code placed in wrong location (unclear layering/placement)
- Bypassing existing mechanisms (auth, deduplication, state management)
- Breaking API contracts (routes, interface formats)
- Style/theme inconsistency
- Inconsistent cross-module communication patterns
- Coding style drift

**Number of rules:** Determine based on repository complexity — 1-3 for simple projects, 5-8 for complex ones. Do not generate unused rules just for "completeness".

**Structure for each rule file:**

```markdown
# [Rule Name]

## Goal
(What problem this rule prevents, 1-2 sentences)

## Repo Facts
(Actual directories, entry points, and dependency directions in the target repository)

## Core Rules
(Stable constraints that must be followed)

## Design Checklist
(What to confirm before implementation)

## Implementation Checklist
(What to check after implementation)

## Common Smells
(Mistakes the agent commonly makes)
```

After generating rules, backfill the Active Rules and Reading Sets in `profile.md`.

---

## Step 4: Generate or Merge `AGENTS.md`

### If `AGENTS.md` does NOT exist at repo root:

Copy the content of `harness/core/AGENTS.template.md` to the repository root as `AGENTS.md`, then append the Project Hard Constraints from `profile.md` to the end of Hard Constraints.

### If `AGENTS.md` ALREADY exists at repo root:

Do NOT overwrite it. Instead:

1. Read the existing `AGENTS.md` and `harness/core/AGENTS.template.md`.
2. Identify what is already covered in the existing file.
3. Merge missing sections from the template into the existing file:
   - If the existing file has no workflow section, add the Standard Workflow and gate flow.
   - If the existing file has no auto-trigger table, add it.
   - If the existing file has no hard constraints, add them.
   - If the existing file already has equivalent content (even with different wording), keep the existing version.
4. Add a Navigation section pointing to `harness/core/` paths if not already present.
5. Append Project Hard Constraints from `profile.md` if not already present.
6. Preserve all existing content that does not conflict with the harness workflow.

---

## Step 5: Install Pre-commit Hook (optional)

If the project uses git hooks and the user has not declined:

```bash
node harness/core/automation/install-hooks.js
```

If the hook cannot be installed (no `.git` directory, permissions issue, or user declined), skip and note it.

---

## Step 6: Verify

- All paths referenced in `profile.md` actually exist in the repository
- Repo Facts paths in rule files actually exist
- `AGENTS.md` exists at repo root and contains the workflow entry point
- Write "no stable entry point found" for non-existent entries; do not fabricate

---

## Constraints

- Only write facts that already exist in the repository
- Rules should only describe patterns that are already stable, not one-off temporary conventions
- Do not modify generic rule files in `harness/core/rules/`
- When uncertain, write less rather than guess
- Never overwrite user-customized content without explicit instruction
- If a conflict cannot be resolved automatically, explain the conflict and ask the user to choose
