# Iterative Scope Control

## Goal

Prevent iterative conversations from accumulating into untracked cross-module changes. Ensure that even rapid back-and-forth exchanges produce proper scope records when the cumulative impact crosses a threshold.

## When To Apply

Every turn, before writing code. This rule operates continuously — it is not triggered by keywords.

---

## Two-Tier Classification

Classify each request by **what will actually change**, not by what the user said:

| Tier | Criteria (ALL must hold) | Process |
| --- | --- | --- |
| Patch | Single file, ≤15 lines changed, no interface/type/export signature change, no new dependency | Execute directly. No gate. |
| Task | Any of: multi-file, interface change, new export, data structure change, new message/command protocol, cross-directory | Full gate flow (Scope → Solution → Build → Close) |

**If uncertain, it is a Task.**

---

## Cumulative Escalation

Track cumulative session state. When **any** threshold is crossed, the current request and all subsequent requests in this session are Tasks regardless of individual size:

| Threshold | Trigger |
| --- | --- |
| File count | ≥ 5 distinct files modified in this session |
| Interface change | Any `interface`, `type`, or `export` signature modified |
| Cross-module | Changes span ≥ 2 top-level `src/` directories (e.g., `core/` + `ui/`, or `qt/` + `core/`) |
| Data flow | A stored data format (JSON schema, config file structure) is altered |

Once escalated, output Scope and Solution gates covering the cumulative work before continuing.

---

## Decision Procedure

```
1. Read the request
2. Assess: what files/interfaces/modules will this touch?
3. Check tier:
   - Meets ALL Patch criteria? → Execute directly
   - Otherwise → Task: output Scope and Solution gates, then implement
4. Check cumulative state:
   - Any threshold crossed? → Escalate: pause, output Scope and Solution gates for cumulative work
5. Proceed with implementation
```

---

## Hard Rules

- Classification is based on **actual change scope**, never on user phrasing or perceived urgency.
- "The user is iterating quickly" is not a reason to skip gates. Quick iteration is exactly when scope creep happens.
- A Patch that unexpectedly grows into multi-file during implementation must stop and retroactively output Scope and Solution gates before continuing.
- Scope only states the bounded problem. A Task that changes public commands, APIs, outputs, persistence, or user workflow must show the selected Solution before Build and pause if that exact direction is not already approved.
- Cumulative escalation cannot be reset within a single conversation session.
- Gate output remains compact (per existing output discipline). Do not use this rule as an excuse for verbose ceremony.

---

## Anti-Patterns

| Anti-pattern | Why it fails | Correct behavior |
| --- | --- | --- |
| "It's just one more small change" × 20 | Accumulates into untracked refactor | Escalation triggers at threshold |
| Keyword-only triggering | Misses "不好看", "去掉", "加一个" | Scope is assessed by change impact, not words |
| Gate on every single-line CSS tweak | Ceremony overhead kills flow | Patch tier exists for this |
| Skipping gate because user seems impatient | Produces untracked cross-module drift | Gate is 3-5 lines, not a blocker |

---

## Gate Format (When Escalated Mid-Session)

```text
Scope gate (cumulative escalation)
- Task type: ...
- Trigger: [file count ≥ 5 / interface change / cross-module / data flow change]
- Cumulative goal: ...
- Files touched so far: ...
- Remaining approach: ...
- Risk: ...
- Verification: ...

Solution gate (cumulative escalation)
- Target behavior: ...
- Chosen solution: ...
- Surface changes: ...
- Compatibility: ...
- Verification impact: ...
```

This is a retrospective + prospective gate: it acknowledges what was already done and scopes what remains.
