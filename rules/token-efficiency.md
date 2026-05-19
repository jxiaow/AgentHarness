# Token Efficiency

## Goal

Control agent context and command output volume without reducing conclusion quality; prevent the process itself from causing high token consumption.

---

## Decision Rules

### What scope to use

| Situation | Scope | Rationale |
| --- | --- | --- |
| Only changed process docs or harness core this turn | `--changed --summary --max-issues 3` | Minimal scan |
| Added new entry points, routes, pages, commands, or exports | `--summary --max-issues 3 <path>` | Only relevant paths |
| Preparing stage closeout or high-risk entry changes | Full lint / unit tests / build | Conclusion depends on broad results |
| Routine code change, no process doc touched | Skip process check entirely | Not relevant |

### When to expand scope

Only expand beyond `--changed` when:
- The current conclusion **depends** on files outside the diff
- Close gate needs to state "full test suite passed" as evidence
- A migration or rename could have broken references elsewhere

State the reason in Close gate before running a broad check.

### When NOT to run checks

- Do not run full test suites "for safety"
- Do not scan historical backlog as a daily default
- Do not re-read the same large file; reuse existing location results
- Do not paste full stdout into the conversation

### Output budget

- Commands: write the command and result only (1-2 lines)
- Failures: list at most 3-5 representative issues; summarize the rest by count
- Large reports: read `.tmp/harness-check-report.json` instead of pasting
- 50+ file scans: explain scope and necessity before running

---

## Command Reference

### Search

```bash
rg -n "pattern" <target-dir> --glob '!target/**' --glob '!node_modules/**' --glob '!dist/**'
```

### File listing

```bash
rg --files <target-dir> --glob '!target/**' --glob '!node_modules/**' --glob '!dist/**'
```

### Status (scoped)

```bash
git status --short -- <path-a> <path-b>
```

### File reading (locate + window)

```bash
rg -n "pattern" <file>          # locate line numbers
sed -n 'start,endp' <file>      # read fragment
```

### Automation tiers

| Level | Command | When |
| --- | --- | --- |
| `light` | `node harness/core/automation/check-process.js --changed --summary --max-issues 3` | Daily, per-turn |
| `targeted` | `node harness/core/automation/check-process.js --summary --max-issues 3 <path>` | Specific module |
| `full` | `npm run lint` / full test suite | Stage closeout, CI |

---

## Hard Rules

1. Searches exclude `target/`, `node_modules/`, `dist/` by default.
2. `git status` uses path parameters scoped to the current task.
3. Gate output stays compact; do not repeat historical conclusions.
4. Automation checks default to current changeset.
5. Harness process check passing ≠ business test passing.
6. If a broad check must run, explain why in Close gate.
