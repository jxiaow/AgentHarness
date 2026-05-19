# Token Efficiency

## Goal

Control agent context and command output volume without reducing conclusion quality; prevent the process itself from causing high token consumption.

## Default Rules

1. Searches default to limited scope, excluding build artifact directories:
   - `target/**`
   - `node_modules/**`
   - `dist/**`
2. Prefer running commands on target paths; do not scan the entire repo.
3. `git status` defaults to path parameters, only checking files relevant to the current task.
4. File reading uses "locate + window" mode:
   - First `rg -n` to locate line numbers
   - Then `sed -n 'start,endp'` to read the fragment
5. Truncate long output before making decisions:
   - `head -n`
   - `tail -n`
6. Avoid re-reading the same large file; prefer reusing existing location results when rechecking.
7. Gate output stays compact; do not repeat historical conclusions or template text.
8. Automation checks default to "current changeset"; do not scan historical backlog as a daily default.
9. Command output retains only the summary needed for decisions; if many issues exist, first output count, rule names, and first few locations.

## Automation Cost Budget

Automation executes in cost tiers, starting from lowest cost by default:

| Level      | Default use                    | Command example                                                                       | Token strategy                                    |
| ---------- | ------------------------------ | ------------------------------------------------------------------------------------- | ------------------------------------------------- |
| `light`    | Daily dev, agent per-turn wrap | `node harness/core/automation/check-process.js --changed --summary --max-issues 3`    | Only scan changed process docs                    |
| `targeted` | Specific module verification   | `node harness/core/automation/check-process.js --summary --max-issues 3 <path>`       | Only pass relevant files/dirs, not full repo      |
| `full`     | Stage closeout, CI, pre-migration | `npm run lint` / full test suite                                                   | Only run when Close gate explains why      |

Default choices:

1. Only changed process docs or harness core this turn: run `node harness/core/automation/check-process.js --changed --summary --max-issues 3`
2. Added new entry points, routes, pages, commands, or exports: run project entry checks or `node harness/core/automation/check-process.js --summary --max-issues 3 <path>`
3. Preparing stage closeout or high-risk entry changes: add lint / unit tests / build

Do not run full test suites "for safety"; only when the current conclusion depends on full results.

## Output Budget

- When running checks, only write the command and result in the final reply; do not paste full stdout.
- On check failure, list at most 3-5 representative issues; summarize the rest by count.
- When full location info is needed, prefer reading `.tmp/harness-check-report.json`; do not paste the full issue list into the conversation.
- When long output needs further analysis, save or locate first, then read the relevant window.
- If a check would scan 50+ files, first explain the scan scope and why it is necessary.

## Command Patterns

- Search:
  - `rg -n "pattern" <target-dir> --glob '!target/**' --glob '!node_modules/**' --glob '!dist/**'`
- File listing:
  - `rg --files <target-dir> --glob '!target/**' --glob '!node_modules/**' --glob '!dist/**'`
- Status:
  - `git status --short -- <path-a> <path-b>`

## Verification Expectation

- Verification commands also follow the minimum scope principle; only run checks relevant to current changes.
- If a broad-scope check must be run, explain the reason and scope in Close gate.
- Harness process check passing cannot be described as business test passing; it only proves process docs and connected project checks pass.
