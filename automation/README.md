# Automation

This directory contains process checks, entry checks, and rule-to-automation mappings.

## Current Files

| File | Purpose |
| --- | --- |
| `check-process.js` | Harness core process check (Markdown structure, gate conventions) |
| `check-entry.js` | Project entry check (configuration-driven; loads rules from `harness/project/entry-checks.json`) |
| `check-harness.js` | Combined check (runs process + entry sequentially) |
| `install-hooks.js` | Install harness git hooks (pre-commit by default) |
| `entry-checks.example.json` | Example configuration for entry checks |
| `rule-to-check-map.md` | Rule-to-automation mapping reference |

## Quick Use

```bash
# Daily wrap-up — only check current changes
node harness/core/automation/check-harness.js --changed --summary --max-issues 3

# Pre-commit — staged files check
node harness/core/automation/check-harness.js --staged --summary --max-issues 3

# Specific files/directories
node harness/core/automation/check-process.js --summary --max-issues 3 <path>

# Full check
node harness/core/automation/check-process.js
```

## Entry Check Configuration

Entry checks are project-specific and driven by a JSON config file. Place your config at `harness/project/entry-checks.json` or pass `--config <path>`.

To generate a starter config:

```bash
node harness/core/automation/check-entry.js --init
```

Each rule defines:

- `name` — rule identifier
- `filePattern` — regex matching candidate file paths
- `excludePattern` — (optional) regex to exclude certain paths
- `nameExtractor` — (optional) regex with capture group to extract the entry name
- `registryFile` — path to the file where entries should be registered
- `registryPatterns` — patterns to search in the registry (use `${name}` as placeholder)
- `message` — issue message (use `${name}` as placeholder)
- `contentChecks` — (optional) content-based checks on the file itself

See `entry-checks.example.json` for a complete example.

## Cost Control

- Default checks current changeset; does not scan historical backlog
- Checks display first 5 issues by default; adjust with `--max-issues`
- On bulk failures, use `--summary` to see rule distribution
- Detailed report written to `.tmp/harness-check-report.json`
- Full lint/test/build only for stage closeout or high-risk changes

## Git Hooks

To run harness checks automatically before each commit:

```bash
node harness/core/automation/install-hooks.js
```

This installs `.githooks/pre-commit` into `.git/hooks/` (uses `harness:check --staged --summary --max-issues 3`).

The script will not overwrite existing non-harness hook files unless you pass `--force`. To remove harness hooks later, use `--uninstall`.
