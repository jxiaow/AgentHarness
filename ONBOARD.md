# Onboard — AI Integration Instructions

This file is the single execution entry point when an AI agent integrates with a new project. After reading this file, execute directly without needing to read other documents.

## Trigger Condition

When the user says "integrate harness / generate profile / initialize workflow", execute the following steps.

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

Infer from the actual repository structure and output in the following format:

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

Create project-specific rule files in `harness/project/rules/`.

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

## Step 4: Generate `AGENTS.md`

Copy the content of `harness/core/AGENTS.template.md` to the repository root as `AGENTS.md`, then append the Project Hard Constraints from `profile.md` to the end of Hard Constraints.

---

## Step 5: Verify

- All paths in `profile.md` actually exist in the repository
- Repo Facts paths in rule files actually exist
- Write "no stable entry point found" for non-existent entries; do not fabricate

---

## Constraints

- Only write facts that already exist in the repository
- Rules should only describe patterns that are already stable, not one-off temporary conventions
- Do not modify generic rule files in `harness/core/rules/`
- When uncertain, write less rather than guess
